---
'elysia-rate-limit': patch
---

Fix compatibility with Elysia 2.0.0-rc.0 by using onBeforeHandle, onError, and
onStop lifecycle hooks. Preserve raw request bodies with the RC context analyzer,
update the development dependency and peer requirement, and clarify version and
scope compatibility.
