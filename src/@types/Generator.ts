import type { Server } from 'bun'
import type { MaybePromise } from 'elysia'

export type Generator<T extends object = {}> = (
  request: Request,
  server: Server | null,
  derived: T
) => MaybePromise<string>
