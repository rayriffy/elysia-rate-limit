import { Server } from 'bun'
import { MaybePromise } from 'elysia'

export type GetServer = () => MaybePromise<Server | null>
