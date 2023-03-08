import { Context } from '../context'
import { defaultOptions } from '../constants/defaultOptions'

import Elysia from 'elysia'
import type { Options } from '../@types/Options'

export const plugin = (userOptions?: Partial<Options>) => {
  const options: Options = {
    ...defaultOptions,
    ...userOptions,
  }

  const context = new Context(options)

  return (app: Elysia) => {
    app.onBeforeHandle(async ({ set, request, store }) => {
      const clientKey = await options.generator(request)

      const { count, nextReset } = await context.increment(clientKey)

      const payload = {
        limit: options.max,
        current: count,
        remaining: Math.max(options.max - count, 0),
        nextReset,
      }

      // set standard headers
      set.headers['RateLimit-Limit'] = String(options.max)
      set.headers['RateLimit-Remaining'] = String(payload.remaining)
      set.headers['RateLimit-Reset'] = String(
        Math.max(0, Math.ceil((nextReset.getTime() - Date.now()) / 1000))
      )

      // reject if limit were reached
      if (payload.current >= payload.limit + 1) {
        set.headers['Retry-After'] = String(Math.ceil(options.duration / 1000))
        set.status = options.responseCode
        return options.responseMessage
      }
    })

    app.onError(async ({ request }) => {
      const clientKey = await options.generator(request)
      await context.decrement(clientKey)
    })

    app.onStop(() => {
      context.kill()
    })

    return app
  }
}
