import { Context } from "./Context"

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
  generator(request: Request): Promise<string> | string

  // context for storing requests count
  context: Context
}
