import { Elysia, MaybePromise } from 'elysia'
import { NeedRequestIP } from './NeedRequestIp'

export type GetServer = (app: Elysia) => MaybePromise<Elysia | NeedRequestIP>
