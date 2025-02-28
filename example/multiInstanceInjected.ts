import { Elysia } from 'elysia'
import { swagger } from '@elysiajs/swagger'

import { rateLimit } from '../src'

import type { Options } from '../src'
import type { Server } from 'bun'

let server: Server | null

const options: Partial<Options> = {
  scoping: 'scoped',
  duration: 200 * 1000,
  injectServer: () => {
    return server!
  },
}

// const keyGenerator: Generator<{ ip: string }> = async (req, server, { ip }) => Bun.hash(JSON.stringify(ip)).toString()

const aInstance = new Elysia().use(rateLimit(options)).get('/a', () => 'a')

const bInstance = new Elysia().use(rateLimit(options)).get('/b', () => 'b')

const app = new Elysia()
  .use(swagger())
  .use(aInstance)
  .use(bInstance)
  .get('/', () => 'hello')
  .listen(3000, () => {
    console.log('🦊 Swagger is active at: http://localhost:3000/swagger')
  })

server = app.server
