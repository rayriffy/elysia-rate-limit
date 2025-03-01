import type { MaybePromise } from 'elysia'
import type { Server } from './Server.ts'

export type Generator<T extends object = {}> = (
  request: Request,
  server: Server | null,
  derived: T
) => MaybePromise<string>
