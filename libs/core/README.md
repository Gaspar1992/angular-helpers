# ⚡ @angular-helpers/core

Shared signal primitives, worker pools, error boundaries, and platform utilities for modern zoneless Angular 22+ applications.

---

## Quick Path

### 1. Installation

```bash
pnpm add @angular-helpers/core
```

### 2. Signal & Utility Primitives

```typescript
import { Component, signal } from '@angular/core';
import { debouncedSignal, previousSignal, injectPlatform } from '@angular-helpers/core';

@Component({
  selector: 'app-search-box',
  template: `
    <input [value]="query()" (input)="query.set($any($event.target).value)" />
    <p>Debounced: {{ debounced() }} (Previous: {{ prev() }})</p>
  `,
})
export class SearchBoxComponent {
  readonly query = signal('');
  readonly debounced = debouncedSignal(this.query, 250);
  readonly prev = previousSignal(this.debounced);
  readonly platform = injectPlatform();
}
```

---

## Core Primitives

| Primitive / Entry Point         | Category           | Description                                                             |
| :------------------------------ | :----------------- | :---------------------------------------------------------------------- |
| `debouncedSignal(source, ms)`   | **Signals**        | Delays propagation of signal updates until idle for `ms` milliseconds.  |
| `throttledSignal(source, ms)`   | **Signals**        | Limits signal emissions to at most once per `ms` window.                |
| `previousSignal(source)`        | **Signals**        | Tracks the previous emitted value of a signal without `effect()`.       |
| `timerSignal(ms)`               | **Signals**        | Reactive interval/countdown signal with automatic `DestroyRef` cleanup. |
| `injectPlatform()`              | **SSR / Platform** | SSR-safe access to `isBrowser`, `window`, and `document`.               |
| `injectWorkerPool(url, opts?)`  | **Workers**        | Typed Web Worker pool with timeout, queueing, and main-thread fallback. |
| `injectErrorBoundaryReporter()` | **Resilience**     | Structured error reporting helper for Angular `@boundary` blocks.       |
| `@angular-helpers/core/utils`   | **Utilities**      | Shared retry, assertion, and functional helpers.                        |

---

## Guarantees

- **Zoneless & SSR Ready**: Zero Zone.js assumptions; safe under Angular SSR and incremental hydration.
- **Tree-Shakable**: Pure functions and `sideEffects: false`.

---

## Interactive Documentation

👉 **[Angular Helpers Core Docs](https://gaspar1992.github.io/angular-helpers/docs/core)**

## License

MIT
