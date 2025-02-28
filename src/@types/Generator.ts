import type { Server } from 'elysia/universal/server'
import type { MaybePromise } from 'elysia'

export type Generator<T extends object = {}> = (
  request: Request,
  server: Server | null,
  derived: T
) => MaybePromise<string>
