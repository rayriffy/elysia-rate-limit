---
"elysia-rate-limit": patch
---

Fix unintended eager body parsing caused by destructuring `body` and using rest spread in lifecycle handler signatures. Elysia's static analyzer (sucrose) inspects function parameters to infer context dependencies, which caused the request body to be parsed for all routes — breaking routes that need raw body access (e.g. Stripe webhook signature verification). Context properties are now accessed at runtime via a helper function, invisible to sucrose's static analysis.
