import type { Server } from 'bun'

export const defaultKeyGenerator = (
  request: Request,
  server: Server
): string => {
  const clientAddress = server.requestIP(request)?.address

  if (clientAddress === undefined) {
    console.log(
      '[elysia-rate-limit] generator is unable to determine client IP address. Are you using older version of Bun?'
    )
    return ''
  } else {
    return clientAddress
  }
}
