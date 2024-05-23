import type { Server } from 'bun'

import type { Context } from './Context'
import type { Generator } from './Generator'

export interface Options {
  // The duration for plugin to remember the requests (Default: 60000ms)
  context: Context

  // Maximum of requests per specified duration (Default: 10)
  countFailedRequest: boolean

  // Object to response when rate-limit reached
  duration: number

  // scoping for rate limiting, set global by default to affect every request,
  // but you can adjust to local to affect only within current instance
  errorResponse: string | Response | Error

  // should the rate limit be counted when a request result is failed (Default: false)
  generator: Generator<any>

  // key generator function to categorize client for rate-limiting
  headers: true

  // context for storing requests count
  injectServer?: () => Server | null

  // exposed functions for writing a custom script to skip counting i.e.,
  // not counting rate limit for some requests
  // (Default: always return false)
  max: number

  // an explicit way to inject server instance to generator function
  // uses this as last resort only
  // since this function will slightly reduce server performance
  // (Default: not defined)
  scoping: 'global' | 'scoped'

  // let plugin in control of RateLimit-* headers
  // (Default: true)
  skip: (req: Request, key?: string) => boolean | Promise<boolean>
}
