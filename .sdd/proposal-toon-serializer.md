# Proposal: TOON Serializer for worker-http

**Branch**: `feat/worker-http-toon-serializer`
**Target package**: `@angular-helpers/worker-http`
**Target version**: `21.1.0` (minor — new feature, no breaking changes)
**Status**: Draft — awaiting approval

---

## Problem

`@angular-helpers/worker-http/serializer` already declares `'toon'` as a valid `format` in `SerializedPayload` and `SerializerStrategy`, and the package keyword list includes `"toon"`, but **no actual TOON serializer exists**. The promise made in the README ("pluggable serialization") is incomplete:

- `structuredCloneSerializer` (default) — ✅ shipping
- `createSerovalSerializer()` — ✅ shipping
- `createAutoSerializer()` — ✅ shipping (only switches between structured-clone and seroval)
- **`toonSerializer` — ❌ missing**

API responses with **uniform arrays of objects** (`User[]`, `Product[]`, paginated lists) are the most common payload shape in worker-http traffic. JSON repeats every key per object, costing bandwidth and serialization time. TOON declares the schema once and emits CSV-like rows, achieving **30-60% size reduction** for these payloads with negligible parsing overhead.

---

## Objective

Ship `toonSerializer` as a first-class, opt-in serializer in `@angular-helpers/worker-http/serializer`, plus integrate it into `createAutoSerializer()` so uniform arrays of objects are auto-detected and routed through TOON without consumer configuration.

---

## In-Scope

| # | Deliverable | Description |
|---|-------------|-------------|
| 1 | `createToonSerializer()` factory | Async factory (lazy-loads `@toon-format/toon`); returns `WorkerSerializer` with `format: 'toon'` |
| 2 | Uniform-array detection helper | Pure function: detects array of plain objects with identical primitive-valued keys |
| 3 | `createAutoSerializer()` extension | Adds depth-1 uniform-array detection → routes to TOON when applicable |
| 4 | TOON deserialization in auto-serializer | `deserialize()` resolves `format: 'toon'` payloads |
| 5 | ArrayBuffer transfer for large TOON | When TOON output exceeds `transferThreshold`, encode to `ArrayBuffer` and add to transfer list |
| 6 | Unit tests | `toon-serializer.spec.ts` + extended `auto-serializer.spec.ts` coverage |
| 7 | Documentation updates | README.md / README.es.md sections on TOON; decision-guide table updated |
| 8 | Blog post | `public/content/blog/worker-http-toon-serializer.md` + `posts.data.ts` entry |
| 9 | Demo cards | Serializer comparison card + Worker vs HttpClient comparison card in `worker-http-demo.component.ts` |
| 10 | Version bump | `21.0.0` → `21.1.0` |

---

## Out-of-Scope

- **TOON for non-uniform arrays** — TOON's spec supports nested/mixed structures, but the value proposition collapses; auto-serializer keeps these on structured-clone/seroval.
- **TOON over the wire (HTTP body)** — This serializer governs the **worker↔main boundary only**, not the network layer. The fetch response is JSON; TOON is applied after deserialization, before postMessage.
- **Date/Map/Set in TOON payloads** — TOON only encodes the JSON data model. Complex types stay on seroval.
- **Custom TOON delimiters / extensions** — Use library defaults.
- **Schema validation / type generation** — TOON is a transport format, not a contract.

---

## Capabilities

### New Capabilities
- `worker-http-toon-serializer`: TOON-format serializer entry in `@angular-helpers/worker-http/serializer`

### Modified Capabilities
- `worker-http-auto-serializer`: extend depth-1 detection to recognize uniform arrays and route them to TOON

---

## Approach

### `createToonSerializer()` factory

Mirrors the seroval factory pattern (lazy dynamic import via variable so the peer dep stays optional):

```typescript
export async function createToonSerializer(): Promise<WorkerSerializer> {
  const { encode, decode } = await loadToon();
  return {
    serialize(data) {
      const str = encode(data);
      return { data: str, transferables: [], format: 'toon' };
    },
    deserialize(payload) {
      return decode(payload.data as string);
    },
  };
}
```

### Uniform-array detection (depth-1)

```typescript
const MIN_UNIFORM_ARRAY_LENGTH = 5; // conservative threshold
function isUniformObjectArray(value: unknown): boolean {
  if (!Array.isArray(value) || value.length < MIN_UNIFORM_ARRAY_LENGTH) return false;
  const first = value[0];
  if (first === null || typeof first !== 'object' || Array.isArray(first)) return false;
  const keys = Object.keys(first).sort().join(',');
  return value.every((item) =>
    item !== null &&
    typeof item === 'object' &&
    !Array.isArray(item) &&
    Object.keys(item).sort().join(',') === keys &&
    Object.values(item).every((v) => v === null || ['string', 'number', 'boolean'].includes(typeof v))
  );
}
```

### Auto-serializer routing priority

1. `hasComplexType(data)` → seroval (already exists)
2. **NEW**: top-level value or `data.{key}` is `isUniformObjectArray()` → toon
3. Else → structured-clone
4. If output > `transferThreshold` → encode to ArrayBuffer + add to transfer list

### Peer dependency

- Add `@toon-format/toon` to `peerDependencies` with `peerDependenciesMeta.optional = true`
- Add to `devDependencies` for local testing

---

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `packages/worker-http/serializer/src/toon-serializer.ts` | New | Factory + lazy loader |
| `packages/worker-http/serializer/src/toon-serializer.spec.ts` | New | Unit tests |
| `packages/worker-http/serializer/src/auto-serializer.ts` | Modified | Add uniform-array detection branch |
| `packages/worker-http/serializer/src/auto-serializer.spec.ts` | Modified | TOON routing assertions |
| `packages/worker-http/serializer/src/index.ts` | Modified | Re-export `createToonSerializer` |
| `packages/worker-http/package.json` | Modified | Add optional peer dep, bump to 21.1.0 |
| `packages/worker-http/README.md` / `README.es.md` | Modified | TOON section + decision guide |
| `public/content/blog/worker-http-toon-serializer.md` | New | Blog post |
| `src/app/blog/config/posts.data.ts` | Modified | Register post |
| `src/app/demo/worker-http/worker-http-demo.component.ts` | Modified | Add TOON demo card |

---

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `@toon-format/toon` API changes (spec is v3 draft) | Med | Pin to a specific minor; abstract behind our factory; integration test with the pinned version |
| Auto-serializer mis-detects uniform arrays | Med | Strict depth-1 check (primitives only, identical key set, length ≥ 2); extensive spec coverage |
| Bundle bloat for non-TOON consumers | Low | TOON is dynamic-imported only when factory is called or auto detects a uniform array |
| Performance regression on small arrays | Low | Skip TOON for arrays of length < 2; consumers control via threshold |
| Decoded TOON loses fidelity (numeric precision, etc.) | Low | TOON encodes the JSON data model; same fidelity as `JSON.parse(JSON.stringify(x))` |

---

## Rollback Plan

1. Revert `auto-serializer.ts` to the previous structured-clone/seroval-only branching.
2. Remove `toon-serializer.ts` and its export from `index.ts`.
3. Drop `@toon-format/toon` from peer deps.
4. Bump back to `21.0.x` patch on next release.

The change is fully additive — no existing API is modified, so rollback is a straight delete.

---

## Dependencies

- `@toon-format/toon` (optional peer, lazy-loaded)
- `@toon-format/toon` in devDependencies for tests

---

## Success Criteria

- [ ] `createToonSerializer()` exported from `@angular-helpers/worker-http/serializer`
- [ ] Round-trip serialize → deserialize preserves uniform-array data
- [ ] `createAutoSerializer()` routes uniform arrays of length ≥ 5 to TOON when no complex types are present
- [ ] Bundle size for non-TOON consumers unchanged (verified by build inspection)
- [ ] All existing serializer tests still pass
- [ ] New tests cover: factory load failure, non-uniform array fallback, mixed-key array fallback, ArrayBuffer transfer threshold
- [ ] README + blog post + demo card landed in same PR
- [ ] Version bumped to `21.1.0`
- [ ] Demo card: comparación de serializers (size + time) + comparación Worker vs HttpClient (jank visible)
