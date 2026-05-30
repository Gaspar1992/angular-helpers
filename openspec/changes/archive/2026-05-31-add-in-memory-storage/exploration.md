# Exploration: Add In-Memory Storage Transport

This document explores the architectural design, implementation details, and impact of introducing an in-memory storage transport (`InMemoryStorageTransport`) in the `@angular-helpers/storage` package.

---

## 1. Executive Summary

Adding an in-memory transport to `@angular-helpers/storage` will:

- Provide a robust, non-throwing fallback for Non-Browser Environments (SSR/Prerendering) where native storage APIs (`localStorage`, `sessionStorage`, `indexedDB`, `Cache`) are unavailable.
- Offer a pure transient memory storage option for unit tests and quick interactive UI flows.
- Simplify configuration by establishing a zero-setup, highly robust fallback out-of-the-box.

---

## 2. Technical Design

### 2.1 The `InMemoryStorageTransport` Implementation

We will design a new transport in a dedicated file: `packages/storage/src/services/transports/in-memory.transport.ts`.

It will implement the `StorageTransport` interface from `@angular-helpers/storage/worker`:

```typescript
import { StorageTransport } from '../storage-transport';
import { StorageSignalOptions } from '../../interfaces/storage-options.types';

/**
 * In-memory transient storage transport.
 * Safe fallback for SSR and useful for unit tests / mocked state.
 */
export class InMemoryStorageTransport implements StorageTransport {
  private readonly memory = new Map<string, any>();
  private readonly listeners = new Map<string, Set<(value: any) => void>>();

  async read<T>(key: string, _options?: StorageSignalOptions): Promise<T | undefined> {
    return this.memory.get(key) as T | undefined;
  }

  async write<T>(key: string, data: T, _options?: StorageSignalOptions): Promise<void> {
    this.memory.set(key, data);
    const callbacks = this.listeners.get(key);
    if (callbacks) {
      callbacks.forEach((cb) => cb(data));
    }
  }

  async delete(key: string, _options?: StorageSignalOptions): Promise<void> {
    this.memory.delete(key);
    const callbacks = this.listeners.get(key);
    if (callbacks) {
      callbacks.forEach((cb) => cb(undefined));
    }
  }

  onChange<T>(key: string, callback: (value: T) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(callback);

    return () => {
      const callbacks = this.listeners.get(key);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(key);
        }
      }
    };
  }
}
```

---

## 3. Affected Files Analysis

### 3.1 `packages/storage/worker/src/interfaces/storage-options.types.ts`

We must expand the `'storageType'` union to include `'memory'`:

```typescript
export interface StorageSignalOptions<T = any> {
  storageType: 'local' | 'session' | 'indexeddb' | 'cacheapi' | 'memory';
  // ...
}
```

### 3.2 `packages/storage/src/services/local-transport.ts`

- Import `InMemoryStorageTransport` and type definition.
- Expand `storageType` property type signature:
  ```typescript
  public storageType: 'local' | 'session' | 'indexeddb' | 'cacheapi' | 'memory' = 'local';
  ```
- Instantiate `InMemoryStorageTransport` as a private property:
  ```typescript
  private readonly inMemory: InMemoryStorageTransport;
  ```
- In the constructor, detect if running in a non-browser environment (`!isBrowser`) and default to `'memory'` instead of the potential crash-inducing or warning-heavy default (which was previously `'indexeddb'` when `!isBrowser`):
  ```typescript
  this.inMemory = new InMemoryStorageTransport();
  // ...
  if (!isBrowser) {
    this.storageType = 'memory';
  }
  ```
- Update `resolveTransport(type)` to match `'memory'`:
  ```typescript
  case 'memory':
    return this.inMemory;
  ```

### 3.3 `packages/storage/src/public-api.ts`

Export the new class so developers can use it in unit tests or custom providers:

```typescript
export * from './services/transports/in-memory.transport';
```

---

## 4. SSR and Non-Browser Environment Safety Strategy

Using `'memory'` as the default `storageType` when `isBrowser === false` delivers an elegant solution for SSR / static-site generation (SSG) in Angular:

1. **No Errors**: Node.js will not complain about `window`, `localStorage`, or `indexedDB` being undefined.
2. **Transient State**: Reads will seamlessly return `undefined` (or default values), and writes will update in-memory objects during the render lifecycle without leaking cross-request state if carefully discarded (though in-memory is transient).

---

## 5. Integration and Testing Plan

We can add dedicated unit tests under `packages/storage/src/services/transports/in-memory.transport.spec.ts` or in `local-transport.spec.ts`:

- **Read/Write/Delete Isolation**: Ensure data written is retrieved correctly and deleted successfully.
- **Change Notifications**: Ensure `onChange` listener triggers upon writes/deletes.
- **LocalTransport Integration**: Verify that `LocalStorageTransport` falls back to `'memory'` when SSR or when explicitly requested.
