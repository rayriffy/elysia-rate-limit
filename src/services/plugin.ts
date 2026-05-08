import Elysia from 'elysia'

import { defaultOptions } from '../constants/defaultOptions'
import { DefaultContext } from './defaultContext'
import { defaultKeyGenerator } from './defaultKeyGenerator'

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
    const maxSeed = typeof options.max === 'function' ? 0 : options.max
    const durationSeed = typeof options.duration === 'function' ? 0 : options.duration
    const seedValue = `${maxSeed}:${durationSeed}`
    const plugin = new Elysia({
      name: 'elysia-rate-limit',
      seed: seedValue,
    })

    const getGeneratorDerived = (context: Record<string, unknown>) =>
      options.generator === defaultKeyGenerator ? {} : buildDerived(context)

    const attachCookieToRequest = (request: Request, cookie: unknown) => {
      // attach cookie to request
      // @ts-expect-error - fast path
      request.cookie = cookie
      return request as ExtendedRequest
    }

    const writeRateLimitHeaders = (
      target: Headers | Record<string, string | number>,
      maxLimit: number,
      remaining: number,
      reset: number,
      effectiveDuration: number,
      withRetryAfter = false
    ) => {
      if (!options.headers)
        return

      const setHeader = target instanceof Headers
        ? (name: string, value: string) => target.set(name, value)
        : (name: string, value: string) => {
          target[name] = value
        }

      setHeader('RateLimit-Limit', String(maxLimit))
      setHeader('RateLimit-Remaining', String(remaining))
      setHeader('RateLimit-Reset', String(reset))

      if (withRetryAfter)
        setHeader('Retry-After', String(Math.ceil(effectiveDuration / 1000)))
    }

    const applyRateLimit = async (
      set: {
        headers: Record<string, string | number>
        status?: number | string
      },
      enhancedRequest: ExtendedRequest,
      clientKey: string
    ) => {
      // Resolve duration (static or dynamic)
      const requestTime = Date.now()
      const effectiveDuration = typeof options.duration === 'function'
        ? await options.duration(clientKey, enhancedRequest)
        : options.duration

      const { count, nextReset } = await options.context.increment(clientKey, effectiveDuration, requestTime)

      // Resolve max value (static or dynamic)
      const maxLimit = typeof options.max === 'function'
        ? await options.max(clientKey, enhancedRequest)
        : options.max

      const remaining = Math.max(maxLimit - count, 0)
      const reset = Math.max(
        0,
        Math.ceil((nextReset.getTime() - Date.now()) / 1000)
      )

      // reject if limit were reached
      if (count >= maxLimit + 1) {
        logger(
          'plugin',
          'rate limit exceeded for clientKey: %s (resetting in %d seconds)',
          clientKey,
          reset
        )

        if (options.errorResponse instanceof Error)
          throw options.errorResponse

        if (options.errorResponse instanceof Response) {
          // duplicate the response to avoid mutation
          const clonedResponse = options.errorResponse.clone()
          writeRateLimitHeaders(clonedResponse.headers, maxLimit, remaining, reset, effectiveDuration, true)
          return clonedResponse
        }

        writeRateLimitHeaders(set.headers, maxLimit, remaining, reset, effectiveDuration, true)

        // set default status code
        set.status = 429

        return options.errorResponse
      }

      writeRateLimitHeaders(set.headers, maxLimit, remaining, reset, effectiveDuration)

      logger(
        'plugin',
        'clientKey %s passed through with %d/%d request used (resetting in %d seconds)',
        clientKey,
        maxLimit - remaining,
        maxLimit,
        reset
      )
    }

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
      async function onBeforeHandleRateLimitHandler({
        set,
        request,
        cookie,
      }) {
        const context = arguments[0] as Record<string, unknown>
        let clientKey: string | undefined

        const enhancedRequest = attachCookieToRequest(request, cookie)

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
            getGeneratorDerived(context)
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
              getGeneratorDerived(context)
            )

          const limitResult = await applyRateLimit(
            set,
            enhancedRequest,
            // biome-ignore lint/style/noNonNullAssertion: generated by current flow
            clientKey!
          )

          if (limitResult !== undefined)
            return limitResult
        }
      }
    )

    plugin.onError(
      { as: options.scoping },
      async function onErrorRateLimitHandler({
        request,
        cookie,
        set,
      }) {
        const context = arguments[0] as Record<string, unknown>
        const error = context.error as unknown
        const code = context.code as unknown

        const errorStatus = typeof error === 'object' && error !== null
          ? (error as {
            status?: number
            statusCode?: number
          }).status ?? (error as {
            status?: number
            statusCode?: number
          }).statusCode
          : undefined
        const currentStatus = typeof set?.status === 'number' ? set.status : undefined
        const isNotFound = code === 'NOT_FOUND' || currentStatus === 404 || errorStatus === 404

        if (isNotFound) {
          const enhancedRequest = attachCookieToRequest(request, cookie)

          const clientKey = await options.generator(
            enhancedRequest,
            options.injectServer?.() ?? app.server,
            getGeneratorDerived(context)
          )

          if ((await options.skip(enhancedRequest, clientKey)) === false) {
            const limitResult = await applyRateLimit(set, enhancedRequest, clientKey)
            if (limitResult !== undefined)
              return limitResult
          }

          return
        }

        if (!options.countFailedRequest) {
          const enhancedRequest = attachCookieToRequest(request, cookie)

          const clientKey = await options.generator(
            enhancedRequest,
            options.injectServer?.() ?? app.server,
            getGeneratorDerived(context)
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

    plugin.onStop(async function onStopRateLimitHandler() {
      logger('plugin', 'kill signal received')
      await options.context.kill()
    })

    return app.use(plugin)
  }
}
