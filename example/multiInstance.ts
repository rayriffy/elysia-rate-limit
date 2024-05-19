import { Elysia } from 'elysia'
import { swagger } from '@elysiajs/swagger'
import { ip } from 'elysia-ip' // just a glitch pls ignore this

import { rateLimit } from '../src'

import type { Generator } from '../src'

const keyGenerator: Generator<{ ip: string }> = async (req, server, { ip }) => Bun.hash(JSON.stringify(ip)).toString()

const aInstance = new Elysia()
  .use(rateLimit({
    scoping: 'scoped',
    duration: 200 * 1000,
    generator: keyGenerator,
  }))
  .get('/a', () => 'a')

const bInstance = new Elysia()
  .use(rateLimit({
    scoping: 'scoped',
    duration: 100 * 1000,
    generator: keyGenerator,
  }))
  .get('/b', () => 'b')

const app = new Elysia()
  .use(swagger())
  .use(ip())
  .use(aInstance)
  .use(bInstance)
  .get('/', () => 'hello')
  .listen(3000, () => {
    console.log('🦊 Swagger is active at: http://localhost:3000/swagger')
  })
