# elysia-rate-limit

## 4.2.0-beta.1

### Patch Changes

- only package `dist/` directory on publish
- 4f857b1: implement unit testing in repository

## 4.2.0-beta.0

### Minor Changes

- change build pipeline to serve builds from both tsup, and tsc

## 4.1.0

### Minor Changes

- 3d0c0ae: added ability to let pligin not to send RateLimit-\* headers
- e867896: scoping `local` is considered unstable, please move to `scoped`

### Patch Changes

- e867896: fixes multiple instances running duplicate jobs at the same time

## 4.0.0

### Major Changes

- 17f10e3: **BREAKING CHANGES** remove `responseCode`, and `responseMessage` in favor of new `errorResponse` option. please consult with documentation for more details

### Minor Changes

- 17f10e3: added `injectServer` option

## 3.2.2

### Patch Changes

- d4d7a62: added debug logs
- 5e83844: fix context is being shared across multiple local scope
- 5e83844: add example for multiple instance scoping

## 3.2.1

### Patch Changes

- 2c5d035: fix generic value of generator types

## 3.2.0

### Minor Changes

- ebe2c77: generators function now passed derive values as a thrid argruments
- 55f0e22: allowing user to change plugin hooks scoping behavior

## 3.2.0-beta.1

### Minor Changes

- 37dc931: allowing user to change plugin hooks scoping behavior

## 3.2.0-beta.0

### Minor Changes

- generators function now passed derive values as a thrid argruments

## 3.1.4

### Patch Changes

- 9ffb155: plugin no longer server to be initialized

## 3.1.3

### Patch Changes

- 7317819: nextReset time for default context always returns to year 1970. my bad

## 3.1.2

### Patch Changes

- dea390c: default generator throws detailed warning message with reason

## 3.1.1

### Patch Changes

- ca7f124: `getNextResetTime` implementation are now moved into `defaultContext`
- 28316db: excluding unintended files that being published to npm
- 1bcda4f: `generator` function now accepts `server` option as non-nullable. the plugin also checks if elysia server is initialized first.
- d5056ec: file structure changes to match directory convention

## 3.1.0

### Minor Changes

- 8779402: new default context strategy

## 3.1.0-beta.0

### Minor Changes

- 8619ac1: new default context strategy

## 3.0.1

### Patch Changes

- 17047d9: refactor code structure

## 3.0.0

### Major Changes

- 693125a: **Breaking change** Plugin compatibility with [Elysia 1.0](elysiajs.com/blog/elysia-10.html). Please refer to compatibility list in README for older Elysia, Bun versions.

## 2.2.0

### Minor Changes

- b666627: Add second parameter to skip with the key so requests can be skipped based on their key

## 2.1.0

### Minor Changes

- 0f53f96: reset the clock when attempting to manually reset the context ([#10](https://github.com/rayriffy/elysia-rate-limit/pull/10))

## 2.0.1

### Patch Changes

- d84ebbd: responseMessage type has been changed to `any`, so you can actually return response as anything (i.e. object)

## 2.0.0

### Major Changes

- fc6e385: `generator` now determine IP address natively via [`server.requestIP()` function](https://github.com/oven-sh/bun/pull/6165). This is a breaking change for those who use Bun version 1.0.3 or below. Please update your code to support Bun version 1.0.4 or above.

## 1.3.0

### Minor Changes

- a5a0b02: bump minimum peer dependency verison of elysia to 0.7.15

## 1.2.0

### Minor Changes

- 89d308c: securely signed package with provenance

## 1.1.0

### Minor Changes

- dba19a3: minimum version of support bun is now 0.3.0

### Patch Changes

- a34655c: automatic package publishing with changesets
