import debug from 'debug'

// create a cache of debug instances to avoid creating them on every call
const debugCache = new Map<string, debug.Debugger>()

export const logger = (unit: string, formatter: any, ...params: any[]) => {
  const key = `elysia-rate-limit:${unit}`

  let debugInstance = debugCache.get(key)
  if (!debugInstance) {
    debugInstance = debug(key)
    debugCache.set(key, debugInstance)
  }

  debugInstance(formatter, ...params)
}
