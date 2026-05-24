# 📐 @angular-helpers/storage

A premium, high-performance, and secure reactive storage system for Angular. It bridges a fast synchronous L1 memory Signal Cache with async L2 storage backends (Cache API, IndexedDB, Local/SessionStorage) with optional AES-GCM encryption, dynamic TOON compression, and surgical key-level reactive Entity management.

---

## ⚡ Quick Path

### 1. Import and Setup

```typescript
import { injectStorageSignal, injectEntityStore } from '@angular-helpers/storage';
```

### 2. Basic Signal Storage (L1 + L2 Cache API)

```typescript
// Synchronous L1 Signal, Native Cache API L2 in background
const userPref = injectStorageSignal('user-pref', 'light-mode', {
  storageType: 'cacheapi',
  serializer: 'json',
});

// Read value directly (automatically handles async loading states)
console.log(userPref()); // 'light-mode'

// Check metadata via sub-signals
console.log(userPref.loading()); // true | false
console.log(userPref.error()); // Error | null

// Reactive write - auto-persists to Cache API
userPref.set('dark-mode');
```

### 3. Schema Drift & Safe Validation

```typescript
// Protect your application state against local storage schema changes across versions
const userPref = injectStorageSignal('user-pref', 'light-mode', {
  storageType: 'local',
  serializer: 'json',
  validator: (data): data is 'light-mode' | 'dark-mode' =>
    data === 'light-mode' || data === 'dark-mode',
});
```

If L2 storage contains a corrupted or legacy structure that fails the `validator`:

1. The signal falls back safely to the `defaultValue` (`'light-mode'`).
2. The `userPref.error()` signal emits a detailed schema validation error.
3. The system **auto-repairs** the local database by rewriting it with the clean default value.

---

### 4. High-Performance Entity Store

```typescript
interface Product {
  id: string;
  name: string;
  price: number;
}

const productStore = injectEntityStore<string, Product>({
  idKey: 'id',
  persistKey: 'products-cache',
  storageOptions: {
    storageType: 'indexeddb',
    serializer: 'toon', // Compresses payload up to 60%!
  },
});

// 1. Write-Once, Freeze-Once O(1) insertion
productStore.setOne({ id: 'P1', name: 'Laptop', price: 999 });

// 2. Partial Update (Patch)
productStore.patch('P1', { price: 899 });

// 3. Function-based update
productStore.update('P1', (p) => ({ ...p, price: p.price * 1.1 }));

// 4. Read entities safely (frozen in runtime, compile-time ReadonlyMap)
const laptop = productStore.entities().get('P1');
// laptop.price = 1000; // ❌ Throws TypeError in runtime, compile error in TS!

// 5. Surgical Granular Reactivity
// This computed signal ONLY evaluates when product 'P1' changes.
// Updates to product 'P2' will NOT trigger re-evaluation!
const productSignal = productStore.entitySignal('P1');
const laptopName = computed(() => productSignal()?.name);
```

---

## 🔬 Under the Hood

| Core Feature               | Technical Strategy                               | Cognitive Benefit                                                                      |
| :------------------------- | :----------------------------------------------- | :------------------------------------------------------------------------------------- |
| **Strategy Transport**     | Pluggable `StorageTransport` interface           | MVP on main thread today, 100% transparent Shared Worker upgrade tomorrow.             |
| **Native Cache API**       | Directly utilizes `window.caches`                | Offloads heavy JSON/TOON parsing off the main thread natively via `Response.json()`.   |
| **Write-Once Freeze-Once** | `Object.freeze` applied only on `set` operations | Guaranteed immutability with near-zero read performance penalty.                       |
| **TOON Serializer**        | Pluggable token-based serializer                 | Compresses structured array payloads by 30-60%, bypassing standard 5MB storage limits. |
| **WebCrypto AES-GCM**      | Native asynchronous browser cryptography         | Seamlessly encrypts data at rest with hardware-accelerated algorithms.                 |

---

## 🛠️ Verification Checklist

- [ ] **Runtime immutability**: Bypassing compile safety via `(store.entities() as any).set(...)` throws a runtime `TypeError`.
- [ ] **Granular updates**: Modifying entity A does not trigger change evaluation on components listening to entity B.
- [ ] **Incognito boundaries**: Safari private browsing fallback automatically protects active signals when database writes fail.
