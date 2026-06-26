# Proposal: Core Signal Operators

## Intent

Add general-purpose reactive signal operators (`debouncedSignal`, `throttledSignal`, `timerSignal`) to `@angular-helpers/core`. This avoids manually managing RxJS interop wrappers (`toObservable`/`toSignal`) and timing overhead.

## Scope

### In Scope

- Create `debouncedSignal` to delay source signal updates.
- Create `throttledSignal` to rate-limit source signal updates.
- Create `timerSignal` for delayed or periodic numeric increments.
- Implement SSR checks (`isPlatformBrowser`) to prevent server-side rendering stabilization hangs.
- Automatic cleanup via `DestroyRef`.
- Option to pass explicit `Injector`.

### Out of Scope

- DOM event bindings (e.g. debounced click listener).
- RxJS dependency inclusion.

## Capabilities

### New Capabilities

- `core-signal-operators`: General-purpose reactive signal operators (debouncedSignal, throttledSignal, timerSignal) for Angular applications.

### Modified Capabilities

- `None`

## Approach

Implement native-signal timing logic:

1. Wrap browser timing methods (`setTimeout`/`setInterval`) in browser platform checks.
2. Track source changes via Angular `effect`.
3. Support injection context resolution and fallback via manual `Injector` inputs.
4. Auto-clear timer resource handlers upon destruction.

## Affected Areas

| Area                                            | Impact   | Description                       |
| ----------------------------------------------- | -------- | --------------------------------- |
| `packages/core/src/public-api.ts`               | Modified | Exports new operator modules.     |
| `packages/core/src/signals/debounced-signal.ts` | New      | Debounce operator implementation. |
| `packages/core/src/signals/throttled-signal.ts` | New      | Throttle operator implementation. |
| `packages/core/src/signals/timer-signal.ts`     | New      | Timer operator implementation.    |
| `packages/core/src/signals/index.ts`            | New      | Re-exports all three operators.   |

## Risks

| Risk                          | Likelihood | Mitigation                                                 |
| ----------------------------- | ---------- | ---------------------------------------------------------- |
| Node/SSR stabilization block  | Medium     | Guard timing execution with `isPlatformBrowser`.           |
| Resource memory leaks         | High       | Wire all timers to clean up inside `DestroyRef.onDestroy`. |
| Out of injection context call | Medium     | Support fallback `Injector` param for all helpers.         |

## Rollback Plan

Revert git changes to `public-api.ts` and delete files inside `packages/core/src/signals/`.

## Dependencies

- Angular v22 reactivity primitives.

## Success Criteria

- [ ] `debouncedSignal` delays emission until source signal is quiet.
- [ ] `throttledSignal` limits update frequency to the specified interval.
- [ ] `timerSignal` emits correctly at defined time points.
- [ ] SSR execution doesn't block.
- [ ] Zero memory leaks on destruction.
