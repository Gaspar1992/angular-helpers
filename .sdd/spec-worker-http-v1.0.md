# Spec: worker-http v1.0 — Closing the Loop

**Linked proposal**: `.sdd/proposal-worker-http-v1.0.md`  
**Target package**: `@angular-helpers/worker-http@1.0.0`

---

## Functional Requirements

### FR-1 — ng-add schematic setup

The schematic **MUST** perform the following when invoked via `ng add @angular-helpers/worker-http`:

**Acceptance**:

- Given a fresh Angular workspace (v17+)
- When running `ng add @angular-helpers/worker-http`
- Then:
  1. Package is added to `dependencies`
  2. `http-api.worker.ts` is copied from schematic template to configured worker path
  3. `tsconfig.json` paths updated with `"@worker-http/_": ["{workerPath}/_"]"
  4. `app.config.ts` or `main.ts` receives `provideWorkerHttp()` in providers
  5. Success message printed with next steps

**Schema options**:

```json
{
  "project": { "type": "string", "$default": { "$source": "projectName" } },
  "workerPath": { "type": "string", "default": "src/workers/http-api.worker.ts" },
  "installEsbuildPlugin": { "type": "boolean", "default": false }
}
```

---

### FR-2 — esbuild plugin for worker bundling

The esbuild plugin **MUST** intercept worker file builds and inject interceptor pipeline.

**Acceptance**:

- Given `workerHttpPlugin({ interceptors: ['./src/interceptors/auth.ts'] })` in `angular.json` custom webpack config
- When building the project
- Then the worker bundle includes the auth interceptor in its bootstrap sequence
- And the plugin does not affect non-worker entry points

**API**:

```typescript
export interface WorkerHttpPluginOptions {
  interceptors?: string[];
  autoDiscover?: boolean; // scan src/interceptors/ for *.interceptor.ts
}

export function workerHttpPlugin(options?: WorkerHttpPluginOptions): Plugin;
```

---

### FR-3 — Safari transferable streams polyfill

The polyfill entry point **MUST** provide `ReadableStream`/`TransformStream` ponyfills that support `structuredClone` transfer to workers.

**Acceptance**:

- Given Safari 16/17 (User-Agent detection)
- And `import '@angular-helpers/worker-http/streams-polyfill'` in worker file
- When creating `const stream = new ReadableStream()` and transferring via `postMessage(stream, [stream])`
- Then the stream is successfully received in main thread
- And non-Safari browsers use native implementation (ponyfill re-exports native)

**Detection logic**:

```typescript
const needsPolyfill = () => {
  try {
    const rs = new ReadableStream();
    // Safari < 18 fails this
    return !('getReader' in rs) || !('transfer' in rs);
  } catch {
    return true;
  }
};
```

---

### FR-4 — Auto polyfill injection in transport

The transport module **MUST** detect Safari and auto-inject the polyfill before first stream transfer.

**Acceptance**:

- Given a consumer using `responseType: 'stream'` on Safari 17
- When the response arrives as a stream from worker
- Then the transport dynamically imports the polyfill if not already present
- And streams are usable without consumer explicitly importing polyfill

---

### FR-5 — API documentation generation

TypeDoc **MUST** generate structured API docs for all public entry points.

**Acceptance**:

- Given `npm run docs:generate` in package directory
- When TypeDoc runs
- Then `dist/docs/` contains:
  - Module index for each entry point (`/backend`, `/transport`, `/interceptors`, `/crypto`, `/serializer`)
  - Interface documentation with examples
  - Type aliases and union types explained

---

### FR-6 — Migration guide

`MIGRATION.md` **MUST** document migration paths.

**Acceptance**:

- Sections exist for:
  1. From raw `fetch()` → `WorkerHttpClient`
  2. From `v0.6.x` → `v0.7.0` (hardening changes)
  3. From `v0.7.x` → `v1.0.0` (ng-add, polyfills)
- Each section has before/after code examples
- Breaking changes listed (none expected for v1.0)

---

### FR-7 — v1.0 retrospective blog post

Blog post **MUST** cover the 5-phase journey.

**Acceptance**:

- File at `public/content/blog/worker-http-v1-0.md`
- YAML frontmatter with title, publishedAt, tags, excerpt
- Content sections:
  1. Phase 1 (v0.1): Scaffold and basic request/response
  2. Phase 2 (v0.2): Backend integration
  3. Phase 3 (v0.3-v0.4): Interceptors and interceptable pipeline
  4. Phase 4 (v0.5): SSR + TransferState hydration
  5. Phase 5 (v0.6): Telemetry hooks
  6. Hardening (v0.7): Cancellation, timeout, transferables, crypto fixes
  7. v1.0: What's new (schematics, esbuild, Safari support, docs)
- Registered in `src/app/blog/config/posts.data.ts`
- AXE accessibility checks pass

---

### FR-8 — Version bump

`package.json` **MUST** be updated to `1.0.0`.

**Acceptance**:

- `grep '"version"' packages/worker-http/package.json` returns `"1.0.0"`
- CHANGELOG updated with v1.0.0 section
- Git tag `v1.0.0` and `@angular-helpers/worker-http@1.0.0` created on release

---

## Non-Functional Requirements

### NFR-1 — Schematic test coverage

Schematic **MUST** have unit tests with >80% coverage.

**Acceptance**:

- `npm test` in `packages/worker-http/schematics/` passes
- Tests cover: file creation, tsconfig update, provider injection, error cases

---

### NFR-2 — Bundle size budgets

| Entry Point          | Max Size (minified)         |
| -------------------- | --------------------------- |
| `worker-http` (core) | 15KB                        |
| `esbuild-plugin`     | 5KB (build-time only)       |
| `streams-polyfill`   | 12KB (runtime, Safari only) |

---

### NFR-3 — Compatibility matrix

| Feature            | Chrome | Firefox | Safari | Edge |
| ------------------ | ------ | ------- | ------ | ---- |
| Core transport     | 90+    | 90+     | 16+    | 90+  |
| Stream transfer    | 90+    | 90+     | 18+    | 90+  |
| Stream w/ polyfill | 90+    | 90+     | 16+    | 90+  |

---

## Scenarios

### S-1 — Fresh project setup with ng-add

1. Developer runs `ng new my-app && cd my-app`
2. Runs `ng add @angular-helpers/worker-http`
3. Schematic completes in < 10 seconds
4. Developer runs `ng serve` and worker transport is functional
5. No manual tsconfig or angular.json edits required

### S-2 — Interceptor-heavy project with esbuild plugin

1. Project has 5 custom interceptors in `src/interceptors/`
2. `angular.json` configured with `workerHttpPlugin({ autoDiscover: true })`
3. Build bundles all interceptors into worker automatically
4. Adding a 6th interceptor requires no config change — auto-discovered

### S-3 — Safari stream response

1. Consumer requests `responseType: 'stream'`
2. Safari 17 detected at runtime
3. Transport dynamically imports polyfill
4. Stream successfully received and piped through
5. Developer code unchanged — polyfill transparent

---

## Acceptance Criteria Summary

| ID    | Description                                        | Verification             |
| ----- | -------------------------------------------------- | ------------------------ |
| AC-1  | ng-add schematic completes successfully            | Manual test + unit tests |
| AC-2  | After ng-add, project builds without manual config | CI test                  |
| AC-3  | esbuild plugin bundles interceptors                | Unit test                |
| AC-4  | Safari streams polyfill works on 16/17             | Manual test              |
| AC-5  | Auto polyfill injection on Safari                  | Unit test with UA spoof  |
| AC-6  | API docs generate and render                       | Build + visual check     |
| AC-7  | Migration guide covers all paths                   | Review                   |
| AC-8  | Blog post visible and accessible                   | Playwright + AXE         |
| AC-9  | Version is 1.0.0                                   | grep + tag check         |
| AC-10 | No regressions in v0.7.0 features                  | Full test suite          |

---

## Technical Constraints

- **Angular DevKit**: Schematics must use `@angular-devkit/schematics` API
- **esbuild plugin**: Must work with Angular CLI's esbuild pipeline (v17+)
- **Streams polyfill**: Must be ponyfill (not global pollution), tree-shakeable
- **TypeDoc**: Must generate from existing JSDoc comments (no new annotations needed)

---

## Edge Cases

1. **Schematic on Nx workspace**: Test and document manual steps if automatic fails
2. **Multiple projects in workspace**: Schematic prompts for project selection
3. **Existing worker file**: Prompt to overwrite or skip with warning
4. **Safari 18+**: Polyfill detects native support and no-ops
5. **Polyfill load failure**: Graceful fallback to non-streaming behavior with console warning
