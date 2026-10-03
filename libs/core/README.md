# ⚡ @angular-helpers/core

Lightweight, high-performance, and SSR-safe foundational primitives for Angular applications — timing signal operators, zero-copy Transferable helpers, Web Worker pooling, and safe platform inspection.

---

## Quick Path

### 1. Installation

```bash
pnpm add @angular-helpers/core
```

### 2. Basic Example

```typescript
import { Component, signal, inject } from '@angular/core';
import { debouncedSignal, injectPlatform, injectWorkerPool } from '@angular-helpers/core';

@Component({
  selector: 'app-search-box',
  template: `
    <input (input)="query.set($any($event.target).value)" placeholder="Search..." />
    <p>Debounced Query: {{ debouncedQuery() }}</p>
  `,
})
export class SearchBoxComponent {
  // Safe platform detection without checking PLATFORM_ID manually
  readonly platform = injectPlatform();

  readonly query = signal('');
  // Native timing operator without RxJS interop overhead
  readonly debouncedQuery = debouncedSignal(this.query, 300);
}
```

---

## Core Primitives

| Primitive                                  | Category          | Description                                                                             |
| :----------------------------------------- | :---------------- | :-------------------------------------------------------------------------------------- |
| `debouncedSignal(source, delay, opts?)`    | **Signals**       | Delays emitting values from source signal until a silence window elapses.               |
| `throttledSignal(source, cooldown, opts?)` | **Signals**       | Rate-limits emissions to at most once per time window (leading & trailing).             |
| `timerSignal(delay, interval?, opts?)`     | **Signals**       | Native interval/timeout signal without RxJS subscription boilerplate.                   |
| `injectPlatform()`                         | **Platform**      | Injects reactive and typed platform detection (`isBrowser`, `isServer`).                |
| `injectWorkerPool(options)`                | **Workers**       | Manages a pooled pool of Web Workers with automatic load balancing and cleanup.         |
| `isTransferable(value)`                    | **Transferables** | Checks if an object implements `Transferable` (ArrayBuffer, ImageBitmap, etc.).         |
| `packTransferable(data)`                   | **Transferables** | Automatically discovers and extracts transferables for zero-copy postMessage transfers. |
| `unpackTransferable(payload)`              | **Transferables** | Restores transferred payloads in the destination thread.                                |

---

## Architecture Guarantees

- **Zoneless Ready**: Fully decoupled from `zone.js`. Every operator is built directly on Angular Signals primitives.
- **SSR Safe**: Safe timer registration and platform checks prevent server hydration hangs.
- **DestroyRef Lifecycle**: Automatically unregisters pending intervals, timeouts, and workers when the enclosing injection context destroys.
- **Tree-shakeable**: Zero side-effects; consumers bundle only the specific functions they import.

---

## Interactive Documentation & Demos

Interactive guides, API explorer, and benchmarks are available at:
👉 **[Angular Helpers Core Docs](https://gaspar1992.github.io/angular-helpers/docs/core)**

---

## License

MIT
