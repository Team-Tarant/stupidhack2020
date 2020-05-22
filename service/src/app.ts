import { Application } from 'https://deno.land/x/abc/mod.ts'
import { logger } from 'https://deno.land/x/abc/middleware/logger.ts'
import { cors } from 'https://deno.land/x/abc/middleware/cors.ts'
import maybe from 'https://raw.githubusercontent.com/MergHQ/denofun/maybe-get-or-else/lib/maybe.ts'

import { fetchDevices, postDevice } from './api/devices.ts'
const app = new Application()


app
  .use(logger())
  .use(cors())
  .get('/', ctx => ctx.json({ hello: 'world' }))
  .get('/health', ctx => ctx.json({ ok: true }))
  .get('/api/devices', ctx =>
    fetchDevices()
      .then(devices => ctx.json(devices))
      .catch(e => ctx.json({ fuck: e }, 500))
    )
  .post('/api/devices', ctx =>
    postDevice(ctx.body)
      .then(() => ctx.json({ msg: 'beeristä' }))
      .catch(e => ctx.json({fuck: e}, 500))
  )
  .start({
    port: maybe(Deno.env.get('PORT'))
      .map(Number)
      .getOrElse(3000)
  })
