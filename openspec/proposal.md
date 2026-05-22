# SDD Proposal: Angular Dependency Injection for `@angular-helpers/core`

## 1. Problem Statement

The newly created `@angular-helpers/core` package currently relies on raw JavaScript globals (`typeof window`) and pure TypeScript classes (`new WorkerPool(...)`). While functional, this bypasses Angular's powerful Dependency Injection (DI) system. It prevents proper mocking during unit tests, ignores Angular's `PLATFORM_ID` (which is critical for Microfrontends and complex SSR setups), and doesn't leverage the "Composition-First" pattern that the rest of the ecosystem is moving towards.

## 2. Exploration & Approaches

We have two main ways to integrate Angular's DI into the core package:

### Approach A: Classic Injectable Services

Creating `@Injectable({ providedIn: 'root' })` services like `PlatformService` and `WorkerPoolFactoryService`.

- **Pros:** Standard Angular 14+ approach, very familiar.
- **Cons:** Can be verbose. Requires injecting a factory just to spawn a worker pool, adding boilerplate to consuming libraries (like `security` and `storage`).

### Approach B: Composition-First (Functional Injection) - **RECOMMENDED**

Provide functional injection wrappers such as `injectPlatform()` and `injectWorkerPool()`.

- **Pros:** Extremely modern (Angular 16+), clean, avoids constructor boilerplate, and seamlessly resolves underlying tokens (`PLATFORM_ID`) using `inject()`.
- **Cons:** Must be called within an injection context (which all our services and components currently are).

## 3. Proposed Architecture (Approach B)

### 3.1 Platform Utilities (`utils/platform.ts`)

Instead of raw global checks, we will create a composable:

```typescript
import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';

export function injectPlatform() {
  const platformId = inject(PLATFORM_ID);
  return {
    isBrowser: isPlatformBrowser(platformId),
    isServer: isPlatformServer(platformId),
    window: isPlatformBrowser(platformId) ? window : null,
    document: isPlatformBrowser(platformId) ? document : null,
  };
}
```

### 3.2 Worker Pool Abstraction (`workers/worker-pool.ts`)

We will expose `injectWorkerPool`, which internally uses `injectPlatform()` to safely decide if it should spawn the Web Worker or fallback.

```typescript
export function injectWorkerPool(
  workerUrl: URL,
  options?: Omit<WorkerPoolOptions, 'workerFactory'>,
): WorkerPool {
  const { isBrowser } = injectPlatform();

  return new WorkerPool({
    ...options,
    workerFactory: () => {
      if (!isBrowser || typeof Worker === 'undefined') return null as any;
      return new Worker(workerUrl, { type: 'module' });
    },
  });
}
```

## 4. Impact on Consuming Packages

- `@angular-helpers/security`: `RegexWorkerPoolService` will update its constructor to simply `this.pool = injectWorkerPool(new URL(...))`.
- `@angular-helpers/storage`: Will be able to replace its manual `typeof window` checks using the new `injectPlatform()` composable, unifying all SSR guards.

## 5. Risks & Mitigations

- **Injection Context Error**: `injectWorkerPool()` must be called during construction of the consuming service. This is standard Angular behavior, but we must ensure we don't call it inside asynchronous methods (like `executeInWorker`).
- **Mitigation**: We will instantiate the pool directly as a class property `private pool = injectWorkerPool(...)` in consuming services.
