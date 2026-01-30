import type { Cookie, Elysia } from 'elysia';

export type Server = Elysia['server']

export type ExtendedRequest = Request & { cookie: Record<string, Cookie<string>> };