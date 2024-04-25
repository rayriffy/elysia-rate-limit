import type { Server } from 'bun'
import type { MaybePromise } from 'elysia'
import { NeedRequestIP } from './NeedRequestIp'

export type Generator<T extends object = {}> = (
  equest: Request,
  server: Server | NeedRequestIP['server'] | null,
  derived: T
) => MaybePromise<string>
