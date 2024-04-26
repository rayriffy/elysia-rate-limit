import type { Context } from './Context'
import type { Generator } from './Generator'
import type { GetServer } from './GetServer'

export interface Options {
  // The duration for plugin to remember the requests (Default: 60000ms)
  duration: number

  // Maximum of requests per specified duration (Default: 10)
  max: number

  // Object to response when rate-limit reached
  errorResponse: string | Response | Error

  // scoping for rate limiting, set global by default to affect every request, but you can adjust to local to affect only within current instance
  scoping: 'global' | 'local' | 'scoped'

  // should the rate limit be counted when a request result is failed (Default: false)
  countFailedRequest: boolean

  // key generator function to categorize client for rate-limiting
  generator: Generator<any>

  // context for storing requests count
  context: Context

  // exposed functions for writing a custom script to skip counting i.e.,
  // not counting rate limit for some requests
  // (Default: always return false)
  skip: (req: Request, key?: string) => boolean | Promise<boolean>

  // get server instance function
  getServer: GetServer
}
