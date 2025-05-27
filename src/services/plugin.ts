import Elysia from 'elysia'

import { defaultOptions } from '../constants/defaultOptions'
import { DefaultContext } from './defaultContext'

import { logger } from './logger'

import type { Options } from '../@types/Options'

export const plugin = (userOptions?: Partial<Options>) => {
  const options: Options = {
    ...defaultOptions,
    ...userOptions,
    context: userOptions?.context ?? new DefaultContext(),
  }

  options.context.init(options)

  // NOTE:
  // do not make plugin to return async
  // otherwise request will be triggered twice
  return (app: Elysia) => {
    const plugin = new Elysia({
      name: 'elysia-rate-limit',
      seed: options.max,
    })

    plugin.onBeforeHandle(
      { as: options.scoping },
      async function onBeforeHandleRateLimit({
        set,
        request,
        query,
        path,
        store,
        cookie,
        error,
        body,
        params,
        headers,
        // @ts-expect-error somehow qi is being sent from elysia, but there's no type declaration for it
        qi,
        ...rest
      }) {
        let clientKey: string | undefined

        /**
         * if a skip option has two parameters,
         * then we will generate clientKey ahead of time.
         * this is made to skip generating key unnecessary if only check for request
         * and saving some cpu consumption when actually skipped
         */
        if (options.skip.length >= 2)
          clientKey = await options.generator(
            request,
            options.injectServer?.() ?? app.server,
            rest
          )

        // if decided to skip, then do nothing and let the app continue
        if ((await options.skip(request, clientKey)) === false) {
          /**
           * if a skip option has less than two parameters,
           * that's mean clientKey does not have a key yet
           * then generate one
           */
          if (options.skip.length < 2)
            clientKey = await options.generator(
              request,
              options.injectServer?.() ?? app.server,
              rest
            )

          const { count, nextReset } = await options.context.increment(
            // biome-ignore lint/style/noNonNullAssertion: <explanation>
            clientKey!
          )

          const payload = {
            limit: options.max,
            current: count,
            remaining: Math.max(options.max - count, 0),
            nextReset,
          }

          // set standard headers
          const reset = Math.max(
            0,
            Math.ceil((nextReset.getTime() - Date.now()) / 1000)
          )

          const builtHeaders: Record<string, string> = {
            'RateLimit-Limit': String(options.max),
            'RateLimit-Remaining': String(payload.remaining),
            'RateLimit-Reset': String(reset),
          }

          // reject if limit were reached
          if (payload.current >= payload.limit + 1) {
            logger(
              'plugin',
              'rate limit exceeded for clientKey: %s (resetting in %d seconds)',
              clientKey,
              reset
            )

            builtHeaders['Retry-After'] = String(
              Math.ceil(options.duration / 1000)
            )

            if (options.errorResponse instanceof Error)
              throw options.errorResponse
            if (options.errorResponse instanceof Response) {
              // duplicate the response to avoid mutation
              const clonedResponse = options.errorResponse.clone()

              // append headers
              if (options.headers)
                for (const [key, value] of Object.entries(builtHeaders))
                  clonedResponse.headers.set(key, value)

              return clonedResponse
            }

            // append headers
            if (options.headers)
              for (const [key, value] of Object.entries(builtHeaders))
                set.headers[key] = value

            // set default status code
            set.status = 429

            return options.errorResponse
          }

          // append headers
          if (options.headers)
            for (const [key, value] of Object.entries(builtHeaders))
              set.headers[key] = value

          logger(
            'plugin',
            'clientKey %s passed through with %d/%d request used (resetting in %d seconds)',
            clientKey,
            options.max - payload.remaining,
            options.max,
            reset
          )
        }
      }
    )

    plugin.onError(
      { as: options.scoping },
      async function onErrorRateLimit({
        set,
        request,
        query,
        path,
        store,
        cookie,
        error,
        body,
        params,
        headers,
        // @ts-expect-error somehow qi is being sent from elysia, but there's no type declaration for it
        qi,
        code,
        ...rest
      }) {
        if (!options.countFailedRequest) {
          const clientKey = await options.generator(
            request,
            options.injectServer?.() ?? app.server,
            rest
          )

          logger(
            'plugin',
            'request failed for clientKey: %s, refunding',
            clientKey
          )
          await options.context.decrement(clientKey)
        }
      }
    )

    plugin.onStop(async function onStopRateLimit() {
      logger('plugin', 'kill signal received')
      await options.context.kill()
    })

    return app.use(plugin)
  }
}
