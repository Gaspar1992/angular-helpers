# Tasks: Add In-Memory Storage Transport

## Review Workload Forecast

- Estimated changed lines: 180-240 lines (Low)
- Decision needed before apply: No
- Chained PRs recommended: No
- Chain strategy: size-exception
- 400-line budget risk: Low

---

## Phase 1: Foundation & Interfaces

- [x] **Task 1.1: Register `'memory'` storage type**
  - Update standard `storageType` options inside the core type definitions.
  - **File**: `packages/storage/worker/src/interfaces/storage-options.types.ts`
  - **Verification**: Code compiles successfully.

---

## Phase 2: Core Transport Implementation

- [x] **Task 2.1: Create In-Memory Transport Class**
  - Implement `InMemoryStorageTransport` satisfying `StorageTransport`.
  - Use `Map<string, string>` as internal storage.
  - Implement `read`, `write`, `delete` supporting `encrypt`/`decrypt` and JSON/toon serialization.
  - Implement `onChange` subscription/event notification via an internal list/map of listeners.
  - **File**: `packages/storage/src/services/transports/in-memory.transport.ts`
  - **Verification**: Compilation passes with clean imports.

---

## Phase 3: Integration & Fallback

- [x] **Task 3.1: Integrate in LocalStorageTransport**
  - Instantiate `InMemoryStorageTransport` inside `LocalStorageTransport`.
  - Add `'memory'` option to public `storageType` parameters and register in transport resolution logic.
  - **File**: `packages/storage/src/services/local-transport.ts`
  - **Verification**: Resolve transport returns the in-memory transport when `'memory'` is selected.

---

## Phase 4: Verification & Tests

- [x] **Task 4.1: Write Unit Tests**
  - Create spec file for in-memory transport testing basic read/write/delete.
  - Test data isolation (serialization creates deep clones).
  - Test encryption support with a passphrase.
  - Test `onChange` subscription callbacks and cleanup.
  - Test integration routing inside `LocalStorageTransport`.
  - **File**: `packages/storage/src/services/transports/in-memory.transport.spec.ts`
  - **Verification**: Run `vitest` to execute storage tests and confirm 100% pass rate.
