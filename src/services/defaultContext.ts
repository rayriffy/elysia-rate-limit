import { LRUCache } from 'lru-cache'

import type { Options } from '../@types/Options'
import type { Context } from '../@types/Context'

interface Item {
  count: number
  nextReset: Date
}

export class DefaultContext implements Context {
  private readonly maxSize: number
  private store!: LRUCache<string, Item>
  private duration!: number

  public constructor (maxSize = 5000) {
    this.maxSize = maxSize
  }

  public init (options: Options) {
    this.duration = options.duration
    this.store = new LRUCache<string, Item>({
      max: this.maxSize,
    })
  }

  public async increment(key: string) {
    const now = new Date()
    let item = this.store.get(key)

    // if item is not found or expired, then issue a new one
    if (item === undefined || item.nextReset < now)
      item = {
        count: 1,
        nextReset: new Date(now.getTime() + this.duration),
      }
    // otherwise, increment the count
    else
      item.count++

    // update the store
    this.store.set(key, item)

    return item
  }

  public async decrement(key: string) {
    let item = this.store.get(key)

    // perform actions only if an item is found
    if (item !== undefined) {
      // decrement the count by 1
      item.count--

      // update the store
      this.store.set(key, item)
    }
  }

  public async reset(key?: string) {
    if (typeof key === 'string')
      this.store.delete(key)
    else
      this.store.clear()
  }

  public kill() {
    this.store.clear()
  }
}
