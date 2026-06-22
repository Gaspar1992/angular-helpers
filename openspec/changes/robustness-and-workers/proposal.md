# Proposal: Robustness and Web Workers Improvements

## Intent

Enhance the reliability and developer experience of the Angular helpers library by enforcing proper Angular injection context on custom inject functions, implementing a robust hybrid Web Worker resolution strategy to guarantee off-thread execution without config friction, and introducing unit tests for browser-dependent APIs.

## Scope

- **In Scope**:
  - Add `assertInInjectionContext` checks to all 20 injection functions in `packages/browser-web-apis/src/fns/`.
  - Package compiled Web Workers inside the library and support zero-config inlining via `Blob` dynamic fallback alongside custom URL overrides.
  - Create `inject-wake-lock.spec.ts` and `inject-barcode-detector.spec.ts` unit tests.
- **Out of Scope**:
  - Modifying other packages in the monorepo.
  - Modifying other browser API implementations.

## Capabilities

- **New Capabilities**:
  - Hybrid dynamic Web Worker resolver supporting both inline Blob instantiations and custom CSP-friendly URL overrides.
- **Modified Capabilities**:
  - All 20 Browser API inject functions fail fast with descriptive errors when called outside an injection context.

## Technical Approach

Implement a dual-mode hybrid worker resolver in `@angular-helpers/core` and `@angular-helpers/security`:

1. **Fallback to Inline Blob**: If the provided asset worker URL fails to load or is omitted, create an inlined Web Worker from a base64 or string representation compiled into the bundle.
2. **CSP URL Override**: Allow passing a custom asset URL to support strict Content Security Policies that block `blob:` URLs.

## Affected Areas

| Area / File                                                         | Action   | Description                                      |
| :------------------------------------------------------------------ | :------- | :----------------------------------------------- |
| `packages/browser-web-apis/src/fns/` (20 files)                     | Modified | Import/call `assertInInjectionContext` at entry. |
| `packages/security/src/services/regex-worker-pool.service.ts`       | Modified | Integrate hybrid loader for `regex.worker.ts`.   |
| `packages/security/ng-package.json`                                 | Modified | Add worker bundle compilation/packaging.         |
| `packages/browser-web-apis/src/fns/inject-wake-lock.spec.ts`        | New      | Comprehensive spec suite for Wake Lock.          |
| `packages/browser-web-apis/src/fns/inject-barcode-detector.spec.ts` | New      | Comprehensive spec suite for Barcode Detector.   |

## Risks

| Risk                                                         | Mitigation                                      |
| :----------------------------------------------------------- | :---------------------------------------------- |
| Strict CSP blocking inline `blob:` workers                   | Support custom worker asset URL path overrides. |
| Browser APIs (WakeLock, Barcode) missing in test environment | Implement robust JSDOM mocks in spec files.     |

## Rollback Plan

Revert code changes using git to return to manual/assets-only worker loading and decorator-less context error handling.

## Success Criteria

- All tests pass (including new specs).
- Zero-config worker executes successfully in off-main-thread worker.
- `assertInInjectionContext` throws immediately if functions are called incorrectly.
