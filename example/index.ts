import { Elysia } from 'elysia'

import { rateLimit } from '../src'

const app = new Elysia()
  .use(rateLimit())
  .get('/', () => 'hello')
  .listen(3000)
