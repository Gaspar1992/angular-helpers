# @angular-helpers/core

A collection of lightweight, high-performance, and SSR-safe core utilities for Angular applications.

## Signal Operators

This package provides native timing signal operators that do not depend on RxJS interop wrappers, ensuring minimal bundle footprint and synchronous initial evaluations.

### `debouncedSignal`

Creates a signal that delays emitting values from the source signal until after a specified duration has elapsed since the last change.

```typescript
import { signal } from '@angular/core';
import { debouncedSignal } from '@angular-helpers/core';

// Inside an injection context
const source = signal('initial');
const debounced = debouncedSignal(source, 300);

source.set('new value');
// debounced() is still 'initial'
// After 300ms, debounced() becomes 'new value'
```

#### Parameters

- `source: Signal<T>`: The source signal to debounce.
- `timeMs: number`: Debounce delay in milliseconds.
- `options?: { injector?: Injector }`: Optional injector to run the function outside an active injection context.

---

### `throttledSignal`

Creates a rate-limited signal that emits at most once in every specified duration. Supports both leading and trailing emissions.

```typescript
import { signal } from '@angular/core';
import { throttledSignal } from '@angular-helpers/core';

// Inside an injection context
const source = signal('initial');
const throttled = throttledSignal(source, 300, { leading: true, trailing: true });

source.set('first change'); // Emits immediately ('first change')
source.set('second change'); // Ignored for immediate emission, scheduled for t=300ms
```

#### Parameters

- `source: Signal<T>`: The source signal to throttle.
- `timeMs: number`: Cooldown time window in milliseconds.
- `options?: { leading?: boolean; trailing?: boolean; injector?: Injector }`:
  - `leading` (default: `true`): Emit immediately on the leading edge.
  - `trailing` (default: `true`): Emit the last value on the trailing edge.
  - `injector`: Optional injector.

---

### `timerSignal`

Creates a signal that starts at `0` and increments by 1 after a delay, optionally repeating at regular intervals.

```typescript
import { timerSignal } from '@angular-helpers/core';

// Inside an injection context
// One-shot timer: emits 1 after 1000ms
const timer = timerSignal(1000);

// Repeating timer: emits 1 after 1000ms, then increments every 500ms
const ticker = timerSignal(1000, 500);
```

#### Parameters

- `delay: number`: The initial delay in milliseconds before the timer starts.
- `interval?: number`: Optional periodic interval in milliseconds for subsequent ticks.
- `options?: { injector?: Injector }`: Optional injector.
