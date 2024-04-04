import type { Server } from 'bun'

export const defaultKeyGenerator = (
  request: Request,
  server: Server
): string => {
  if (request === undefined) return (warn('request is undefined'), '')

  const socket = server.requestIP(request)
  if (!socket) return (warn('.requestIP() returns null'), '')

  const clientAddress = socket.address
  if (!clientAddress) return (warn('.requestIP()?.address returns undefined'), '')

  return clientAddress
}

const warn = (reason: string) => console.warn(`[elysia-rate-limit] failed to determine client address (reason: ${reason})`)