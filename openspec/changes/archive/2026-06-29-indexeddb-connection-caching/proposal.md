# Proposal: IndexedDB Connection Caching

## 1. Overview & Motivation

Currently, `IndexedDBTransport` opens a new connection to IndexedDB on every `read`, `write`, and `delete` operation by invoking `indexedDB.open(dbName)` inside `openDB`. While modern browsers optimize connection handling to some degree, opening and closing connections repeatedly introduces latency, increases overhead, and can lead to transaction blocking or version-change conflicts.

This proposal introduces a connection caching mechanism within `IndexedDBTransport` using a private connection pool (`dbCache`). By caching the `Promise<IDBDatabase>` per database name, we ensure that concurrent and subsequent operations share the same active database connection, improving performance and reliability.

---

## 2. Scope

### In Scope

- Modify [indexeddb.transport.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/storage/worker/src/services/transports/indexeddb.transport.ts) to introduce a private `dbCache: Map<string, Promise<IDBDatabase>>`.
- Cache the promise returned by `openDB` keyed by `dbName`.
- Implement eviction and cleanup logic:
  - If a connection request fails (promise rejects), remove the promise from the cache so subsequent requests can retry.
  - Listen for `versionchange` events on the opened `IDBDatabase` instance. When triggered, close the connection immediately to prevent blocking database upgrades, and evict the connection from the cache.
  - Listen for `close` events on the `IDBDatabase` instance and evict it from the cache.

### Out of Scope

- Modifying other storage transports (e.g., `LocalStorageTransport`, `SessionStorageStorageTransport`, or any memory-based transports).
- Changing the public API or signature of `IndexedDBTransport` methods.
- Adding complex connection pool size limits (a simple 1:1 mapping of `dbName` to connection is sufficient since the number of databases used by the application is very small, typically just `'ah_db'`).

---

## 3. Technical Design

### Connection Cache State

A private class member `dbCache` will be added to `IndexedDBTransport`:

```typescript
private readonly dbCache = new Map<string, Promise<IDBDatabase>>();
```

### Connection Lifecycle & Eviction

To avoid holding onto stale or broken connections, we will handle three lifecycle phases:

1. **Creation & Caching**: When `openDB(dbName, storeName)` is called:
   - If `this.dbCache.has(dbName)` is true, return the cached promise.
   - Otherwise, create a new connection promise, store it in `this.dbCache`, and return it.
2. **Rejection Cleanup**: If the `indexedDB.open` request fails, we must catch the error, evict the promise from the cache, and propagate the error.
3. **Connection Event Listeners**: Once the promise resolves to an `IDBDatabase` instance, attach event listeners:
   - `onversionchange`: Call `db.close()` and delete the entry from `this.dbCache`.
   - `onclose`: Delete the entry from `this.dbCache`.

### Proposed Code Structure in `openDB`

```typescript
private async openDB(dbName: string, storeName: string): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    throw new Error('IndexedDB is not supported in this environment');
  }

  let dbPromise = this.dbCache.get(dbName);
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName);
      }
    };

    request.onsuccess = () => {
      const db = request.result;

      db.onversionchange = () => {
        db.close();
        this.dbCache.delete(dbName);
      };

      db.onclose = () => {
        this.dbCache.delete(dbName);
      };

      resolve(db);
    };

    request.onerror = () => {
      this.dbCache.delete(dbName);
      reject(request.error);
    };
  });

  this.dbCache.set(dbName, dbPromise);
  return dbPromise;
}
```

---

## 4. Risks & Mitigations

| Risk                              | Impact | Mitigation                                                                                                                                                                                                                                        |
| :-------------------------------- | :----- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Stale Cache / Silent Failures** | Medium | If a connection is closed unexpectedly, subsequent operations might fail if they use a stale connection. We mitigate this by listening to the `onclose` and `onerror` events to evict the connection immediately.                                 |
| **Database Upgrades Blocked**     | High   | If another tab or worker tries to upgrade the database version while a connection is cached, the upgrade will be blocked. We mitigate this by listening to `onversionchange`, closing the connection immediately, and evicting it from the cache. |
| **Memory Leak**                   | Low    | Since the number of database names is extremely small (typically just one), the `dbCache` Map size will be negligible.                                                                                                                            |
