# Proposal: worker-http v1.0 — Closing the Loop

**Branch**: `feat/worker-http-v1.0`  
**Target package**: `@angular-helpers/worker-http`  
**Target version**: `1.0.0`  
**Status**: Draft — awaiting approval

---

## Problem

`@angular-helpers/worker-http` reached functional maturity with v0.7.0 (hardening complete), but lacks the final polish expected of a v1.0 library:

1. **No `ng add` schematic** — Consumers must manually configure providers, workers, and tsconfig paths. The DX friction blocks adoption.
2. **No esbuild plugin** — Interceptor pipelines require manual worker bundling. A dedicated plugin would auto-inject the worker bootstrap.
3. **Safari transferable streams broken** — `ReadableStream` transfer to/from workers fails on Safari 16-17, silently breaking streaming responses.
4. **No API documentation site** — READMEs exist but no structured API docs or migration guide from raw `fetch()`.
5. **No v1.0 retrospective** — The five-phase journey (0.1 scaffold → 0.7 hardening) deserves a closing blog post.

---

## Objective

Ship `@angular-helpers/worker-http@1.0.0` as a **production-complete** package with:

- Zero-config installation via `ng add @angular-helpers/worker-http`
- Optional esbuild plugin for interceptor-heavy projects
- Safari-compat layer for transferable streams
- Full API docs + migration guide
- A v1.0 retrospective blog post

---

## In-Scope

| #   | Deliverable             | Target                                          | Description                                                                 |
| --- | ----------------------- | ----------------------------------------------- | --------------------------------------------------------------------------- |
| 1   | `ng add` schematic      | `@angular-helpers/worker-http@1.0.0`            | Setup providers, copy worker file, update `angular.json`, add tsconfig path |
| 2   | esbuild plugin          | `@angular-helpers/worker-http/esbuild-plugin`   | Auto-bundle worker with interceptor pipeline injected                       |
| 3   | Safari streams polyfill | `@angular-helpers/worker-http/streams-polyfill` | `TransformStream`/`ReadableStream` ponyfill for Safari worker transfer      |
| 4   | API documentation       | `/docs/worker-http/api`                         | TypeDoc-generated + hand-written migration guide                            |
| 5   | v1.0 blog post          | `public/content/blog/worker-http-v1-0.md`       | Retrospective of the 5-phase journey                                        |
| 6   | Migration guide         | `MIGRATION.md`                                  | From raw `fetch()` and from v0.x                                            |

---

## Out-of-Scope (explicit non-goals)

- **HTTP/2 push support** — Protocol-level feature, requires server cooperation. Deferred.
- **WebSocket transport** — Different abstraction, would be separate package.
- **GraphQL-specific helpers** — Generic HTTP is sufficient for v1.0.
- **React/Vue adapters** — Angular-only scope for now.

---

## Capabilities

### New Capabilities

- `ng-add-schematic`: Angular CLI schematic for automated setup
- `esbuild-plugin`: Build-time plugin for worker bundling with interceptors
- `safari-streams-polyfill`: Runtime ponyfill for transferable streams on Safari
- `api-documentation`: TypeDoc config + migration guide
- `v1-retrospective-blog`: Blog post documenting the 5-phase journey

### Modified Capabilities

- `worker-http/transport`: Add detection for Safari and auto-inject polyfill if needed

---

## Approach

### ng-add Schematic

```typescript
// Collection schema
{
  "$schema": "http://json-schema.org/schema",
  "title": "worker-http ng-add",
  "type": "object",
  "properties": {
    "project": { "type": "string", "description": "Project name" },
    "workerPath": {
      "type": "string",
      "default": "./src/workers/http-api.worker.ts",
      "description": "Path for the worker file"
    }
  }
}
```

**Actions**:

1. Add `@angular-helpers/worker-http` to dependencies
2. Copy `http-api.worker.ts` template to `workerPath`
3. Update `angular.json` build options (if needed for esbuild plugin)
4. Add tsconfig path: `"@worker-http/_": ["src/workers/_"]"
5. Add `provideWorkerHttp()` to app providers

### esbuild Plugin

```typescript
// @angular-helpers/worker-http/esbuild-plugin
export function workerHttpPlugin(options: {
  interceptors?: string[]; // paths to interceptor files
}): Plugin {
  return {
    name: 'worker-http',
    setup(build) {
      // Inject interceptor imports into worker bootstrap
      // Bundle as IIFE for inline worker creation
    },
  };
}
```

### Safari Streams Polyfill

Use `web-streams-polyfill` ponyfill only for `ReadableStream`/`TransformStream` when:

- User agent matches Safari < 18
- Transferring to/from Worker
- Detected via `typeof ReadableStream !== 'undefined' && !('transfer' in ReadableStream.prototype)`

Ship as separate entry point so non-Safari users don't pay the bytes.

### API Documentation

- TypeDoc generates from source
- Hand-written `MIGRATION.md` covers:
  - From `fetch()` → `WorkerHttpClient`
  - From v0.6 → v0.7 → v1.0
  - Breaking changes (none, but migration path documented)

---

## Affected Areas

| Area                                     | Impact   | Description                           |
| ---------------------------------------- | -------- | ------------------------------------- |
| `packages/worker-http/schematics/`       | New      | ng-add schematic collection           |
| `packages/worker-http/esbuild-plugin/`   | New      | esbuild plugin entry point            |
| `packages/worker-http/streams-polyfill/` | New      | Safari ponyfill entry point           |
| `packages/worker-http/src/transport/`    | Modified | Safari detection + polyfill injection |
| `public/content/blog/`                   | New      | v1.0 retrospective post               |
| `src/app/docs/`                          | Modified | API docs section for worker-http      |

---

## Risks

| Risk                                              | Severity | Mitigation                                                |
| ------------------------------------------------- | -------- | --------------------------------------------------------- |
| Schematic fails on non-standard workspace layouts | Med      | Test on ng-new, Nx, and standalone project structures     |
| esbuild plugin conflicts with Angular's built-in  | Med      | Plugin only runs on worker files, leaves app bundle alone |
| Safari polyfill adds 10KB+ to bundle              | Low      | Separate entry point — only imported if needed            |
| TypeDoc output is verbose/ugly                    | Low      | Custom theme or post-process with Docusaurus              |

---

## Rollback Plan

- **Schematic failure**: Revert commit, consumers keep manual setup
- **Plugin failure**: Mark plugin as experimental, defer to v1.1
- **Polyfill regression**: Feature-detect more strictly, disable auto-injection

---

## Dependencies

- `@angular-devkit/schematics` — dev dependency for schematic tooling
- `web-streams-polyfill` — optional peer dep for streams ponyfill
- `esbuild` — peer dep for plugin (consumers have it via Angular)
- `typedoc` — dev dependency for API docs generation

---

## Success Criteria

| ID   | Criteria                                                       | Verification                                     |
| ---- | -------------------------------------------------------------- | ------------------------------------------------ |
| SC-1 | `ng add @angular-helpers/worker-http` completes without errors | Manual test on fresh project                     |
| SC-2 | After ng-add, `npm run build` works without manual config      | CI test                                          |
| SC-3 | esbuild plugin bundles worker with interceptors                | Unit test with mock build                        |
| SC-4 | Safari 16/17 can transfer streams to/from worker               | Manual test + Playwright if possible             |
| SC-5 | API docs render at `/docs/worker-http/api`                     | Browser check                                    |
| SC-6 | Blog post visible at `/blog/worker-http-v1-0`                  | Playwright blog test                             |
| SC-7 | Version is `1.0.0`                                             | `grep version packages/worker-http/package.json` |
| SC-8 | No regressions in v0.7.0 functionality                         | Full test suite passes                           |

---

## Open Questions (require user input)

1. **Schematic default worker path**: `src/workers/` or `src/app/workers/`?
2. **Safari polyfill**: Auto-inject or opt-in via `provideWorkerHttp({ safariStreamsPolyfill: true })`?
3. **esbuild plugin**: Separate npm package (`@angular-helpers/worker-http-esbuild`) or same package entry point?
4. **Blog scope**: One v1.0 post covering all 5 phases, or separate "journey" post + "what's new" post?
