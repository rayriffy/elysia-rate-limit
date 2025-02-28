import { logger } from './logger'

import type { Generator } from '../@types/Generator'

export const defaultKeyGenerator: Generator = (request, server): string => {
  const clientAddress = server?.requestIP(request)?.address

  logger('generator', 'clientAddress: %s', clientAddress)

  if (clientAddress === undefined) {
    let reason: string

    if (request === undefined) reason = 'request is undefined'
    else if (server === null) reason = 'server is null'
    else if (server.requestIP(request) === null)
      reason = '.requestIP() returns null'
    else if (server.requestIP(request)?.address === undefined)
      reason = '.requestIP()?.address returns undefined'
    else reason = 'unknown'

    console.warn(
      `[elysia-rate-limit] failed to determine client address (reason: ${reason})`
    )

    return ''
  }

  return clientAddress
}
