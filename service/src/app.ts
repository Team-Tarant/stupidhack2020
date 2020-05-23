import { Application } from 'https://deno.land/x/abc/mod.ts'
import { logger } from 'https://deno.land/x/abc/middleware/logger.ts'
import { cors } from 'https://deno.land/x/abc/middleware/cors.ts'
import maybe from 'https://raw.githubusercontent.com/MergHQ/denofun/maybe-get-or-else/lib/maybe.ts'
import { fetchDevices, postDevice, DevicePostBody, getDataFor, sendPushMessages, sendTarantedNotification } from './api/devices.ts'
import { DiscoveryPostBody, addDiscovery, fetchDiscoveriesFor } from './api/discoveries.ts'

const app = new Application()
app
  .use(logger())
  .use(cors())
  .get('/health', ctx => ctx.json({ ok: true }))
  .post('/api/discoveries', async ctx => {
    const body: DiscoveryPostBody = await ctx.body()
    if (!body.columbus || !body.america) {
      return ctx.json({ fuck: 'invalid post body' }, 400)
    }

    return addDiscovery(body)
      .then(discovery => ctx.json(discovery))
      .catch(e => {
        console.error(e)
        ctx.json({ fuck: 'server is fucked' }, 500)
      })
  })
  .get('/api/discoveries/:id', ctx => fetchDiscoveriesFor(ctx.params.id).then(discoveries => ctx.json(discoveries)))
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
    if (!body.mac || !body.meta) {
      return ctx.json({ fuck: 'invalid post body' }, 400)
    }
    return postDevice(body)
      .then(device => ctx.json(device))
      .catch(e => {
        console.error(e)
        ctx.json({ fuck: 'server is fucked' }, 500)
      })
  })
  .post('/api/devices/sendPushMessages', async ctx => {
    const body: { deviceIds: string[] } = await ctx.body()
    return sendPushMessages(body.deviceIds)
      .then()
      .then(() => ctx.json({ bar: 'beeristä' }))
      .catch(e => {
        console.error(e)
        ctx.json({ fuck: 'server is fucked' }, 500)
      })
  })
  .post('/api/devices/iAmTaranted/:mac', async ctx => {
    const discoveredForHost = await fetchDiscoveriesFor(ctx.params.mac)
    return sendTarantedNotification(discoveredForHost, ctx.params.mac)
      .then()
      .then(() => ctx.json({ bar: 'beeristä' }))
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
