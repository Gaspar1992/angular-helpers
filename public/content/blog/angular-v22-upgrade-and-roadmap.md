# Upgrading to Angular v22 — and what it means for every package

Angular v22 is out, and we have upgraded the entire `@angular-helpers` monorepo. This post explains what changed under the hood, which new framework features we are already applying, and what the roadmap looks like across every package.

---

## Why v22 matters

Angular v22 is the first release where signals, resource APIs, and the new forms primitives are all **stable** — not experimental, not developer preview. The framework finally delivers on the reactive architecture it has been building towards since v16.

The three pillars that drive our modernization effort:

- **Signals are the default**: `OnPush` change detection is now the default strategy for all components. Explicit `ChangeDetectionStrategy.OnPush` declarations are redundant and have been removed across the entire codebase.
- **`rxResource` is stable**: A reactive resource primitive that bridges RxJS observables and signals, enabling declarative async data loading with built-in loading/error states.
- **Signal Forms are stable**: A signals-first forms API that replaces the class-based `FormGroup`/`FormControl` model with reactive primitives that integrate directly with the template system.

---

## What we changed immediately

### 1. Removed redundant `OnPush` declarations

With v22 defaulting every component to `OnPush`, keeping explicit declarations in decorators is pure noise. We ran a codebase-wide cleanup across all packages and the application shell.

**Before:**

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ...
})
```

**After:**

```typescript
@Component({
  // Removed — v22 defaults to OnPush
})
```

Over 40 components cleaned up. Zero behavior change. The AGENTS.md convention guide has been updated to document this as the new baseline.

---

### 2. `injectGeolocationResource` — signals meet observables

The `@angular-helpers/browser-web-apis` package now ships `injectGeolocationResource`, a new function built on top of `rxResource()`.

Unlike the imperative `injectGeolocation`, this new primitive gives you a full reactive resource:

```typescript
import { injectGeolocationResource } from '@angular-helpers/browser-web-apis';

@Component({
  /* ... */
})
export class MapComponent {
  readonly location = injectGeolocationResource({
    enableHighAccuracy: true,
    maximumAge: 5000,
  });

  readonly coords = computed(() => this.location.value());
  readonly isLoading = computed(() => this.location.isLoading());
  readonly error = computed(() => this.location.error());
}
```

The `rxResource` loader wraps the `watchPosition` callback-based API into an `Observable`, then the framework takes over: loading state, error state, and the current value are all signals — no manual subscription, no `DestroyRef` teardown needed.

---

### 3. `injectAsync` for lazy service loading

We applied `injectAsync` across two demo components to showcase deferred DI — a pattern that reduces the initial injection scope of a component to only what it needs at render time.

```typescript
// openlayers-demo.component.ts
readonly olMapService = injectAsync(() =>
  import('@angular-helpers/openlayers').then((m) => m.OlMapService)
);

// password-strength-demo.component.ts
readonly strengthService = injectAsync(() =>
  import('@angular-helpers/security').then((m) => m.PasswordStrengthService)
);
```

This is particularly useful for heavy services that depend on large third-party libraries (milsymbol, OpenLayers itself) where you want to defer the module parse cost until the component actually needs it.

---

### 4. Signal Forms in the storage demo

The storage demo has been refactored to use the stable Signal Forms API. The form state is now a signal graph, not a class instance tree:

```typescript
readonly form = signalForm({
  key: signalFormField<string>({ initialValue: '' }),
  value: signalFormField<string>({ initialValue: '' }),
});
```

Template binding is direct — no `form.get('key')?.value`, no null-checks, no `.getRawValue()`. The signal is the value.

---

## Platform-agnostic improvements

During the upgrade we also fixed a subtle architectural issue in `@angular-helpers/security`. The `RegexWorkerPoolService` was previously constructing its worker URL using a raw `typeof document !== 'undefined'` check and a hardcoded `http://localhost` fallback for SSR environments.

The package already depends on `@angular-helpers/core`, which exports `injectPlatform()` — a DI-aware, SSR-safe platform abstraction. We replaced the manual check:

**Before:**

```typescript
const workerUrl =
  typeof document !== 'undefined'
    ? new URL('assets/workers/regex.worker.js', document.baseURI)
    : new URL('assets/workers/regex.worker.js', 'http://localhost'); // ❌ hardcoded
```

**After:**

```typescript
const { document } = injectPlatform();
const workerUrl = document
  ? new URL('assets/workers/regex.worker.js', document.baseURI)
  : new URL('assets/workers/regex.worker.js', 'https://example.com'); // ✅ never used in SSR
```

Small change, big principle: **a package should use its own core abstractions, not re-implement platform checks**.

---

## Roadmap

This upgrade is the starting point, not the finish line. Here is what we plan to modernize incrementally across each package:

### `@angular-helpers/browser-web-apis`

- Migrate all existing `inject*` functions to expose `rxResource`-based variants alongside the current signal primitives.
- Add `injectNetworkResource` — a reactive resource wrapping the Network Information API.

### `@angular-helpers/storage`

- Replace internal `BehaviorSubject`-based stores with signal-native state using `linkedSignal` for derived cache invalidation.
- Expose a `signalEntityStore` variant of the entity store that returns a typed `WritableSignal` graph instead of observable streams.

### `@angular-helpers/worker-http`

- Integrate the new `httpResource` (coming in a v22 patch) to offer a fully declarative HTTP primitive that runs off the main thread without any boilerplate.

### `@angular-helpers/openlayers`

- Complete migration of all interaction and overlay state to signals.
- Replace the imperative event subscription model in `OlMapService` with a signal-based event bus.

### `@angular-helpers/security`

- Introduce an `REGEX_WORKER_URL` injection token to make the worker URL fully configurable by the consuming application — removing the last remaining deployment assumption from the package.

Angular v22 gives us the tools to write less boilerplate and more intent. We are going to use every one of them.
