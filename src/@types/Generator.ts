import type { MaybePromise, Cookie } from 'elysia'
import type { Server } from './Server.ts'

export type Generator<T extends object = {}> = (
  request: Request & {cookie: Record<string, Cookie<string>>},
  server: Server | null,
  derived: T
) => MaybePromise<string>
