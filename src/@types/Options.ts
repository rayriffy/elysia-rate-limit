import type { Cookie } from 'elysia'
import type { Context } from './Context'
import type { Generator } from './Generator'
import type { Server } from './Server.ts'

export interface Options {
  // The duration for plugin to remember the requests (Default: 60000ms)
  duration: number

  // Maximum of requests per specified duration (Default: 10)
  // Can be a static number or a function that returns the max based on the key and request
  max: number | ((key: string, request: Request & { cookie: Record<string, Cookie<string>> }) => number | Promise<number>)

  // Object to response when rate-limit reached
  errorResponse: string | Response | Error

  // scoping for rate limiting, set global by default to affect every request,
  // but you can adjust to local to affect only within current instance
  scoping: 'global' | 'scoped'

  // should the rate limit be counted when a request result is failed (Default: false)
  countFailedRequest: boolean

  // key generator function to categorize client for rate-limiting
  generator: Generator<any>

  // context for storing requests count
  context: Context

  // exposed functions for writing a custom script to skip counting i.e.,
  // not counting rate limit for some requests
  // (Default: always return false)
  skip: (
    req: Request & { cookie: Record<string, Cookie<string>> },
    key?: string
  ) => boolean | Promise<boolean>

  // an explicit way to inject server instance to generator function
  // uses this as last resort only
  // since this function will slightly reduce server performance
  // (Default: not defined)
  injectServer?: () => Server | null

  // let the plugin in control of RateLimit-* headers
  // (Default: true)
  headers: boolean
}
