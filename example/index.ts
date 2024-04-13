import { Elysia } from 'elysia'

import { ip } from '../node_modules/elysia-ip/src'
import { rateLimit } from '../src'

const app = new Elysia()
  .use(ip())
  .use(rateLimit())
  .get('/', () => 'hello')
  .listen(3000)
