## Exploration: robustness-and-workers

### Current State

1. **Missing `assertInInjectionContext`:**
   - None of the 20 signal-based injection functions in `packages/browser-web-apis/src/fns/` (such as [inject-wake-lock.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/src/fns/inject-wake-lock.ts) and [inject-barcode-detector.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/src/fns/inject-barcode-detector.ts)) import or call `assertInInjectionContext`.
   - If developers call these functions outside an active Angular injection context (e.g., inside callbacks, async handlers, or lifecycle hooks like `ngOnInit` if not using an injector), Angular throws generic `inject()` errors instead of clear, developer-facing errors early in the execution chain.

2. **Web Worker Compilation/Bundling Setup:**
   - **`packages/security`:** The `regex.worker.ts` is never compiled during the package build process, nor is it packaged into the final bundle assets (see [packages/security/ng-package.json](file:///home/gasparrv92/Repositorios/angular-helpers/packages/security/ng-package.json)). The [regex-worker-pool.service.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/security/src/services/regex-worker-pool.service.ts) attempts to resolve `assets/workers/regex.worker.js` relative to `document.baseURI`. This causes a **silent fallback** to synchronous main-thread execution on 404, defeating ReDoS protection and threatening main-thread performance.
   - **`packages/worker-http`:** Currently requires consuming applications to run a schematic `ng-add` to copy the worker template `http-api.worker.ts` into their own code, forcing them to bundle it themselves.
   - **Monorepo local dev/demo:** The root [vite.config.ts](file:///home/gasparrv92/Repositorios/angular-helpers/vite.config.ts) compiles workers into `public/assets/workers/` during local builds, which are then copied via the `angular.json` assets array in the demo application.

3. **Unit Tests:**
   - Both `inject-wake-lock.ts` and `inject-barcode-detector.ts` are completely missing unit test files (`.spec.ts`), leaving their reactive states, microtask queue timings, and error handler behaviors unverified.

### Affected Areas

- **All 20 custom inject functions** in `packages/browser-web-apis/src/fns/`
- [packages/security/src/services/regex-worker-pool.service.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/security/src/services/regex-worker-pool.service.ts)
- [packages/security/ng-package.json](file:///home/gasparrv92/Repositorios/angular-helpers/packages/security/ng-package.json)
- [packages/worker-http/ng-package.json](file:///home/gasparrv92/Repositorios/angular-helpers/packages/worker-http/ng-package.json)
- **Unit test files to be created:**
  - `packages/browser-web-apis/src/fns/inject-wake-lock.spec.ts`
  - `packages/browser-web-apis/src/fns/inject-barcode-detector.spec.ts`

### Approaches

1. **Defensive Checks / Injection Context:**
   - **Assertion:** Add `assertInInjectionContext(injectName)` at the very beginning of each function. This validates the context early and provides a clean Angular error page with developer instructions.

2. **Web Worker Integration:**
   - **Approach A (Asset-based Compilation):** Build worker scripts into `.js` static files during package compilation and include them in the package's assets (updating `ng-package.json`). Consuming apps must configure their `angular.json` assets to copy the compiled worker.
   - **Approach B (Inlined Blob Worker):** Compile worker scripts to standard JavaScript strings and bundle them directly inside the code (e.g. as inline strings or compiled base64 constants). The library can then instantiate the worker from a dynamically created object URL (`URL.createObjectURL(new Blob([workerCode], {type: 'application/javascript'}))`). This requires **zero-config** for the library user.
   - **Approach C (Hybrid Dual-Mode):** Support both dynamically inlined workers as a safe, zero-config default, while still allowing developers to override the worker source with a custom URL path (to conform with strict Content Security Policies that block `blob:` URLs).

3. **Unit Testing:**
   - Write unit tests under `packages/browser-web-apis/src/fns/` using Vitest and `@analogjs/vitest-angular` (simulating active injection contexts, browser vs non-browser runtimes, and mock API event triggers).

### Recommendation

- **Injection Context:** Call `assertInInjectionContext` in all 20 functions inside `packages/browser-web-apis/src/fns/`.
- **Worker Integration:** Adopt **Approach C (Hybrid)**. Package compiled workers inside the library, but also support inlining via `Blob` default fallback when the asset url is omitted or fails to load, allowing zero-config usage without losing ReDoS protections.
- **Unit Tests:** Create [inject-wake-lock.spec.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/src/fns/inject-wake-lock.spec.ts) and [inject-barcode-detector.spec.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/src/fns/inject-barcode-detector.spec.ts) with full test coverage including mock responses and destroy sequences.

### Risks

- **Content Security Policy (CSP):** Some enterprise environments have strict CSP rules that block `blob:` worker urls. Implementing the hybrid option (allowing custom URL overrides) is a critical mitigation.
- **Mocks for Browser APIs:** BarcodeDetector and WakeLock APIs are browser-specific and must be mocked carefully in the virtual DOM environment (vitest runs on jsdom) to prevent tests from failing or being skipped.

### Ready for Proposal

Yes
