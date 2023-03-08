Elysia Rate Limit
===

Lightweight rate limiter plugin for [Elysia.js](https://elysiajs.com/)

Install
---

```
bun add elysia-rate-limit
```

Usage
---

Check out full sample at [`example`](example/index.ts)

```ts
import { Elysia } from 'elysia'
import { rateLimit } from 'elysia-rate-limit'

new Elysia()
  .use(rateLimit())
  .listen(3000)
```

Limitation
---

In order to determine rate limit for each client, by defaults we're determined by using client's IP address.

But unfortunately, `Bun.serve()` implementation of `Request` object does not add anything extra beyond the standard [which you can see in the disscussion in Discord](https://discord.com/channels/876711213126520882/1006494319697461298). The best thing I can do is to indentifying client IP address by using fowarded header from proxy server (i.e. Cloudflare, NGINX, App Engine).

If you have your own way to determine rate limit for client (i.e. by using client API key instead of IP). Feel free to write your own implementation by using [`generator`](#generator) option

Configuration
---

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

HTTP reponse code to be sent when rate limit was reached. By default, it will return `429 Too Many Requests` refering to [RFC 6585 specification](https://www.rfc-editor.org/rfc/rfc6585#section-4)

### responseMessage

`string`

Default: `10`

Message to be sent when rate limit was reached

### generator

`(request: Request): string | Promise<string>`

Custom key generator to categorize client requests, return as a string.
