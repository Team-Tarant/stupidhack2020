import { Application } from 'https://deno.land/x/abc/mod.ts'
import { logger } from 'https://deno.land/x/abc/middleware/logger.ts'
import { cors } from 'https://deno.land/x/abc/middleware/cors.ts'
import maybe from 'https://raw.githubusercontent.com/MergHQ/denofun/maybe-get-or-else/lib/maybe.ts'

const app = new Application()

app
  .use(logger())
  .use(cors())
  .get('/', ctx => ctx.json({ hello: 'world' }))
  .get('/health', ctx => ctx.json({ ok: true }))
  .start({
    port: maybe(Deno.env.get('PORT'))
      .map(Number)
      .getOrElse(3000)
  })
