import Elysia from 'elysia'

import { defaultOptions } from '../constants/defaultOptions'
import { DefaultContext } from './defaultContext'

import { logger } from './logger'

import type { Options } from '../@types/Options'
import type { ExtendedRequest } from '../@types/Server'

// Properties that belong to the core Elysia context and should not be
// forwarded as "derived" values to the generator function.
const elysiaContextKeys = new Set([
  'body', 'query', 'params', 'headers', 'cookie',
  'set', 'path', 'request', 'store', 'route', 'error',
  'qi', 'redirect', 'server',
])

const buildDerived = (context: Record<string, unknown>) => {
  const derived: Record<string, unknown> = {}

  for (const key of Object.keys(context)) {
    if (!elysiaContextKeys.has(key)) {
      derived[key] = context[key]
    }
  }

  return derived
}

export const plugin = function rateLimitPlugin(userOptions?: Partial<Options>) {
  const options: Options = {
    ...defaultOptions,
    ...userOptions,
    context: userOptions?.context ?? new DefaultContext(),
  }

  options.context.init(options)

  // NOTE:
  // do not make plugin to return async
  // otherwise request will be triggered twice
  return function registerRateLimitPlugin(app: Elysia) {
    const seedValue = typeof options.max === 'function' ? 0 : options.max
    const plugin = new Elysia({
      name: 'elysia-rate-limit',
      seed: seedValue,
    })

    // IMPORTANT: The lifecycle hooks below intentionally avoid destructuring
    // `body`, `query`, `params`, `headers`, or using `...rest` in the
    // parameter list. Elysia's static analyzer (sucrose) inspects the
    // function signature to infer which context properties are needed, and
    // referencing `body` (or spreading into a rest param that gets passed to
    // another function) causes Elysia to eagerly parse the request body for
    // ALL routes — including routes that need to read the raw body via
    // `request.text()` (e.g. Stripe webhook signature verification).
    // See: https://github.com/elysiajs/elysia/blob/main/src/sucrose.ts
    //
    // To preserve backward compatibility with custom generators that read
    // derived context (e.g. `elysia-ip`), we capture the full context via
    // a wrapper function and use `buildDerived` to extract only non-core
    // properties at runtime — invisible to sucrose's static analysis.

    plugin.onBeforeHandle(
      { as: options.scoping },
      function onBeforeHandleRateLimitHandler({
        set,
        request,
        cookie,
      }) {
        const derived = buildDerived(arguments[0] as Record<string, unknown>)

        return (async () => {
          let clientKey: string | undefined
          const enhancedRequest = Object.defineProperty(request, 'cookie', {
            value: cookie,
          }) as ExtendedRequest

          /**
           * if a skip option has two parameters,
           * then we will generate clientKey ahead of time.
           * this is made to skip generating key unnecessary if only check for request
           * and saving some cpu consumption when actually skipped
           */
          if (options.skip.length >= 2)
            clientKey = await options.generator(
              enhancedRequest,
              options.injectServer?.() ?? app.server,
              derived
            )

          // if decided to skip, then do nothing and let the app continue
          if ((await options.skip(enhancedRequest, clientKey)) === false) {
            /**
             * if a skip option has less than two parameters,
             * that's mean clientKey does not have a key yet
             * then generate one
             */
            if (options.skip.length < 2)
              clientKey = await options.generator(
                enhancedRequest,
                options.injectServer?.() ?? app.server,
                derived
              )

            const { count, nextReset } = await options.context.increment(
              // biome-ignore lint/style/noNonNullAssertion: <explanation>
              clientKey!
            )

            // Resolve max value (static or dynamic)
            const maxLimit = typeof options.max === 'function'
              ? await options.max(clientKey!, enhancedRequest)
              : options.max

            const payload = {
              limit: maxLimit,
              current: count,
              remaining: Math.max(maxLimit - count, 0),
              nextReset,
            }

            // set standard headers
            const reset = Math.max(
              0,
              Math.ceil((nextReset.getTime() - Date.now()) / 1000)
            )

            const builtHeaders: Record<string, string> = {
              'RateLimit-Limit': String(maxLimit),
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
              maxLimit - payload.remaining,
              maxLimit,
              reset
            )
          }
        })()
      }
    )

    plugin.onError(
      { as: options.scoping },
      function onErrorRateLimitHandler({
        request,
        cookie,
      }) {
        const derived = buildDerived(arguments[0] as Record<string, unknown>)

        return (async () => {
          if (!options.countFailedRequest) {
            const enhancedRequest = Object.defineProperty(request, 'cookie', {
              value: cookie,
            }) as ExtendedRequest
            const clientKey = await options.generator(
              enhancedRequest,
              options.injectServer?.() ?? app.server,
              derived
            )

            logger(
              'plugin',
              'request failed for clientKey: %s, refunding',
              clientKey
            )
            await options.context.decrement(clientKey)
          }
        })()
      }
    )

    plugin.onStop(async function onStopRateLimitHandler() {
      logger('plugin', 'kill signal received')
      await options.context.kill()
    })

    return app.use(plugin)
  }
}
