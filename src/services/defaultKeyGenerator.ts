import type { Server } from 'bun'

export const defaultKeyGenerator = (
  request: Request,
  server: Server
): string => {
  const clientAddress = server.requestIP(request)?.address

  if (clientAddress === undefined) {
    let reason: string

    if (request === undefined)
      reason = 'request is undefined'
    else if (server.requestIP(request) === null)
      reason = '.requestIP() returns null'
    else if (server.requestIP(request)?.address === undefined)
      reason = '.requestIP()?.address returns undefined'
    else
      reason = 'unknown'

    console.warn(
      `[elysia-rate-limit] failed to determine client address (reason: ${reason})`
    )

    return ''
  } else {
    return clientAddress
  }
}
