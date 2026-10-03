# 💾 @angular-helpers/storage

A high-performance, tiered, and encrypted reactive storage system for Angular. Bridges synchronous L1 memory Signal Cache with persistent async L2 backends (Cache API, IndexedDB, WebStorage, and Web Worker transports) with optional AES-GCM encryption and schema drift auto-repair.

---

## Quick Path

### 1. Installation

```bash
pnpm add @angular-helpers/storage
```

### 2. Basic Signal Storage (L1 + L2 Cache API)

```typescript
import { Component } from '@angular/core';
import { injectStorageSignal } from '@angular-helpers/storage';

@Component({
  selector: 'app-theme-toggle',
  template: `
    <button (click)="theme.set(theme() === 'dark' ? 'light' : 'dark')">
      Toggle Theme: {{ theme() }}
    </button>
    @if (theme.loading()) {
      <span>Syncing...</span>
    }
  `,
})
export class ThemeToggleComponent {
  // Synchronous L1 Signal with native Cache API L2 in background
  readonly theme = injectStorageSignal<'light' | 'dark'>('app-theme', 'light', {
    storageType: 'cacheapi',
    serializer: 'json',
  });
}
```

### 3. High-Performance Entity Store

```typescript
import { injectEntityStore } from '@angular-helpers/storage';

interface Product {
  id: string;
  name: string;
  price: number;
}

// O(1) key-level reactive reads and surgical updates
const productStore = injectEntityStore<Product>({
  name: 'products',
  selectId: (p) => p.id,
  storageType: 'indexeddb',
});

productStore.addOne({ id: 'p1', name: 'Angular Book', price: 29.99 });
const product = productStore.selectById('p1'); // WritableSignal<Product | undefined>
```

---

## Core Primitives

| Primitive                                  | Category         | Description                                                                                       |
| :----------------------------------------- | :--------------- | :------------------------------------------------------------------------------------------------ |
| `injectStorageSignal(key, default, opts?)` | **Signals**      | Multi-tier L1/L2 reactive storage signal with `loading()`, `error()`, and `status()` sub-signals. |
| `injectEntityStore(config)`                | **Entity State** | Key-level reactive entity collection with surgical change notifications and index tracking.       |
| `STORAGE_TRANSPORT`                        | **Transport DI** | InjectionToken to customize or swap transport engines across the application.                     |
| `LocalStorageTransport`                    | **Transports**   | Synchronous LocalStorage transport adapter with prefix and quota handling.                        |
| `SessionStorageTransport`                  | **Transports**   | Transient session transport adapter.                                                              |
| `IndexedDBTransport`                       | **Transports**   | Large-payload asynchronous database storage.                                                      |
| `CacheApiTransport`                        | **Transports**   | High-performance origin Cache Storage backend.                                                    |
| `WorkerTransport`                          | **Transports**   | Off-main-thread storage operations via Web Workers.                                               |

---

## Key Features & Guarantees

- **Two-Tier Architecture (L1 + L2)**: Reads are instantaneous from the L1 in-memory Signal. Persisted writes flush asynchronously to L2 without blocking UI frames.
- **Schema Drift Auto-Repair**: If stored data in the browser fails runtime validation after an app update, the store automatically falls back to defaults and repairs corrupted records.
- **Transparent Encryption**: Optional client-side AES-GCM encryption with PBKDF2 salt derivation.
- **Zoneless & SSR Safe**: Degrades gracefully on the server without breaking hydration.

---

## Interactive Documentation & Demos

Live interactive demonstrations and API guides:
👉 **[Angular Helpers Storage Docs](https://gaspar1992.github.io/angular-helpers/docs/storage)**
👉 **[Storage & Entity Demo](https://gaspar1992.github.io/angular-helpers/demo/storage)**

---

## License

MIT
