import { logger } from './logger'

import type { Generator } from '../@types/Generator'

export const defaultKeyGenerator: Generator = (request, server): string => {
  if (!server || !request) {
    console.warn(
      '[elysia-rate-limit] failed to determine client address (reason: server or request is undefined)'
    )
    return ''
  }

  // Get the IP info once to avoid redundant calls
  const requestIpResult = server.requestIP(request)
  const clientAddress = requestIpResult?.address

  logger('generator', 'clientAddress: %s', clientAddress)

  if (clientAddress === undefined) {
    let reason: string

    if (requestIpResult === null) reason = '.requestIP() returns null'
    else if (requestIpResult.address === undefined)
      reason = '.requestIP()?.address returns undefined'
    else reason = 'unknown'

    console.warn(
      `[elysia-rate-limit] failed to determine client address (reason: ${reason})`
    )

    return ''
  }

  return clientAddress
}
