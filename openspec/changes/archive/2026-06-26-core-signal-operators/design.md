# Design: Core Signal Operators

## Technical Approach

Add general-purpose, high-performance, and SSR-safe timing signal operators to `@angular-helpers/core`. To avoid standard interoperability wrapper overhead (converting Signal -> Observable -> Signal), these utilities will be written as native Angular signal operators using `effect` and browser-safe timing primitives (`setTimeout`, `setInterval`).

## Architecture Decisions

| Option                                                      | Tradeoff                                                                                                                             | Decision                                                                                                                             |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Native Signals (effect + setTimeout/setInterval)**        | Requires manual timing logic and cleanup hooks. Minimal bundle size and maximum performance.                                         | **Chosen**. Provides direct control over timing execution, initial value synchronicity, and SSR compatibility without RxJS overhead. |
| **RxJS Interoperability Wrapper (toObservable + toSignal)** | Extremely quick to write. Heavy performance and memory overhead, asynchronous scheduling, and initialization timing issues in tests. | **Rejected**. The extra overhead of converting signals back and forth is unnecessary and introduces async microtask delays.          |

### Decision: Environment Detection & SSR Safety

**Choice**: Use `injectPlatform()` utility from `src/utils/platform.ts` / `@angular-helpers/core`.
**Alternatives considered**: Direct `isPlatformBrowser` checks using Angular `PLATFORM_ID`.
**Rationale**: `injectPlatform()` is the project's standardized, DI-aware, and safe way of detecting browser/server contexts with fallback options for non-injection context tests. By checking `.isBrowser`, we completely bypass timer/interval scheduling on the server, avoiding stabilization hangs during SSR.

### Decision: Injection Context Fallback & Custom Injector

**Choice**: Support an optional `options.injector` parameter. If absent, assert injection context using `assertInInjectionContext()`.
**Alternatives considered**: Require injection context strictly (no custom injector parameter).
**Rationale**: Support for a custom `Injector` is critical to allow usage in lifecycle hooks or callbacks where the default injection context is lost.

## Data Flow

Data flows from the `source` signal into an internal `effect`. The effect schedules/cooldowns timing states and publishes values to an internal writable `signal` that is returned as a read-only signal.

```
[source: Signal<T>] ──(read/track)──→ [effect] ──(setTimeout/setInterval)──→ [internal: WritableSignal<T>] ──(read-only)──→ [returned: Signal<T>]
```

## File Changes

| File                                             | Action | Description                                                                                                         |
| ------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------- |
| `packages/core/src/fns/debounced-signal.ts`      | Create | Implements `debouncedSignal` with custom timeout-based delay logic.                                                 |
| `packages/core/src/fns/throttled-signal.ts`      | Create | Implements `throttledSignal` with custom time-window rate-limiting logic supporting leading and trailing emissions. |
| `packages/core/src/fns/timer-signal.ts`          | Create | Implements `timerSignal` with delay and interval numeric counters.                                                  |
| `packages/core/src/fns/debounced-signal.spec.ts` | Create | Unit tests for `debouncedSignal` covering debouncing scenarios, memory cleanup, and SSR safety.                     |
| `packages/core/src/fns/throttled-signal.spec.ts` | Create | Unit tests for `throttledSignal` covering leading/trailing, memory cleanup, and SSR safety.                         |
| `packages/core/src/fns/timer-signal.spec.ts`     | Create | Unit tests for `timerSignal` covering tick timing, interval behavior, cleanup, and SSR safety.                      |
| `packages/core/src/public-api.ts`                | Modify | Exports the new signal functions.                                                                                   |
| `packages/core/README.md`                        | Create | Package documentation detailing API usage for core utilities.                                                       |
| `README.md`                                      | Modify | Update root documentation to list `@angular-helpers/core` and describe its signal operators.                        |

## Interfaces / Contracts

```typescript
import { Injector, Signal } from '@angular/core';

export function debouncedSignal<T>(
  source: Signal<T>,
  timeMs: number,
  options?: { injector?: Injector },
): Signal<T>;

export function throttledSignal<T>(
  source: Signal<T>,
  timeMs: number,
  options?: { leading?: boolean; trailing?: boolean; injector?: Injector },
): Signal<T>;

export function timerSignal(
  delay: number,
  interval?: number,
  options?: { injector?: Injector },
): Signal<number>;
```

## Testing Strategy

| Layer | What to Test                                 | Approach                                                                                                                 |
| ----- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Unit  | Value debouncing timing assertions           | GIVEN a source signal, WHEN updated at t=0 and t=50, THEN assert debounced signal updates at t=150 (Vitest fake timers). |
| Unit  | Value throttle leading/trailing combinations | GIVEN a source signal, WHEN updated at t=0, t=50, and t=70, THEN assert immediate/delayed emission at t=0 and t=100.     |
| Unit  | Timer ticks and delay behavior               | GIVEN a timer with 50ms delay and 100ms interval, THEN assert value increases at correct tick times.                     |
| Unit  | Memory leak prevention (Teardown)            | Destroy injection context (`Injector` / `DestroyRef`) and assert timeouts/intervals are cleared.                         |
| Unit  | SSR Execution Safety                         | Fake `injectPlatform().isBrowser` to false and assert timers are skipped, returning initial value immediately.           |
| Unit  | Injection context errors                     | Verify calling without injection context (and without custom injector) throws.                                           |

## Migration / Rollout

No migration required. This is a purely additive feature to the `@angular-helpers/core` package.

## Open Questions

- None
