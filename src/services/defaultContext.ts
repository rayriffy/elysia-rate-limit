import AllocQuickLRU from '@alloc/quick-lru'

import type { Context } from '../@types/Context'
import type { Options } from '../@types/Options'
import { logger } from './logger'

interface Item {
  count: number
  nextReset: Date
  start: number
}

export class DefaultContext implements Context {
  private readonly id: string = (Math.random() + 1).toString(36).substring(7)
  private readonly maxSize: number
  private store!: AllocQuickLRU<string, Item>
  private duration: number | undefined

  public constructor(maxSize = 5000) {
    this.maxSize = maxSize
  }

  public init(options: Omit<Options, 'context'>) {
    const durationDisplay = typeof options.duration === 'function' ? 'dynamic' : options.duration / 1000
    logger(
      `context:${this.id}`,
      'initialized with maxSize: %d, and expire duration of %s seconds',
      this.maxSize,
      durationDisplay
    )

    this.duration = typeof options.duration === 'function' ? undefined : options.duration
    this.store = new AllocQuickLRU<string, Item>({
      maxSize: this.maxSize,
    })
  }

  public async increment(key: string, duration?: number, requestTime?: number) {
    const effectiveDuration = duration ?? this.duration
    if (effectiveDuration === undefined)
      throw new Error('DefaultContext.increment: duration is required when options.duration is a function but no per-call duration was provided')
    const now = requestTime ?? Date.now()
    let item = this.store.get(key)

    // if item is not found or expired, then issue a new one
    if (item === undefined || item.nextReset.getTime() <= now) {
      logger(
        `context:${this.id}`,
        'issue new token for %s (expire in %d seconds)',
        key,
        effectiveDuration / 1000
      )

      item = {
        count: 1,
        nextReset: new Date(now + effectiveDuration),
        start: now,
      }
    } else {
      // otherwise, increment the count
      item.count++

      // Apply High-Water Mark: Extend window if current request demands a longer duration
      const requiredReset = item.start + effectiveDuration
      if (requiredReset > item.nextReset.getTime()) {
        item.nextReset = new Date(requiredReset)
      }
    }

    this.store.set(key, item)

    return item
  }

  public async decrement(key: string) {
    const item = this.store.get(key)

    // perform actions only if an item is found
    if (item !== undefined) {
      logger(`context:${this.id}`, 'decremented count for key: %s', key)

      // decrement the count by 1
      item.count--

      // update the store
      this.store.set(key, item)
    }
  }

  public async reset(key?: string) {
    logger(`context:${this.id}`, 'resetting target %s', key ?? 'all')

    if (typeof key === 'string') this.store.delete(key)
    else this.store.clear()
  }

  public kill() {
    logger(`context:${this.id}`, 'clearing the store')

    this.store.clear()
  }
}
