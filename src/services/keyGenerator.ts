export const keyGenerator = (request: Request): string => {
  const headers = [
    // Cloudflare
    'cf-connecting-ip',
    // Firebase, Fastly
    'fastly-client-ip',
    // Akamai
    'true-client-ip',
    // Google App Engine
    'x-appengine-user-ip',
    // NGINX
    'x-real-ip',
    // Standard
    'x-forwarded-for',
    'x-client-ip',
  ]

  for (const header of headers) {
    const value = request.headers.get(header)
    if (value !== null) return value
  }

  console.log(
    "WARN Bun.serve()'s Request object does not implement anything beyond Request object standard, it is currently deemed to be impossible to use this rate limit plugin unless there're IP provided by proxy server. However, you can write your own key generator via `generator` option"
  )
  return ''
}
