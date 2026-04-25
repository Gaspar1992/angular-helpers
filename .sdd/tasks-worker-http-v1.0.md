# Tasks: worker-http v1.0 — Closing the Loop

## Phase 1: Infrastructure (entry points & config)

- [ ] 1.1 Add `esbuild-plugin` entry point: `packages/worker-http/esbuild-plugin/` with `ng-package.json`, `index.ts`
- [ ] 1.2 Add `streams-polyfill` entry point: `packages/worker-http/streams-polyfill/` with `ng-package.json`, `index.ts`
- [ ] 1.3 Add `schematics/` directory: `packages/worker-http/schematics/collection.json`, `ng-add/schema.json`, `ng-add/index.ts`
- [ ] 1.4 Add `schematics/` to `package.json` exports and build config
- [ ] 1.5 Install dev deps: `@angular-devkit/schematics`, `@angular-devkit/core`

## Phase 2: Streams Polyfill & Transport (core behavior)

- [ ] 2.1 Create `packages/worker-http/streams-polyfill/src/ponyfill.ts` with `ReadableStream`/`TransformStream` re-exports
- [ ] 2.2 Create `packages/worker-http/streams-polyfill/src/detect.ts` with `needsPolyfill()` Safari detection
- [ ] 2.3 Export `provideWorkerHttp({ safariPolyfill: true })` option in `packages/worker-http/src/config.ts`
- [ ] 2.4 Wire polyfill into transport: lazy-load `streams-polyfill` when `responseType: 'stream'` + Safari detected + opt-in enabled
- [ ] 2.5 Handle polyfill load failure: graceful fallback to non-streaming with `console.warn`

## Phase 3: esbuild Plugin

- [ ] 3.1 Create `packages/worker-http/esbuild-plugin/src/plugin.ts` with `workerHttpPlugin(options?)`
- [ ] 3.2 Implement `autoDiscover: true` — scan `src/**/interceptor*.ts` via `build.onResolve`
- [ ] 3.3 Implement `interceptors?: string[]` — explicit path list
- [ ] 3.4 Inject discovered interceptors into worker bootstrap bundle via `build.onLoad`
- [ ] 3.5 Export from `esbuild-plugin/index.ts`

## Phase 4: ng-add Schematic

- [ ] 4.1 Create `schematics/ng-add/schema.json` with `project`, `workerPath` (default: `src/app/workers/http-api.worker.ts`), `installEsbuildPlugin`
- [ ] 4.2 Implement `addPackageToPackageJson()` — add `@angular-helpers/worker-http` to deps
- [ ] 4.3 Implement `copyWorkerTemplate()` — copy `http-api.worker.ts` template from schematics/assets
- [ ] 4.4 Implement `updateTsConfigPaths()` — add `"@worker-http/_": ["{workerPath}/_"]"
- [ ] 4.5 Implement `addProviderToMain()` — inject `provideWorkerHttp()` into `app.config.ts` or `main.ts`
- [ ] 4.6 Implement `updateAngularJson()` — add esbuild plugin if `installEsbuildPlugin: true`
- [ ] 4.7 Print success message with next steps

## Phase 5: Testing

- [ ] 5.1 `streams-polyfill.spec.ts` — `needsPolyfill()` returns `false` on Chrome, `true` on Safari 17 UA
- [ ] 5.2 `transport-streams.spec.ts` — lazy polyfill load on Safari + opt-in, no-op on other browsers
- [ ] 5.3 `esbuild-plugin.spec.ts` — plugin resolves interceptors, injects into bundle
- [ ] 5.4 `ng-add.spec.ts` — file creation, tsconfig update, provider injection, angular.json update
- [ ] 5.5 Full regression: `npm test` in `packages/worker-http/` — all existing v0.7.0 tests still pass

## Phase 6: Documentation & Blog

- [ ] 6.1 Generate TypeDoc API docs: configure `typedoc.json`, run `npm run docs:generate`
- [ ] 6.2 Create `packages/worker-http/MIGRATION.md` — from raw `fetch()`, from v0.6→v0.7, from v0.7→v1.0
- [ ] 6.3 Create `public/content/blog/worker-http-v1-0.md` — retrospective of 5-phase journey + what's new
- [ ] 6.4 Register blog post in `src/app/blog/config/posts.data.ts`
- [ ] 6.5 Update `packages/worker-http/README.md` and `README.es.md` with ng-add instructions, esbuild plugin, Safari polyfill opt-in

## Phase 7: Release

- [ ] 7.1 Bump `packages/worker-http/package.json` version to `1.0.0`
- [ ] 7.2 Update `CHANGELOG.md` with v1.0.0 section summarizing all deliverables
- [ ] 7.3 Run `npm run lint && npm run format:check`
- [ ] 7.4 Run `npm test` — all green
- [ ] 7.5 Build package: `cd packages/worker-http && npm run build`
