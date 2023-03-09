import type { MaybePromise } from "elysia"

import type { Context } from "./Context"

export interface Options {
  // The duration for plugin to remember the requests (Default: 60000ms)
  duration: number

  // Maximum of requests per specified duration (Default: 10)
  max: number

  // status code to be sent when rate-limit reached (Default: 429 per RFC 6585 specification)
  responseCode: number

  // message response when rate-limit reached (Default: rate-limit reached)
  responseMessage: string

  // key generator function to categorize client for rate-limiting
  generator(request: Request): MaybePromise<string>

  // context for storing requests count
  context: Context

  // exposed functions for writing custom script to skip counting i.e. not counting rate limit for some requests
  skip: (request: Request) => MaybePromise<boolean>
}
