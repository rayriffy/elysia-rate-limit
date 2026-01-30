# Elysia Rate Limit

Lightweight rate limiter plugin for [Elysia.js](https://elysiajs.com/)

[![NPM Version](https://img.shields.io/npm/v/elysia-rate-limit)](https://www.npmjs.com/package/elysia-rate-limit)
[![NPM Downloads](https://img.shields.io/npm/dw/elysia-rate-limit)](https://www.npmjs.com/package/elysia-rate-limit)
[![NPM License](https://img.shields.io/npm/l/elysia-rate-limit)](https://www.npmjs.com/package/elysia-rate-limit)

## Install

```
bun add elysia-rate-limit
```

If you're using Bun v1.0.3 or lower, `elysia-rate-limit` v2.0.0 or higher will not be compatible. Please use `elysia-rate-limit` [v1.3.0](https://github.com/rayriffy/elysia-rate-limit/releases/tag/v1.3.0) instead.

## Compatibility

As long as you're on the latest version of Bun, and Elysia.
Using the latest version of `elysia-rate-limit` would works just fine.
However, please refer to the following table to determine which version to use.

| Plugin version | Requirements                 |
|----------------|------------------------------|
| 3.0.0+         | Bun > 1.0.3, Elysia >= 1.0.0 |
| 2.0.0 - 2.2.0  | Bun > 1.0.3, Elysia < 1.0.0  |
| 1.0.2 - 1.3.0  | Bun <= 1.0.3, Elysia < 1.0.0 |

## Usage

Check out full sample at [`example`](example/basic.ts)

```ts
import { Elysia } from 'elysia'
import { rateLimit } from 'elysia-rate-limit'

new Elysia().use(rateLimit()).listen(3000)
```

## Configuration

### duration

`number`

Default: `60000`

Duration for requests to be remembered in **milliseconds**.
Also used in the `Retry-After` header when the limit is reached.

### max

`number | ((key: string, request: Request & { cookie: Record<string, Cookie<string>> }) => number | Promise<number>)`

Default: `10`

Maximum of request to be allowed during 1 `duration` timeframe.

Can be a static number or a dynamic function that returns the max based on the client key and request. The function receives:
- `key`: The generated client key (e.g., IP address)
- `request`: The request object with cookies attached

<details>
<summary>Example for static <code>max</code></summary>

```ts
new Elysia().use(
  rateLimit({
    max: 100, // Allow 100 requests per duration
  })
)
```
</details>

<details>
<summary>Example for dynamic <code>max</code></summary>

```ts
new Elysia().use(
  rateLimit({
    max: (key, request) => {
      // Give premium users higher limits
      const isPremium = request.headers.get('X-User-Tier') === 'premium'
      return isPremium ? 1000 : 100
    },
  })
)
```

```ts
new Elysia().use(
  rateLimit({
    max: async (key, request) => {
      // Fetch user tier from database
      const userTier = await getUserTier(key)
      return userTier === 'premium' ? 1000 : 100
    },
  })
)
```
</details>

### errorResponse

`string | Response | Error`

Default: `rate-limit reached`

Response to be sent when the rate limit is reached.

If you define a value as a string,
then it will be sent as a plain text response with status code 429. If you define a value as a `Response` object,
then it will be sent as is.
And if you define a value as an `Error` object, then it will be thrown as an error.

<details>
<summary>Example for <code>Response</code> object response</summary>

```ts
new Elysia()
  .use(
    rateLimit({
      errorResponse: new Response("rate-limited", {
        status: 429,
        headers: new Headers({
          'Content-Type': 'text/plain',
          'Custom-Header': 'custom',
        }),
      }),
    })
  )
```
</details>

<details>
<summary>Example for <code>Error</code> object response</summary>

```ts
import { HttpStatusEnum } from 'elysia-http-status-code/status'

export class RateLimitError extends Error {
  constructor(
    public message: string = 'rate-limited',
    public detail: string = '',
    public status: number = HttpStatusEnum.HTTP_429_TOO_MANY_REQUESTS // or just 429
  ) {
    super(message)
  }
}

new Elysia()
  .use(
    rateLimit({
      errorResponse: new RateLimitError(),
    })
  )
  // use with error hanlder
  .error({
    rateLimited: RateLimitError,
  })
  .onError({ as: 'global' }, ({ code }) => {
    switch (code) {
      case 'rateLimited':
        return code
        break
    }
  })
```

</details>

### scoping

`'global' | 'scoped'`

Default: `'global'`

Sometimes you may want
to only apply rate limit plugin to curtain Elysia instance.
This option will allow you
to choose scope `local` apply to only current instance and descendant only.
But by default,
rate limit plugin will apply to all instances that apply the plugin.

Read more : [Scope - ElysiaJS | ElysiaJS](https://elysiajs.com/essential/plugin.html#scope-level)

### generator

`<T extends object>(equest: Request, server: Server | null, derived: T) => MaybePromise<string>`

Custom key generator to categorize client requests, return as a string. By default, this plugin will categorize client by their IP address via [`server.requestIP()` function](https://github.com/oven-sh/bun/pull/6165).

If you deploy your server behind a proxy (i.e. NGINX, Cloudflare), you may need to implement your own generator to get client's real IP address.

```js
// IMPORTANT: Only use this if your server is behind Cloudflare AND
// you've restricted access to only Cloudflare IPs
const cloudflareGenerator = (req, server) => {
  // Verify the request is coming from Cloudflare
  // In production, you should maintain a list of Cloudflare IP ranges
  // and verify the request IP is in that range
  const isFromCloudflare = verifyCloudflareIP(server?.requestIP(req)?.address)
  
  if (isFromCloudflare) {
    // Only trust CF-Connecting-IP if the request comes from Cloudflare
    return req.headers.get('CF-Connecting-IP') ?? server?.requestIP(req)?.address ?? ''
  }
  
  // For non-Cloudflare requests, use the direct IP
  return server?.requestIP(req)?.address ?? ''
}

// Example function to verify Cloudflare IPs (implement this based on your needs)
function verifyCloudflareIP(ip) {
  // In a real implementation, check if IP is in Cloudflare's IP ranges
  // https://www.cloudflare.com/ips/
  return true // Replace with actual implementation
}
```

There's a third argument
where you can use derive values from external plugin within key generator as well.
Only downsize is you have to definitely those types be yourself,
please be sure to test those values before actually defining types manually.

```ts
import { ip } from 'elysia-ip'

import type { SocketAddress } from 'bun'
import type { Generator } from 'elysia-rate-limit'

const ipGenerator: Generator<{ ip: SocketAddress }> = (_req, _serv, { ip }) => {
  return ip
}
```

### countFailedRequest

`boolean`

Default: `false`

Should this plugin count rate-limit to user when request failed?
By default,
this plugin will refund request count to a client
when `onError` lifecycle called.
([Learn more in Lifecycle](https://elysiajs.com/concept/middleware.html#life-cycle))

### context

`Context`

Context for storing requests count for each client, if you want to implement your own `Context` you can write it to comply with [`Context`](./src/@types/Context.ts) protocol

```ts
import type { Context } from 'elysia-rate-limit'

export class CustomContext implements Context {
  // implementation here
}
```

By default, context implementation, caching will be an LRU cache with a maximum of 5,000 entries. If you prefer to use this cache implementation but with larger cache size, you can define a new context with preferred cache size as follows

```ts
import { DefaultContext } from 'elysia-rate-limit'

new Elysia().use(
  rateLimit({
    // define max cache size to 10,000
    context: new DefaultContext(10_000),
  })
)
```

### headers

`boolean`

Default `true`

Should this plugin automatically set `RateLimit-*` headers to the response?
If you want to disable this feature, you can set this option to `false`.

### skip

`(request: Request, key: string): boolean | Promise<boolean>`

Default: `(): false`

A custom function
to determine that should this request be counted into rate-limit
or not based on information given by `Request` object
(i.e., Skip counting rate-limit on some route) and the key of the given request,
by default, this will always return `false` which means counted everything.

### injectServer

`() => Server`

Default: `undefined`

A function to inject server instance to the plugin,
this is useful
when you want to use default key generator in detached Elysia instances.
You can check out the example [here](./example/multiInstanceInjected.ts).

Please use this function as a last resort,
as defining this option will make plugin to make an extra function call,
which may affect performance.
