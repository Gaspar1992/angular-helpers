---
title: 'Elevating Angular Storage: Zero-Copy, Off-Main-Thread Serialization, and Unergonomic APIs'
publishedAt: '2026-05-20'
tags: ['storage', 'performance', 'web-workers', 'signals', 'architecture']
excerpt: 'A deep dive into the massive performance overhaul of @angular-helpers/storage. Learn how we eliminated UI jank using off-main-thread serialization, implemented zero-copy data movement with Transferable Objects, and refactored our APIs for maximum ergonomics.'
---

# High-Performance Persistence: Beyond the Main Thread

Most storage libraries for Angular treat persistence as a side effect. They do the heavy lifting—like `JSON.stringify`, dynamic compression, or AES-GCM encryption—on the **Main Thread**. For small objects, it’s fine. For real-world applications with massive state or complex data, it’s a recipe for dropped frames and "janky" user interfaces.

Today, we are announcing a performance overhaul for `@angular-helpers/storage`. We’ve moved the "heavy lifting" where it belongs: **Off-Main-Thread**, and we've optimized the data bus to be effectively free using Zero-Copy transfers.

---

## ⚡ 1. Off-Main-Thread Serialization & Crypto

Serialization is expensive. Crying out `JSON.stringify()` on a 5MB object can freeze the UI for 100ms+. Add encryption or TOON compression on top, and you’ve lost the battle for 60 FPS.

We’ve refactored `LocalStorageTransport` to be **Worker-Aware**. If you provide a `STORAGE_WORKER_FACTORY`, the transport automatically delegates these tasks to a background Web Worker.

- **Before**: Main Thread (Serialize) -> Main Thread (Encrypt) -> Async Write.
- **After**: Main Thread (Send Object) -> Worker (Serialize + Encrypt) -> Worker (Async Write).

Your UI stays fluid, even when saving massive datasets.

---

## 🏎️ 2. Zero-Copy transfers (Transferable Objects)

Usually, when you send data to a Web Worker, JavaScript **clones** it. If you send a 10MB buffer, you momentarily use 20MB of RAM and pay the CPU cost of the copy.

We now implement **Transferable Objects** support. By detecting `ArrayBuffer` instances in your payloads, we "transfer" the memory ownership instead of copying it. It’s an $O(1)$ operation that is nearly instantaneous regardless of data size.

```typescript
// This huge buffer moves to the worker in 0ms without being copied
const hugeData = new Uint8Array(1024 * 1024 * 50).buffer;
storage.write('big-data', hugeData);
```

---

## 🧹 3. Solving the EntityStore Memory Leak

Our "surgical reactivity" in `EntityStore` allows you to listen to a single entity without re-evaluating the whole list. However, we discovered that these internal signals were being retained even after an entity was deleted.

We've implemented a manual **Garbage Collection** mechanism. Now, calling `deleteOne(id)` not only updates consumers to `undefined`, but also purges the signal from internal memory, ensuring your app stays lean during long sessions.

---

## 🎨 4. DX Win: Flattened Signal API

We listened to your feedback. Accessing `.data` every time you wanted to read a storage signal was unergonomic. We've used the power of Angular Signals to flatten the API.

```typescript
// OLD v21.12.0
const theme = injectStorageSignal('theme', 'light');
console.log(theme().data); // 🤮
theme.set({ data: 'dark', loading: false, error: null }); // 🤮🤮

// NEW v21.14.0
const theme = injectStorageSignal('theme', 'light');
console.log(theme()); // 😍
theme.set('dark'); // 😍😍

// Metadata is still there if you need it
if (theme.loading()) {
  /* ... */
}
```

---

## 📐 5. Refactored to Strategy Pattern

Finally, we've broken down the monolithic `LocalStorageTransport` into specialized classes: `IndexedDBTransport`, `CacheApiTransport`, and `WebStorageTransport`.

This makes the library:

1. **Tree-shakable**: You only pay for the storage engines you actually use.
2. **Extensible**: Adding a new transport (like `SharedWorker` or `FileAPI`) is now a matter of implementing a single interface.

---

## 🏁 Summary

Performance isn't just about speed; it's about **predictability**. By moving heavy tasks off the main thread and optimizing the communication layer, `@angular-helpers/storage` ensures that your app's persistence layer never gets in the way of a smooth user experience.

Check out the updated documentation and start building jank-free Angular apps today!
