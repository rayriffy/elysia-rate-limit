import Elysia from 'elysia'
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
    app.onBeforeHandle(async ({ set, request }) => {
      if ((await options.skip(request)) === false) {
        const clientKey = await options.generator(request, app.server)

        logger('generator', 'generated key is %s', clientKey)

        const { count, nextReset } = await options.context.increment(clientKey)

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

        // Don't apply any rate limiting if in the allow list
        if (options.allowList) {
          if (typeof options.allowList === 'function') {
            if (await options.allowList(request, clientKey)) {
              return
            }
          } else if (options.allowList.indexOf(clientKey) !== -1) {
            return
          }
        }

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
      if (options.countFailedRequest === false) {
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
