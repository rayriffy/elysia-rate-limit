import type { MaybePromise } from 'elysia'
import type { ExtendedRequest, Server } from './Server.ts'

export type Generator<T extends object = {}> = (
  request: ExtendedRequest,
  server: Server | null,
  derived: T
) => MaybePromise<string>
