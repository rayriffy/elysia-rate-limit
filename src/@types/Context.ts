import type { MaybePromise } from "elysia"
import type { Options } from "./Options"

export interface Context {
  // class initialization for creating context
  init(options: Omit<Options, 'context'>): void

  // function will be called to count request
  increment(key: string): MaybePromise<{
    count: number
    nextReset: Date
  }>

  // function will be called to deduct count in case of request failure
  decrement(key: string): MaybePromise<void>

  // if key specified, it will reset count for only specific user, otherwise clear entire storage
  reset(key?: string): MaybePromise<void>

  // cleanup function on process killed
  kill(): MaybePromise<void>
}
