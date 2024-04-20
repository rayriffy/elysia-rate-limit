import type Elysia from 'elysia'

import { defaultOptions } from '../constants/defaultOptions'

import type { Options } from '../@types/Options'
import { logger } from './logger'

export const plugin = (userOptions?: Partial<Options>) => {
  const options: Options = {
    ...defaultOptions,
    ...userOptions,
  }

  options.context.init(options)

  return (app: Elysia) => {
    // @ts-expect-error somehow qi is being sent from elysia, but there's no type declaration for it
    app.onBeforeHandle({ as: options.scoping }, async ({ set, request, query, path, store, cookie, error, body, params, headers, qi, ...rest }) => {
      let clientKey: string | undefined

      /**
       * if a skip option has two parameters,
       * then we will generate clientKey ahead of time.
       * this is made to skip generating key unnecessary if only check for request
       * and saving some cpu consumption when actually skipped
       */
      if (options.skip.length >= 2)
        clientKey = await options.generator(request, app.server, rest)

      // if decided to skip, then do nothing and let the app continue
      if (await options.skip(request, clientKey) === false) {
        /**
         * if a skip option has less than two parameters,
         * that's mean clientKey does not have a key yet
         * then generate one
         */
        if (options.skip.length < 2)
          clientKey = await options.generator(request, app.server, rest)

        const { count, nextReset } = await options.context.increment(clientKey!)

        const payload = {
          limit: options.max,
          current: count,
          remaining: Math.max(options.max - count, 0),
          nextReset,
        }

        // set standard headers
        const reset = Math.max(0, Math.ceil((nextReset.getTime() - Date.now()) / 1000))
        set.headers['RateLimit-Limit'] = String(options.max)
        set.headers['RateLimit-Remaining'] = String(payload.remaining)
        set.headers['RateLimit-Reset'] = String(reset)

        // reject if limit were reached
        if (payload.current >= payload.limit + 1) {
          logger('plugin', 'rate limit exceeded for clientKey: %s (resetting in %d seconds)', clientKey, reset)

          set.headers['Retry-After'] = String(
            Math.ceil(options.duration / 1000)
          )
          set.status = options.responseCode
          return options.responseMessage
        }

        logger('plugin', 'clientKey %s passed through with %d/%d request used (resetting in %d seconds)', clientKey, options.max - payload.remaining, options.max, reset)
      }
    })

    // @ts-expect-error somehow qi is being sent from elysia, but there's no type declaration for it
    app.onError({ as: options.scoping }, async ({ set, request, query, path, store, cookie, error, body, params, headers, qi, code, ...rest }) => {
      if (!options.countFailedRequest) {
        const clientKey = await options.generator(request, app.server, rest)

        logger('plugin', 'request failed for clientKey: %s, refunding', clientKey)
        await options.context.decrement(clientKey)
      }
    })

    app.onStop(async () => {
      logger('plugin', 'kill signal received')
      await options.context.kill()
    })

    return app
  }
}
