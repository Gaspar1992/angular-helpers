# core-signal-operators Specification

## Purpose

Provide general-purpose timing-related Angular Signal operators (`debouncedSignal`, `throttledSignal`, `timerSignal`) under `@angular-helpers/core` with built-in injection context resolution, SSR compatibility, and memory leak mitigation.

## Requirements

### Requirement: debouncedSignal Functionality

The operator `debouncedSignal` MUST return a read-only signal that postpones updating its value until `timeMs` has elapsed since the last change in the source signal.

#### Scenario: Value Debouncing

- GIVEN a source signal with an initial value of "A" and a debouncedSignal created with `timeMs: 100`
- WHEN the source signal updates to "B" at 0ms and "C" at 50ms
- THEN the debouncedSignal MUST retain "A" at 100ms
- AND the debouncedSignal MUST update to "C" at 150ms

#### Scenario: SSR Execution

- GIVEN a server-side rendering context
- WHEN `debouncedSignal` is instantiated
- THEN the returned signal MUST evaluate to the source signal's current value immediately
- AND no browser timers MUST be scheduled on the server

#### Scenario: Memory Cleanup

- GIVEN a `debouncedSignal` active inside an injection context
- WHEN the injection context is destroyed
- THEN all scheduled timers for the debounce action MUST be cleared immediately to prevent memory leaks

---

### Requirement: throttledSignal Functionality

The operator `throttledSignal` MUST rate-limit updates from a source signal using a cooldown window of `timeMs`, returning a read-only signal. It SHOULD accept configuration options for `leading` (trigger immediately) and `trailing` (emit at the end of the window) behavior, defaulting to both true.

#### Scenario: Throttle Leading and Trailing

- GIVEN a source signal with value "A" and a throttledSignal with `timeMs: 100` and default options (leading: true, trailing: true)
- WHEN the source signal updates to "B" at 0ms, "C" at 50ms, and "D" at 70ms
- THEN the throttledSignal MUST update to "B" immediately at 0ms
- AND the throttledSignal MUST update to "D" at 100ms

#### Scenario: SSR Execution

- GIVEN a server-side rendering context
- WHEN `throttledSignal` is instantiated
- THEN the returned signal MUST evaluate to the source signal's current value immediately
- AND no browser timers MUST be scheduled on the server

#### Scenario: Memory Cleanup

- GIVEN a `throttledSignal` active inside an injection context
- WHEN the injection context is destroyed
- THEN all pending timers for the throttle action MUST be cleared immediately

---

### Requirement: timerSignal Functionality

The function `timerSignal` MUST return a read-only signal that starts emitting incrementing numbers starting at 0 after an initial delay, and then ticks at a regular interval. Both the initial delay and tick interval MUST be customizable in milliseconds.

#### Scenario: Periodic Tick Emission

- GIVEN a `timerSignal` created with an initial delay of 50ms and a tick interval of 100ms
- WHEN time reaches 0ms, 50ms, 150ms, and 250ms
- THEN the signal value MUST be 0 at 0ms, 0 at 50ms, 150ms, and 250ms -> Wait, it says: "0 at 0ms, 0 at 50ms, 1 at 150ms, and 2 at 250ms" (Line 59 in delta spec)
- THEN the signal value MUST be 0 at 0ms, 0 at 50ms, 1 at 150ms, and 2 at 250ms

#### Scenario: SSR Execution Bypass

- GIVEN a server-side rendering context
- WHEN `timerSignal` is instantiated
- THEN the signal MUST emit an initial value of 0 immediately
- AND no timers or intervals MUST be scheduled on the server to prevent blocking the page load

#### Scenario: Memory Cleanup

- GIVEN a running `timerSignal`
- WHEN the creation context is destroyed
- THEN the tick timer interval MUST be cleared immediately

---

### Requirement: Injection Context and Custom Injector

All operators (`debouncedSignal`, `throttledSignal`, `timerSignal`) MUST resolve dependencies using the current injection context by default. If called outside an injection context, or if a custom injector is explicitly passed, they MUST support a custom `Injector` parameter.

#### Scenario: Context Resolution and Injector Override

- GIVEN an active Angular injection context or a custom `Injector` instance passed as an option
- WHEN any of the signal operators are instantiated
- THEN they MUST resolve `DestroyRef` and other dependencies successfully using the provided/resolved injector
