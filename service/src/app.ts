import { Application } from 'https://deno.land/x/abc/mod.ts'
import { logger } from 'https://deno.land/x/abc/middleware/logger.ts'
import { cors } from 'https://deno.land/x/abc/middleware/cors.ts'
import maybe from 'https://raw.githubusercontent.com/MergHQ/denofun/maybe-get-or-else/lib/maybe.ts'

import { fetchDevices, postDevice, DevicePostBody, getDataFor } from './api/devices.ts'
import { sendBeerQuestionTo } from './service/twilio.ts'
const app = new Application()


app
  .use(logger())
  .use(cors())
  .get('/', ctx => ctx.json({ hello: 'world' }))
  .get('/health', ctx => ctx.json({ ok: true }))
  .get('/api/devices', ctx =>
    fetchDevices(ctx.queryParams.devices ? ctx.queryParams.devices.split(',') : [])
      .then(devices => ctx.json(devices))
      .catch(e => {
        console.error(e)
        ctx.json({ fuck: 'server is fucked' }, 500)
      })
    )
  .post('/api/devices', async ctx => {
    const body: DevicePostBody = await ctx.body()
    if (!body.mac || !body.meta || !body.pushNotificationId) {
      return ctx.json({ fuck: 'invalid post body' }, 400)
    }
    return postDevice(body)
      .then(device => ctx.json(device))
      .catch(e => {
        console.error(e)
        ctx.json({ fuck: 'server is fucked' }, 500)
      })
  })
  .post('/api/devices/askForBeer', async ctx => {
    const body: { macAddrs: string[] } = await ctx.body()
    if (!body.macAddrs) {
      return ctx.json({ fuck: 'invalid post body' }, 400)
    }
    return getDataFor(body.macAddrs)
      .then(data =>
        data.length > 0 ?
        Promise.all(data.map(({ meta }) => sendBeerQuestionTo(meta.phone))) :
        Promise.resolve([])
      )
      .then(() => ctx.json({ success: true }))
      .catch(e => {
        console.error(e)
        ctx.json({ fuck: 'server is fucked' }, 500)
      })
  })
  .start({
    port: maybe(Deno.env.get('PORT'))
      .map(Number)
      .getOrElse(3000)
  })
