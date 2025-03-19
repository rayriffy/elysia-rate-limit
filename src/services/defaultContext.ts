import AllocQuickLRU from '@alloc/quick-lru'

import type { Context } from '../@types/Context'
import type { Options } from '../@types/Options'
import { logger } from './logger'

interface Item {
  count: number
  nextReset: Date
}

export class DefaultContext implements Context {
  private readonly id: string = (Math.random() + 1).toString(36).substring(7)
  private readonly maxSize: number
  private store!: AllocQuickLRU<string, Item>
  private duration!: number

  public constructor(maxSize = 5000) {
    this.maxSize = maxSize
  }

  public init(options: Omit<Options, 'context'>) {
    logger(
      `context:${this.id}`,
      'initialized with maxSize: %d, and expire duration of %d seconds',
      this.maxSize,
      options.duration / 1000
    )

    this.duration = options.duration
    this.store = new AllocQuickLRU<string, Item>({
      maxSize: this.maxSize,
    })
  }

  public async increment(key: string) {
    const now = new Date()
    let item = this.store.get(key)

    // if item is not found or expired, then issue a new one
    if (item === undefined || item.nextReset < now) {
      logger(
        `context:${this.id}`,
        'created new item for key: %s (reason: %s)',
        key,
        item === undefined ? 'not found' : 'expired'
      )

      item = {
        count: 1,
        nextReset: new Date(now.getTime() + this.duration),
      }
    }
    // otherwise, increment the count
    else {
      logger(`context:${this.id}`, 'incremented count for key: %s', key)

      item.count++
    }

    // update the store
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
