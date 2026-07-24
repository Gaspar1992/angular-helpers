---
title: 'worker-http v21.2.0: TOON serializer — 30–60% smaller postMessage payloads for uniform arrays'
publishedAt: '2026-04-26'
tags: ['worker-http', 'toon', 'serialization', 'performance', 'angular', 'postMessage']
excerpt: 'Most API responses are uniform arrays of objects, and most of those bytes are repeated keys. We added TOON (Token-Oriented Object Notation) as a first-class serializer for the worker↔main boundary. The auto-serializer now picks it automatically when it makes sense — and falls back to structured-clone or seroval when it does not.'
---

# worker-http v21.2.0: TOON serializer — 30–60% smaller postMessage payloads for uniform arrays

Most API responses your app fetches are arrays of similarly-shaped objects: `User[]`, `Product[]`, paginated lists, audit logs, time-series rows. And most of the bytes in those JSON arrays are **repeated keys**:

```json
[
  { "id": 1, "name": "Alice", "role": "admin" },
  { "id": 2, "name": "Bob", "role": "member" },
  { "id": 3, "name": "Carol", "role": "member" }
]
```

`id`, `name`, and `role` appear in every row. The structure is fully redundant — a CSV-style table would carry the same information in a fraction of the bytes.

That is exactly what **TOON** ([Token-Oriented Object Notation](https://toonformat.dev)) does, and as of `@angular-helpers/worker-http@21.2.0` it is a first-class serializer for the worker↔main `postMessage` boundary.

---

## The problem

The serializer entry point already shipped two strategies:

- `structuredCloneSerializer` — zero overhead, default
- `createSerovalSerializer()` — full type fidelity (`Date`, `Map`, `Set`, circular refs)

Plus `createAutoSerializer()`, which routes between them based on a depth-1 type check.

But there was a third common case neither covered well: **uniform arrays of plain objects**. Structured clone copies every key string for every row. seroval does the same, just with extra type metadata. For a 1000-row `User[]`, that is a meaningful chunk of the structured-clone budget — and remember, `postMessage` runs on the main thread.

The package had `'toon'` declared in `SerializerStrategy` and the keyword list since day one. The implementation was missing.

---

## The objective

Ship `createToonSerializer()` as **opt-in directly** and as an **automatic branch of `createAutoSerializer()`** — without breaking any existing behaviour, without bloating non-consumers' bundles, and without false positives that would mangle non-uniform payloads.

---

## API surface

<details>
<summary><strong>Show factory + auto-detection examples</strong></summary>

### Direct usage

```typescript
import { createToonSerializer } from '@angular-helpers/worker-http/serializer';

const serializer = await createToonSerializer();

const payload = serializer.serialize([
  { id: 1, name: 'Alice', role: 'admin' },
  { id: 2, name: 'Bob', role: 'member' },
  { id: 3, name: 'Carol', role: 'member' },
  { id: 4, name: 'Dave', role: 'guest' },
  { id: 5, name: 'Eve', role: 'admin' },
]);

// payload.data is the TOON string:
//   [5]{id,name,role}:
//     1,Alice,admin
//     2,Bob,member
//     3,Carol,member
//     4,Dave,guest
//     5,Eve,admin
```

Round-trips losslessly via `serializer.deserialize(payload)`.

### Auto-detection

```typescript
const auto = await createAutoSerializer();

auto.serialize(users); // 1000 uniform users → format: 'toon'
auto.serialize(user); // single object       → format: 'structured-clone'
auto.serialize(state); // contains a Date     → format: 'seroval'
```

The routing priority (top-down, first match wins):

1. `hasComplexType(data)` → seroval
2. `isUniformObjectArray(data)` (length ≥ 5, primitive values, identical key set) → toon
3. Else → structured-clone

</details>

---

## Decisions and tradeoffs

<details>
<summary><strong>Threshold, depth-1 strictness, peer dep, fidelity</strong></summary>

### Conservative threshold (length ≥ 5)

TOON's encoding overhead — header, length, key declaration, comma escaping — is real. For a 2-element array it can produce a _larger_ string than JSON. We picked **5** as the minimum after looking at typical payload shapes:

- Arrays of 1–4 items are usually one-shot fetches (a single resource and its dependencies)
- Arrays of 5+ are usually lists, search results, or paginated batches
- The transition point where TOON starts winning is in that range

The constant is exported as `MIN_UNIFORM_ARRAY_LENGTH` for consumers who want to override it via custom auto-routing.

### Strict depth-1 detection

The detection helper is intentionally pure and shallow:

- Items must be plain non-null objects (no arrays, no Dates, no Maps)
- Item key sets must be identical
- All values must be primitives (string, number, boolean, null)

This means **no false positives**. If TOON cannot represent the payload tabularly, the auto-serializer leaves it on structured-clone. Consumers with deeply nested data still use seroval directly.

### Optional peer dependency

`@toon-format/toon` is declared as an **optional peer dependency**. The factory uses dynamic import via a variable assignment so neither Vite nor the Angular CLI eagerly resolves it. Bundles for consumers who never call `createToonSerializer()` are unchanged.

If the auto-serializer detects a uniform array but the peer is missing, it silently falls back to structured-clone — no crash, just the previous behaviour.

### Complex types win

When a payload contains both a uniform array and a `Date` at depth-1, **seroval wins**. TOON only encodes the JSON data model; preserving fidelity is a stronger requirement than compactness.

</details>

---

## What is NOT in scope

- **TOON over the wire**: this serializer governs the worker↔main boundary only. The HTTP response is still JSON. TOON is applied after the worker parses the response, before postMessage.
- **Date/Map/Set inside TOON rows**: TOON is JSON-shaped; complex types stay on seroval.
- **Schema validation, type generation, custom delimiters**: out of scope. Use `@toon-format/toon` directly if you need those.
- **Auto-routing for non-uniform arrays or arrays < 5 items**: structured-clone is still the right answer for those.

---

## Verifying the win

<details>
<summary><strong>Reproducible benchmark snippet</strong></summary>

```typescript
const data = Array.from({ length: 50 }, (_, i) => ({
  id: i,
  name: `user-${i}`,
  role: 'member',
  active: true,
}));

const toon = await createToonSerializer();
const payload = toon.serialize(data);

console.log('JSON size:', JSON.stringify(data).length);
console.log('TOON size:', (payload.data as string).length);
// JSON size: 1948
// TOON size: 736
// → ~62% smaller
```

The exact ratio depends on key length, value distribution, and array size. For deeply nested payloads it stays out of TOON's path. For uniform `User[]`-style responses, the schema-once savings dominate.

</details>

---

## Try it

The demo app now ships **two new comparison cards** at `/demo/worker-http`:

1. **Serializer comparison** — pick a sample dataset and watch the auto-serializer pick TOON, seroval, or structured-clone, with output size and encoding time side-by-side.
2. **Worker vs HttpClient** — fire the same request from `HttpClient` (main thread) and `WorkerHttpClient` (worker pool), with a live RAF jank counter showing the main thread staying responsive.

Numbers vary by hardware and payload, but the trend is robust: uniform arrays compress hard, and the worker keeps the main thread free regardless of which serializer is in play.

---

## Upgrade

<details>
<summary><strong>Install commands and explicit opt-in</strong></summary>

```bash
npm install @angular-helpers/worker-http@21.2.0

# Optional, only if you want TOON
npm install @toon-format/toon
```

No code changes required. If you use `createAutoSerializer()`, uniform arrays of 5+ plain-object items will start routing through TOON automatically once the peer dep is installed.

If you prefer to opt in explicitly:

```typescript
provideWorkerHttpClient(
  withWorkerConfigs([{ id: 'api', workerUrl: new URL('./workers/api.worker', import.meta.url) }]),
  withWorkerSerialization(await createToonSerializer()),
);
```

</details>

---

## Related

- [TOON spec](https://toonformat.dev) and [`@toon-format/toon`](https://www.npmjs.com/package/@toon-format/toon) on npm
- Previous post: [worker-http v1.0.0: The Journey from Proof-of-Concept to Production](/blog/worker-http-v1-0)
- Architecture deep-dive: [SDD — Angular HTTP over Web Workers](https://github.com/Gaspar1992/angular-helpers/blob/main/docs/sdd-angular-http-web-workers.md)
