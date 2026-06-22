# Technical Design: Robustness and Web Workers Improvements

## Technical Approach

We will improve robustness by enforcing Angular's injection context in browser API hooks and by introducing a hybrid resolver for Web Workers that guarantees out-of-the-box execution with CSP compatibility.

1. **Injection Context Enforcement**:
   All 20 `inject*` functions in `packages/browser-web-apis/src/fns/` will be updated to call `assertInInjectionContext(injectName)` at their entry point, throwing immediately when called outside construction/injection phase.
2. **Hybrid Web Worker Resolver**:
   We will update `injectWorkerPool` in `@angular-helpers/core` to probe the primary `workerUrl` via `fetch`. If the fetch fails (due to 404 or network issue), it falls back to creating an inline `Blob` worker using a compiled inlined string. If the browser's CSP blocks `blob:` URLs, we catch the exception and throw a clear error suggesting the use of custom URL override.
3. **Inlining Pipeline**:
   During build, a custom script `scripts/inline-workers.js` will read the compiled worker from `public/assets/workers/regex.worker.js`, convert it to a string constant inside `packages/security/src/workers/regex.worker.inline.ts`, which is then bundled by `ng-packagr`.

## Architecture Decisions

| Decision                     | Alternative                     | Tradeoffs                                                            |
| :--------------------------- | :------------------------------ | :------------------------------------------------------------------- |
| **Fetch Probe for Fallback** | Try-catch raw instantiation     | Fetch detects 404/network errors before worker errors occur.         |
| **Build-time JS Inlining**   | Stringify TS in source code     | Vite compilation/minification reduces size and guarantees ES format. |
| **InjectionToken Override**  | Query parameters on runtime URL | Angular dependency injection is cleaner, type-safe, and standard.    |

## Data Flow

```text
[Consumer] -> calls injectWorkerPool(URL, { fallbackWorkerCode })
                  |
         Is Browser environment?
        /                       \
      No                         Yes
      /                            \
[SSR Fallback]             [Probe workerUrl] --(success)--> [Worker(workerUrl)]
                                    | (failure/404)
                           [Worker(blobUrl)] <-- compiled fallbackWorkerCode
                                    |
                           (CSP blocks blob?)
                                 /      \
                               Yes       No
                               /           \
                 [Descriptive Error]       [Ready]
```

## File Changes

| File Path                                                           | Action   | Description                                                                                      |
| :------------------------------------------------------------------ | :------- | :----------------------------------------------------------------------------------------------- |
| `packages/browser-web-apis/src/fns/inject-*.ts` (20 files)          | Modified | Call `assertInInjectionContext` at entry point.                                                  |
| `packages/core/src/workers/worker-pool.ts`                          | Modified | Add `fallbackWorkerCode` option and hybrid loading logic to `injectWorkerPool` and `WorkerPool`. |
| `packages/security/src/services/regex-worker-pool.service.ts`       | Modified | Inject custom config and pass inline worker code to `injectWorkerPool`.                          |
| `packages/security/src/workers/regex.worker.inline.ts`              | New      | Inlined worker string (generated at build).                                                      |
| `packages/security/package.json`                                    | Modified | Run `inline-workers.js` script in prebuild.                                                      |
| `packages/browser-web-apis/src/fns/inject-wake-lock.spec.ts`        | New      | Spec suite testing context validation, browser support, and sentinel methods.                    |
| `packages/browser-web-apis/src/fns/inject-barcode-detector.spec.ts` | New      | Spec suite testing browser mocks, detection, stream scans.                                       |

## Interfaces / Contracts

```typescript
// packages/core/src/workers/worker-pool.ts
export interface WorkerPoolOptions {
  workerFactory: () => Worker;
  defaultTimeout?: number;
  onCrash?: (error: any) => void;
  fallbackExecutor?: (type: string, data: any) => Promise<any>;
}

export function injectWorkerPool(
  workerUrl: URL | string,
  options?: Omit<WorkerPoolOptions, 'workerFactory'> & {
    fallbackWorkerCode?: string;
  },
): WorkerPool;

// packages/security/src/services/regex-worker-pool.service.ts
export interface RegexWorkerConfig {
  workerUrl?: string | URL;
}
export const REGEX_WORKER_CONFIG = new InjectionToken<RegexWorkerConfig>('REGEX_WORKER_CONFIG');
```

## Testing Strategy

| Test Level | Scope / Target                            | Strategy / Tool                                                                                   |
| :--------- | :---------------------------------------- | :------------------------------------------------------------------------------------------------ |
| **Unit**   | `injectWakeLock`, `injectBarcodeDetector` | Mock DOM APIs (`navigator.wakeLock`, `BarcodeDetector`) and verify behavior / signals via Vitest. |
| **Unit**   | `injectWorkerPool`                        | Verify hybrid fallback logic by mocking `fetch` response and checking `Worker` instantiations.    |
| **Unit**   | Context Assertion                         | Call all 20 functions inside and outside context to verify error throws.                          |

## Migration / Rollout

No migration required. All changes are backwards-compatible and execute transparently.

## Open Questions

None.
