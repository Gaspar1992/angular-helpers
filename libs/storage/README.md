# 💾 @angular-helpers/storage

Tiered, encrypted reactive storage for Angular 22+. Combines synchronous L1 Signal state with asynchronous L2 persistence (LocalStorage, SessionStorage, IndexedDB, Cache API, or Web Worker transports), reactive `Signal<string>` keys, and O(1) `EntityStore`.

---

## Quick Path

### 1. Installation

```bash
pnpm add @angular-helpers/storage
```

### 2. Provider Setup

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideStorage } from '@angular-helpers/storage';

export const appConfig: ApplicationConfig = {
  providers: [
    provideStorage({
      passphrase: 'app-secret-passphrase',
    }),
  ],
};
```

### 3. Signal & Resource Storage (Static or Reactive Keys)

```typescript
import { Component, signal } from '@angular/core';
import { injectStorageSignal, injectStorageResource } from '@angular-helpers/storage';

@Component({
  selector: 'app-prefs',
  template: `
    <p>Theme: {{ theme() }}</p>
    <p>Draft: {{ draft.resource.value() }}</p>
  `,
})
export class PrefsComponent {
  readonly docId = signal('draft:1');
  readonly theme = injectStorageSignal<'light' | 'dark'>('app-theme', 'dark');
  readonly draft = injectStorageResource(this.docId, '');
}
```

### 4. O(1) Reactive `EntityStore`

```typescript
import { injectEntityStore } from '@angular-helpers/storage';

interface Product {
  id: string;
  name: string;
}

const store = injectEntityStore<string, Product>({
  idKey: 'id',
  persistKey: 'products',
  storageOptions: { storageType: 'indexeddb' },
});

store.setOne({ id: 'p1', name: 'Angular Guide' });
const item = store.entitySignal('p1'); // O(1) Signal<Product | undefined>
```

---

## Core Primitives

| Primitive                                         | Category         | Description                                                                             |
| :------------------------------------------------ | :--------------- | :-------------------------------------------------------------------------------------- |
| `provideStorage(config?)`                         | **DI Setup**     | Configures AES-GCM passphrase, worker factory, and custom `StorageTransport`.           |
| `injectStorageSignal(key, defaultValue, opts?)`   | **Signals**      | L1/L2 signal supporting static `string` or reactive `Signal<string>` keys.              |
| `injectStorageResource(key, defaultValue, opts?)` | **Resources**    | Angular `resource()`-backed storage synced to reactive `Signal<string>` keys.           |
| `injectEntityStore(options)`                      | **Entity State** | Freeze-on-write entity store with O(1) `entitySignal(id)` and microtask L2 persistence. |
| `OfflineSyncService`                              | **Offline**      | Queues mutations offline and replays them when connectivity returns.                    |

---

## Interactive Documentation & Demo

👉 **[Storage Docs](https://gaspar1992.github.io/angular-helpers/docs/storage)**
👉 **[Storage Live Demo](https://gaspar1992.github.io/angular-helpers/demo/storage)**

## License

MIT
