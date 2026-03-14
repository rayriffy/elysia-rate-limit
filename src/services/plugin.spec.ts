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
})
