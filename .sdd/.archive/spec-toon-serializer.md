# Spec: TOON Serializer for worker-http

**Linked proposal**: `.sdd/proposal-toon-serializer.md`
**Target package**: `@angular-helpers/worker-http@21.1.0`

---

## Functional Requirements

### FR-1 — `createToonSerializer()` factory

The package **MUST** export an async factory `createToonSerializer()` from `@angular-helpers/worker-http/serializer`.

**Acceptance**:

- Given `@toon-format/toon` is installed as a peer dependency
- When the consumer calls `await createToonSerializer()`
- Then a `WorkerSerializer` instance is returned whose:
  - `serialize(data)` returns `{ data: <string>, transferables: [], format: 'toon' }`
  - `deserialize(payload)` returns the original JSON-equivalent value

**Negative path**:

- Given `@toon-format/toon` is NOT installed
- When `createToonSerializer()` is awaited
- Then it rejects with an Error whose message includes `"@toon-format/toon is required"` and instructs `npm install @toon-format/toon`

**API**:

```typescript
export function createToonSerializer(): Promise<WorkerSerializer>;
```

---

### FR-2 — Lazy / optional peer dependency

The static bundle of `@angular-helpers/worker-http/serializer` **MUST NOT** import `@toon-format/toon` statically.

**Acceptance**:

- Given a consumer who never calls `createToonSerializer()` and whose payloads are not uniform arrays
- When the app bundle is built
- Then `@toon-format/toon` is absent from the bundle (verified by inspecting bundle contents or checking for the package's import path)

**Implementation note**: use the same dynamic-import-via-variable pattern as `seroval-serializer.ts` (assigning the module id to a `const` to defeat static analysis hoisting).

---

### FR-3 — Round-trip fidelity for uniform arrays

The TOON serializer **MUST** preserve all data in the JSON data model.

**Acceptance**:

- Given input `[{a:1, b:'x', c:true}, {a:2, b:'y', c:false}]`
- When `const out = serializer.deserialize(serializer.serialize(input))`
- Then `out` deep-equals the input
- And primitive types are preserved (`number`, `string`, `boolean`, `null`)

**Edge cases**:

- Empty objects in array → fall back: serializer **MAY** still encode but auto-serializer **MUST NOT** route empty-key objects to TOON
- `null` values inside rows → preserved
- Nested objects inside rows → out-of-scope for auto-routing (still works via direct serializer use, but with TOON's nested syntax)

---

### FR-4 — Auto-serializer uniform-array detection

`createAutoSerializer()` **MUST** detect uniform arrays of objects at depth-1 and route them to TOON when no complex types are present.

**Threshold**: minimum array length is **5** (conservative — TOON's overhead is only justified once the schema-once gain offsets the encoding cost; single-digit arrays stay on structured-clone).

**Acceptance**:

- Given `data = [{id:1,name:'A'}, {id:2,name:'B'}, {id:3,name:'C'}, {id:4,name:'D'}, {id:5,name:'E'}]` (uniform array, length ≥ 5, primitives only, no Date/Map/Set/RegExp)
- When `auto.serialize(data)` is called
- Then the returned `SerializedPayload.format === 'toon'`

**Routing priority** (top-down, first match wins):

1. `hasComplexType(data)` → `format: 'seroval'`
2. `isUniformObjectArray(data)` → `format: 'toon'`
3. Else → `format: 'structured-clone'`

**Negative path** — auto-serializer **MUST NOT** route to TOON when:

- Array length < 5
- Items have heterogeneous keys
- Any item contains a non-primitive value (object, array, Date, etc.)
- Input is not an array

---

### FR-5 — Uniform-array detection (depth-1, primitives-only)

The detection helper **MUST** be a pure function with the following contract.

**Acceptance**:

**Threshold constant**: `MIN_UNIFORM_ARRAY_LENGTH = 5` (exported for testing).

| Input                                        | Expected | Reason                                       |
| -------------------------------------------- | -------- | -------------------------------------------- |
| `Array(5).fill({a:1})` (5 identical objects) | true     | Length ≥ 5, primitives, identical keys       |
| `[{a:1},{a:2},{a:3},{a:4},{a:5}]`            | true     | Length 5, single key, primitives             |
| `[{a:1},{a:2},{a:3},{a:4}]`                  | false    | Length 4 < 5                                 |
| 10× `{a:1,b:'x'}` items                      | true     | Multiple keys, primitives                    |
| 5 items with different keys                  | false    | Heterogeneous keys                           |
| 5 items: `[{a:1},{a:'x'},...]`               | true     | TOON allows mixed primitive types per column |
| 5 items with nested array value              | false    | Nested array value                           |
| 5 items with nested object value             | false    | Nested object value                          |
| `[{a:1}]`                                    | false    | Length < 5                                   |
| `[]`                                         | false    | Empty array                                  |
| `[1,2,3,4,5]`                                | false    | Not array of objects                         |
| `null` / `undefined` / `42` / `"x"`          | false    | Not array                                    |
| 5 Dates                                      | false    | Not plain-object items (handled upstream)    |

---

### FR-6 — ArrayBuffer transfer for large TOON payloads

When the TOON-encoded output exceeds `transferThreshold` (default 100 KiB), the auto-serializer **MUST** encode the string to `ArrayBuffer` and include it in `transferables`.

**Acceptance**:

- Given a uniform array whose TOON output is 500 KiB
- When `auto.serialize(data)` is called
- Then the returned `SerializedPayload`:
  - `data` is an `ArrayBuffer`
  - `transferables` contains exactly that `ArrayBuffer`
  - `format` is `'toon'`
- And `deserialize()` decodes the `ArrayBuffer` back to string before parsing

**Note**: This mirrors the existing structured-clone/seroval transfer-threshold path in `auto-serializer.ts`.

---

### FR-7 — Backward compatibility

This change **MUST** be fully additive.

**Acceptance**:

- All existing `auto-serializer.spec.ts` tests pass without modification
- All existing `seroval-serializer.spec.ts` and `structured-clone-serializer.spec.ts` tests pass
- Public types (`WorkerSerializer`, `SerializedPayload`, `SerializerStrategy`, `AutoSerializerConfig`) are unchanged
- The `'toon'` literal in `format` was already declared — no type widening needed

---

### FR-8 — Documentation

**Acceptance**:

- `README.md` and `README.es.md` updated with:
  - New section under "Entry points → /serializer" titled `createToonSerializer()`
  - At least one `serialize` / `deserialize` round-trip example
  - Updated "Serialization strategy decision guide" table to include uniform-array row
- Inline JSDoc on `createToonSerializer()` includes example and link to TOON spec

---

### FR-9 — Blog post

**Acceptance**:

- File at `public/content/blog/worker-http-toon-serializer.md` exists with YAML frontmatter (title, publishedAt, tags including `worker-http` and `toon`, excerpt)
- Post covers: problem, objective, decision-tree, API surface, what's NOT in scope
- Registered in `src/app/blog/config/posts.data.ts` (insertion at top of array)
- AXE accessibility checks pass

---

### FR-10 — Demo cards (worker aspects + HttpClient comparison)

**Acceptance**:

The `worker-http-demo.component.ts` **MUST** be expanded to surface the package's main aspects and to compare them with vanilla Angular `HttpClient`. New/updated cards:

1. **Serializer comparison card** (NEW)
   - Lets the user choose a sample dataset (small object, uniform array of 50 users, mixed payload with `Date`)
   - Runs three serializers side-by-side: `structuredClone`, `seroval`, `toon`
   - Displays output size (bytes), encoding time (ms), and chosen format
   - Highlights the auto-serializer's choice

2. **Worker vs HttpClient comparison card** (NEW)
   - Two buttons: **Fetch with HttpClient** (main thread) and **Fetch with WorkerHttpClient** (worker)
   - Both hit the same endpoint (configurable, e.g. a JSON Placeholder list endpoint)
   - Reports per request: total time, main-thread blocked time (via `PerformanceObserver` long-tasks), and a visible RAF jank indicator (counter that increments while a CPU-burn animation runs in parallel)
   - Demonstrates that the WorkerHttpClient call leaves the main thread responsive

3. **Existing cards** (kept): Worker Transport, HMAC Signing, Content Hashing, AES Encryption

All cards **MUST**:

- Use existing Tailwind/DaisyUI patterns (`bg-base-200`, `border-base-300`, `rounded-xl`, `badge`)
- Pass AXE accessibility checks
- Use signals for state, no Observables in templates without async pipe

---

### FR-11 — Version bump

**Acceptance**:

- `packages/worker-http/package.json` version is `21.1.0`
- `peerDependencies['@toon-format/toon']` declared with appropriate semver range
- `peerDependenciesMeta['@toon-format/toon'].optional` is `true`
- `devDependencies['@toon-format/toon']` declared for local testing

---

## Non-Functional Requirements

### NFR-1 — Test coverage

- New `toon-serializer.spec.ts` coverage ≥ 90% lines
- New cases added to `auto-serializer.spec.ts`:
  - Uniform array routes to TOON
  - Heterogeneous array stays on structured-clone
  - Nested-object array stays on structured-clone
  - Array containing Date stays on seroval (complex-type takes precedence)
  - Large uniform array uses ArrayBuffer transfer

### NFR-2 — Performance

- Uniform-array detection (`isUniformObjectArray`) **MUST** be O(n × k) where n = array length, k = number of keys per object, with early-exit on first mismatch
- Auto-serializer overhead vs. structured-clone path **MUST NOT** exceed 5% for non-array inputs (covered by an existing-path benchmark assertion if available)

### NFR-3 — Bundle size

- Adding TOON support **MUST NOT** increase the static `worker-http/serializer` bundle by more than 1 KB (gzipped)
- The `@toon-format/toon` runtime is lazy-loaded only when the factory or auto-serializer routes to TOON

### NFR-4 — Lint / format

- `npm run format:check` and `npm run lint` pass on all new/modified files

---

## Scenarios

### S-1 — Direct opt-in usage

1. Developer installs `@toon-format/toon`
2. Developer calls `withWorkerSerialization(await createToonSerializer())` in `app.config.ts`
3. All postMessage payloads are encoded as TOON (or fail loudly for unsupported shapes)

### S-2 — Auto-detect uniform array of API users

1. Worker fetches `GET /api/users` returning `User[]` (1000 items, uniform shape)
2. Auto-serializer detects uniform-object-array → encodes as TOON
3. Output > 100 KiB → encoded to ArrayBuffer, transferred zero-copy
4. Main thread deserializes → identical `User[]`

### S-3 — Mixed payload (auto fallback)

1. Response is `{ users: User[], fetchedAt: Date }`
2. Auto-serializer detects `Date` at depth-1 → routes to seroval (complex-type wins)
3. TOON is not used; payload encoded with seroval

### S-4 — Single-item array (auto fallback)

1. Response is `[{id:1,name:'X'}]` (length 1)
2. `isUniformObjectArray` returns false (length < 2 — TOON overhead not justified)
3. Auto-serializer falls through to structured-clone

---

## Acceptance Criteria Summary

| ID    | Description                                                                              | Verification                    |
| ----- | ---------------------------------------------------------------------------------------- | ------------------------------- |
| AC-1  | `createToonSerializer()` exported and round-trips uniform arrays                         | Unit test                       |
| AC-2  | Missing peer dep produces clear error message                                            | Unit test (mock import failure) |
| AC-3  | Auto-serializer routes uniform arrays to TOON                                            | Unit test                       |
| AC-4  | Auto-serializer falls back for non-uniform / nested / single-item / heterogeneous arrays | Unit test                       |
| AC-5  | Complex-type detection wins over uniform-array detection                                 | Unit test                       |
| AC-6  | Large TOON payload → ArrayBuffer transfer                                                | Unit test                       |
| AC-7  | Bundle does not statically include `@toon-format/toon`                                   | Manual / build inspection       |
| AC-8  | Existing serializer tests pass unchanged                                                 | Test suite                      |
| AC-9  | Version bumped to 21.1.0 with optional peer dep declared                                 | grep + manual                   |
| AC-10 | README + blog post + demo card landed                                                    | Manual review                   |

---

## Technical Constraints

- **No Angular imports** in `serializer/` (framework-agnostic, per package architecture)
- **TypeScript strict mode** must pass
- **ESM-only** — match existing serializer module style
- **Dynamic import via variable** for `@toon-format/toon` to keep it optional and avoid Vite/Angular CLI eager resolution

---

## Edge Cases

1. **TOON throws on encoding** (e.g., circular reference) → propagate the error verbatim; auto-serializer MUST NOT swallow
2. **TOON output is the SAME string every call** (referentially) → no caching expected; serializer is stateless after factory init
3. **`Object.keys()` order non-determinism** — JS guarantees insertion order for string keys, so `keys.sort().join(',')` is deterministic
4. **`null` vs. missing key** in objects → counts as a different shape; uniform-array detection requires identical key sets
5. **Numeric edge cases**: `NaN`, `Infinity` — not in JSON model, TOON spec behavior depends on implementation; document and accept whatever `@toon-format/toon` does (likely error or `null`)
6. **String values containing TOON delimiters** (commas, newlines) — handled by the encoder; ensure round-trip test covers this
