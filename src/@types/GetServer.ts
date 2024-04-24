import { Server } from 'bun'
import { Elysia, MaybePromise } from 'elysia'

export type GetServer = (app: Elysia) => MaybePromise<Elysia>
