# elysia-rate-limit

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
