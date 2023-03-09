import { getNextResetTime } from '../services/getNextResetTime'

import type { Options } from '../@types/Options'
import { Context } from '../@types/Context'

export class DefaultContext implements Context {
  store!: {
    [key: string]: number
  }

  duration!: number
  nextReset!: Date
  intervalId?: Timer

  init (options: Options) {
    this.duration = options.duration
    this.store = {}
    this.nextReset = getNextResetTime(options.duration)
    this.intervalId = setInterval(() => this.reset(), options.duration)
  }

  async increment(key: string) {
    const totalCount = (this.store[key] ?? 0) + 1
    this.store[key] = totalCount

    return {
      count: totalCount,
      nextReset: this.nextReset,
    }
  }

  async decrement(key: string) {
    const keyStore = this.store[key]

    if (keyStore) this.store[key] = keyStore - 1
  }

  async reset(key?: string) {
    if (typeof key === 'string') delete this.store[key]
    else this.store = {}
  }

  kill() {
    if (this.intervalId)
      // this garantee to be number based on [Symbol.toPrimitive] specified in bun types
      // @ts-ignore
      clearInterval(this.intervalId)
  }
}
