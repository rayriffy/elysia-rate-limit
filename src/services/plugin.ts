import type Elysia from 'elysia'
import debug from 'debug'

import { defaultOptions } from '../constants/defaultOptions'

import type { Options } from '../@types/Options'

const logger = (unit: string, formatter: any, ...params: any[]) =>
  debug('elysia-rate-limit:' + unit)(formatter, ...params)

export const plugin = (userOptions?: Partial<Options>) => {
  const options: Options = {
    ...defaultOptions,
    ...userOptions,
  }

  options.context.init(options)

  return (app: Elysia) => {
    app.onBeforeHandle({ as: 'global' }, async ({ set, request }) => {
      let clientKey: string | undefined

      /**
       * if a skip option has two parameters,
       * then we will generate clientKey ahead of time.
       * this is made to skip generating key unnecessary if only check for request
       * and saving some cpu consumption when actually skipped
       */
      if (options.skip.length >= 2)
        clientKey = await options.generator(request, app.server)

      // if decided to skip, then do nothing and let the app continue
      if (await options.skip(request, clientKey) === false) {
        /**
         * if a skip option has less than two parameters,
         * that's mean clientKey does not have a key yet
         * then generate one
         */
        if (options.skip.length < 2)
          clientKey = await options.generator(request, app.server)

        logger('generator', 'generated key is %s', clientKey)

        const { count, nextReset } = await options.context.increment(clientKey!)

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
          set.headers['Retry-After'] = String(
            Math.ceil(options.duration / 1000)
          )
          set.status = options.responseCode
          return options.responseMessage
        }
      }
    })

    app.onError(async ({ request }) => {
      if (!options.countFailedRequest) {
        const clientKey = await options.generator(request, app.server)
        await options.context.decrement(clientKey)
      }
    })

    app.onStop(async () => {
      await options.context.kill()
    })

    return app
  }
}
