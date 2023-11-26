# Elysia Rate Limit

Lightweight rate limiter plugin for [Elysia.js](https://elysiajs.com/)

## Install

```
bun add elysia-rate-limit
```

If you're using Bun v1.0.3 or lower, `elysia-rate-limit` v2.0.0 or higher will not be compatible. Please use `elysia-rate-limit` [v1.3.0](https://github.com/rayriffy/elysia-rate-limit/releases/tag/v1.3.0) instead.

## Usage

Check out full sample at [`example`](example/index.ts)

```ts
import { Elysia } from 'elysia'
import { rateLimit } from 'elysia-rate-limit'

new Elysia().use(rateLimit()).listen(3000)
```

## Configuration

### duration

`number`

Default: `60000`

Duration for requests to be remembered in **miliseconds**. Also used in the `Retry-After` header when the limit is reached.

### max

`number`

Default: `10`

Maximum of request to be allowed during 1 `duration` timeframe.

### responseCode

`number`

Default: `429`

HTTP reponse code to be sent when rate limit was reached. By default, it will return `429 Too Many Requests` refering to [RFC 6585 specification](https://www.rfc-editor.org/rfc/rfc6585#section-4)

### responseMessage

`any`

Default: `rate-limit reached`

Message to be sent when rate limit was reached

### generator

`(request: Request, server: Server): string | Promise<string>`

Custom key generator to categorize client requests, return as a string. By default, this plugin will categorize client by their IP address via [`server.requestIP()` function](https://github.com/oven-sh/bun/pull/6165).

If you deploy your server behind a proxy (i.e. NGINX, Cloudflare), you may need to implement your own generator to get client's real IP address.

```js
const cloudflareGenerator = (req, server) =>
  // get client ip via cloudflare header first
  req.headers.get('CF-Connecting-IP')
  // if not found, fallback to default generator
  ?? server?.requestIP(req)?.address
  ?? ''
```

### countFailedRequest

`boolean`

Default: `false`

Should this plugin count rate-limit to user when request failed? By default, this plugin will refund request count to client when `onError` lifecycle called. ([Learn more in Lifecycle](https://elysiajs.com/concept/middleware.html#life-cycle))

### context

`Context`

Context for storing requests count for each client, if you want to implement your own `Context` you can write it to comply with [`Context`](./src/@types/Context.ts) protocol

```ts
import type { Context } from 'elysia-rate-limit'

export class CustomContext implements Context {
  // implementation here
}
```

### skip

`(request: Request): boolean | Promise<boolean>`

Default: `(): false`

A custom function to determine that should this request be counted into rate-limit or not based on information given by `Request` object (i.e. Skip counting rate-limit on some route), by default this will always return `false` which means counted everything.
