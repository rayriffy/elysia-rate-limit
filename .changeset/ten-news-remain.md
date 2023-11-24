---
'elysia-rate-limit': major
---

`generator` now determine IP address natively via [`server.requestIP()` function](https://github.com/oven-sh/bun/pull/6165). This is a breaking change for those who use Bun version 1.0.3 or below. Please update your code to support Bun version 1.0.4 or above.
