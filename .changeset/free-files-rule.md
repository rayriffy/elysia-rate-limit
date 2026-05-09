---
"elysia-rate-limit": patch
---

Ensure Retry-After header correctly aligns with RateLimit-Reset rather than dynamically recalculating the duration of the rejected request.
