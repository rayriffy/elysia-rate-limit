import type { Elysia, MaybePromise } from 'elysia'
import type { NeedRequestIP } from './NeedRequestIp'

export type GetServer = (app: Elysia) => MaybePromise<Elysia | NeedRequestIP>
