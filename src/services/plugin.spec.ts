import { describe, expect, it, mock } from 'bun:test'
import { Elysia } from 'elysia'
import type { Generator } from '../@types/Generator'
import type { Options } from '../@types/Options'
import { DefaultContext } from './defaultContext'
import { plugin } from './plugin'

describe('rate limit plugin', () => {
  it('should initialize with default options', () => {
    const app = new Elysia()
    const rateLimitPlugin = plugin()
    const appWithPlugin = rateLimitPlugin(app)

    expect(appWithPlugin).toBeInstanceOf(Elysia)
  })

  it('should accept custom options', () => {
    const app = new Elysia()
    const customContext = new DefaultContext()
    const initSpy = mock((options: Omit<Options, 'context'>) => {})
    customContext.init = initSpy

    const rateLimitPlugin = plugin({
      max: 10,
      duration: 60000,
      context: customContext,
    })

    const appWithPlugin = rateLimitPlugin(app)

    expect(appWithPlugin).toBeInstanceOf(Elysia)
    expect(initSpy).toHaveBeenCalled()
  })

  it('should not consume the raw request body for POST routes', async () => {
    const app = new Elysia()
      .use(plugin({ max: 100, scoping: 'global' }))
      .post('/webhook', async ({ request }) => {
        const rawBody = await request.text()
        return { rawBody }
      })

    const payload = JSON.stringify({ event: 'payment.success', id: '123' })

    const response = await app.handle(
      new Request('http://localhost/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      })
    )

    const text = await response.text()
    const result = JSON.parse(text)
    expect(result.rawBody).toBe(payload)
  })

  it('should not interfere with raw body reading on text/plain routes', async () => {
    const app = new Elysia()
      .use(plugin({ max: 100, scoping: 'global' }))
      .post('/hook', async ({ request }) => {
        const rawBody = await request.text()
        return { rawBody }
      })

    const payload = 'raw text body for signature verification'

    const response = await app.handle(
      new Request('http://localhost/hook', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: payload,
      })
    )

    const text = await response.text()
    const result = JSON.parse(text)
    expect(result.rawBody).toBe(payload)
  })

  it('should forward derived context properties to custom generators', async () => {
    const receivedDerived: Record<string, unknown>[] = []

    const customGenerator: Generator<{ customProp: string }> = async (
      _request,
      _server,
      derived
    ) => {
      receivedDerived.push(derived)
      return 'test-key'
    }

    // Simulate a plugin that adds a custom property to the Elysia context,
    // similar to how elysia-ip adds an `ip` property.
    const contextPlugin = new Elysia().derive({ as: 'global' }, () => ({
      customProp: 'hello-from-plugin',
    }))

    const app = new Elysia()
      .use(contextPlugin)
      .use(plugin({ max: 100, scoping: 'global', generator: customGenerator }))
      .get('/test', () => 'ok')

    await app.handle(new Request('http://localhost/test'))

    expect(receivedDerived.length).toBeGreaterThan(0)
    expect(receivedDerived[0].customProp).toBe('hello-from-plugin')
  })

  it('should rate limit not found routes', async () => {
    const app = new Elysia()
      .use(plugin({ max: 2, duration: 60000, scoping: 'global' }))
      .get('/known', () => 'ok')

    const r1 = await app.handle(new Request('http://localhost/unknown-route'))
    const r2 = await app.handle(new Request('http://localhost/unknown-route'))
    const r3 = await app.handle(new Request('http://localhost/unknown-route'))

    expect(r1.status).toBe(404)
    expect(r2.status).toBe(404)
    expect(r3.status).toBe(429)
  })

  it('should support dynamic duration as a function', async () => {
    const durations: string[] = []

    const app = new Elysia()
      .use(plugin({
        max: 2,
        duration: (_key, _request) => {
          durations.push(_key)
          return 60000
        },
        scoping: 'global',
        headers: true,
      }))
      .get('/test', () => 'ok')

    const r1 = await app.handle(new Request('http://localhost/test'))
    const r2 = await app.handle(new Request('http://localhost/test'))
    const r3 = await app.handle(new Request('http://localhost/test'))

    expect(r1.status).toBe(200)
    expect(r2.status).toBe(200)
    expect(r3.status).toBe(429)
    expect(durations.length).toBeGreaterThan(0)
  })

  it('should set Retry-After header equal to RateLimit-Reset (not effectiveDuration of blocked request)', async () => {
    const app = new Elysia()
      .use(plugin({
        max: 1,
        // First request opens a 60s window. Second request evaluates to 10s.
        duration: (key, req) => req.url.includes('free') ? 60000 : 10000,
        scoping: 'global',
        headers: true,
      }))
      .get('/premium', () => 'premium')
      .get('/free', () => 'free')

    await app.handle(new Request('http://localhost/free'))
    const r2 = await app.handle(new Request('http://localhost/premium'))

    expect(r2.status).toBe(429)
    expect(r2.headers.get('Retry-After')).toBe('60')
    expect(r2.headers.get('RateLimit-Reset')).toBe('60')
  })

  it('should fail-closed with 429 when dynamic duration throws an error', async () => {
    const app = new Elysia()
      .use(plugin({
        max: 10,
        duration: () => {
          throw new Error('Database connection failed')
        },
        scoping: 'global',
      }))
      .get('/test', () => 'ok')

    const response = await app.handle(new Request('http://localhost/test'))
    expect(response.status).toBe(429)
    expect(await response.text()).toBe('rate-limit reached')
  })

  it('should fail-closed with custom error response when dynamic max throws an error', async () => {
    const app = new Elysia()
      .use(plugin({
        max: async () => {
          throw new Error('Database connection failed')
        },
        errorResponse: new Response('custom error', { status: 418 }),
        scoping: 'global',
      }))
      .get('/test', () => 'ok')

    const response = await app.handle(new Request('http://localhost/test'))
    expect(response.status).toBe(418)
    expect(await response.text()).toBe('custom error')
  })
})
