import { run, bench, boxplot, summary } from 'mitata'
import { Elysia } from 'elysia'
import { rateLimit } from '../src'

const appWithoutRateLimit = new Elysia()
  .get('/', () => 'ok')

const appWithRateLimit = new Elysia()
  .use(rateLimit({
    generator: () => 'static-ip'
  }))
  .get('/', () => 'ok')

const appWithRateLimitCustom = new Elysia()
  .use(rateLimit({
    max: 10000,
    duration: 60000,
    generator: () => 'static-ip'
  }))
  .get('/', () => 'ok')

boxplot(() => {
  summary(() => {
    bench('Without Rate Limit', async () => {
      await appWithoutRateLimit.handle(new Request('http://localhost/'))
    })

    bench('With Rate Limit (Default)', async () => {
      await appWithRateLimit.handle(new Request('http://localhost/'))
    })

    bench('With Rate Limit (Custom)', async () => {
      await appWithRateLimitCustom.handle(new Request('http://localhost/'))
    })
  })
})

await run()
