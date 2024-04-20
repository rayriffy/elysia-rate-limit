import debug from 'debug'

export const logger = (unit: string, formatter: any, ...params: any[]) =>
  debug('elysia-rate-limit:' + unit)(formatter, ...params)
