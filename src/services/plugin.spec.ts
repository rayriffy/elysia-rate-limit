import { describe, expect, it, mock } from 'bun:test'
import { Elysia, t } from 'elysia'
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
    const contextPlugin = new Elysia().derive('global', () => ({
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

  it('should rate limit malformed JSON requests', async () => {
    const app = new Elysia()
      .use(plugin({ max: 2, duration: 60000, scoping: 'global' }))
      .post(
        '/login',
        {
          body: t.Object({ email: t.String() }),
        },
        () => ({ ok: true })
      )

    const responses = []
    for (let index = 0; index < 3; index++) {
      responses.push(
        await app.handle(
          new Request('http://localhost/login', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: '{not-json',
          })
        )
      )
    }

    expect(responses.map(response => response.status)).toEqual([400, 400, 429])
    expect(
      responses.map(response => response.headers.get('RateLimit-Remaining'))
    ).toEqual(['1', '0', '0'])
  })

  it('should rate limit request validation failures', async () => {
    const app = new Elysia()
      .use(plugin({ max: 2, duration: 60000, scoping: 'global' }))
      .post(
        '/login',
        {
          body: t.Object({ email: t.String() }),
        },
        () => ({ ok: true })
      )

    const responses = []
    for (let index = 0; index < 3; index++) {
      responses.push(
        await app.handle(
          new Request('http://localhost/login', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: '{}',
          })
        )
      )
    }

    expect(responses.map(response => response.status)).toEqual([422, 422, 429])
    expect(
      responses.map(response => response.headers.get('RateLimit-Remaining'))
    ).toEqual(['1', '0', '0'])
  })

  it('should not double count response validation failures', async () => {
    const app = new Elysia()
      .use(
        plugin({
          max: 2,
          duration: 60000,
          scoping: 'global',
          countFailedRequest: true,
        })
      )
      .get(
        '/response',
        {
          response: t.Object({ ok: t.Boolean() }),
        },
        () => ({ ok: 'not-a-boolean' })
      )

    const responses = []
    for (let index = 0; index < 3; index++)
      responses.push(await app.handle(new Request('http://localhost/response')))

    expect(responses.map(response => response.status)).toEqual([422, 422, 429])
    expect(
      responses.map(response => response.headers.get('RateLimit-Remaining'))
    ).toEqual(['1', '0', '0'])
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

  it('should fail-closed when duration resolves to NaN', async () => {
    const app = new Elysia()
      .use(plugin({
        max: 10,
        duration: () => NaN,
        scoping: 'global',
      }))
      .get('/test', () => 'ok')

    const response = await app.handle(new Request('http://localhost/test'))
    expect(response.status).toBe(429)
    expect(await response.text()).toBe('rate-limit reached')
  })

  it('should fail-closed when duration resolves to 0 or negative', async () => {
    const app = new Elysia()
      .use(plugin({
        max: 10,
        duration: () => -1000,
        scoping: 'global',
      }))
      .get('/test', () => 'ok')

    const response = await app.handle(new Request('http://localhost/test'))
    expect(response.status).toBe(429)
    expect(await response.text()).toBe('rate-limit reached')
  })

  it('should not deduplicate distinct plugins when max and duration are dynamic functions', async () => {
    // Both plugins use dynamic max and duration, but they should be registered separately
    const plugin1 = plugin({
      max: () => 2,
      duration: () => 60000,
      scoping: 'global',
      headers: true,
    })

    const plugin2 = plugin({
      max: () => 5,
      duration: () => 10000,
      scoping: 'global',
      headers: true,
    })

    const app = new Elysia()
      .use(plugin1)
      .get('/test1', () => 'ok')
      
    const app2 = new Elysia()
      .use(plugin2)
      .get('/test2', () => 'ok')

    // If deduplication bug exists, plugin2 is ignored, so max limit is 2.
    const r1 = await app.handle(new Request('http://localhost/test1'))
    const r2 = await app.handle(new Request('http://localhost/test1'))
    const r3 = await app.handle(new Request('http://localhost/test1'))

    // Since plugin1 is registered first and has max: 2, the 3rd request should be 429
    expect(r3.status).toBe(429)

    // Now test a separate route that only uses plugin2
    const p2_r1 = await app2.handle(new Request('http://localhost/test2'))
    const p2_r2 = await app2.handle(new Request('http://localhost/test2'))
    const p2_r3 = await app2.handle(new Request('http://localhost/test2'))
    const p2_r4 = await app2.handle(new Request('http://localhost/test2'))
    const p2_r5 = await app2.handle(new Request('http://localhost/test2'))
    const p2_r6 = await app2.handle(new Request('http://localhost/test2'))

    expect(p2_r3.status).toBe(200) // If bug existed, this would have been 429 because it used plugin1's max: 2
    expect(p2_r5.status).toBe(200)
    expect(p2_r6.status).toBe(429) // Correctly respects plugin2's max: 5
  })

  it('should fail-closed when max resolves to NaN or negative', async () => {
    const app = new Elysia()
      .use(plugin({
        max: () => -10,
        duration: 60000,
        scoping: 'global',
      }))
      .get('/test', () => 'ok')

    const response = await app.handle(new Request('http://localhost/test'))
    expect(response.status).toBe(429)
    expect(await response.text()).toBe('rate-limit reached')
  })

  it('should return cloned Response when limit is reached and errorResponse is a Response', async () => {
    const customResponse = new Response('Too Many Requests Custom', { status: 429, headers: { 'X-Custom': '1' } })
    const app = new Elysia()
      .use(plugin({
        max: 1,
        duration: 60000,
        scoping: 'global',
        errorResponse: customResponse,
        headers: true,
      }))
      .get('/test', () => 'ok')

    await app.handle(new Request('http://localhost/test'))
    const response = await app.handle(new Request('http://localhost/test'))
    
    expect(response.status).toBe(429)
    expect(response.headers.get('X-Custom')).toBe('1')
    expect(response.headers.has('RateLimit-Reset')).toBe(true)
    expect(await response.text()).toBe('Too Many Requests Custom')
  })

  it('should pre-generate clientKey if skip has 2 parameters', async () => {
    let skipCalledWithKey: string | undefined
    const app = new Elysia()
      .use(plugin({
        max: 10,
        scoping: 'global',
        skip: (req, key) => {
          skipCalledWithKey = key
          return false
        }
      }))
      .get('/test', () => 'ok')

    await app.handle(new Request('http://localhost/test'))
    expect(skipCalledWithKey).toBeDefined()
    expect(typeof skipCalledWithKey).toBe('string')
  })

  it('should refund rate limit if countFailedRequest is false and request fails', async () => {
    const app = new Elysia()
      .use(plugin({
        max: 2,
        duration: 60000,
        scoping: 'global',
        countFailedRequest: false,
      }))
      .get('/fail', () => {
        throw new Error('Something went wrong')
      })
      .get('/success', () => 'ok')

    // Request 1 fails, should be refunded
    const r1 = await app.handle(new Request('http://localhost/fail'))
    expect(r1.status).toBe(500)

    // Request 2 fails, should be refunded
    const r2 = await app.handle(new Request('http://localhost/fail'))
    expect(r2.status).toBe(500)

    // Request 3 succeeds, should pass because previous ones were refunded
    const r3 = await app.handle(new Request('http://localhost/success'))
    expect(r3.status).toBe(200)

    // Request 4 succeeds, should pass
    const r4 = await app.handle(new Request('http://localhost/success'))
    expect(r4.status).toBe(200)

    // Request 5 should be rate limited
    const r5 = await app.handle(new Request('http://localhost/success'))
    expect(r5.status).toBe(429)
  })

  it('should call context.kill on stop', async () => {
    const customContext = new DefaultContext()
    const killSpy = mock(() => Promise.resolve())
    customContext.kill = killSpy

    const app = new Elysia()
      .use(plugin({
        context: customContext,
        scoping: 'global',
      }))
      .listen(0)

    await app.stop()

    expect(killSpy).toHaveBeenCalled()
  })
})
