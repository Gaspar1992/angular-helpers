# Architectural Hardening Super PR

Branch: `refactor/architectural-hardening`
Base `main` commit: `a6e188027c2c1b2be4072069d1eacb44683a977e`

## Specs

- **S1 — Workspace, Dependencies, CI/CD & Release Hardening:**
  User request: `"Quiero que lo ataques todo en una Super PR, genera tambien todos los test que necesites y adelante"`.
  Scope: Add root `LICENSE` and copy into all published `dist/*` packages; declare all missing runtime/peer dependencies across `libs/*/package.json`; remove `shamefullyHoist: true`; bump `@types/node` to `^24`, align Angular `22.2.5`, remove unused `@angular/animations` and `@angular/platform-browser-dynamic` and unused devDeps; fix ESLint execution across all `libs/*` in CI + enable `templateAccessibility`; fix `tsconfig.json`/`tsconfig.build.json`, `vitest.config.ts`, `nx.json`, `knip.json`; harden `scripts/post-build.js`, `scripts/publish-packages.mjs`, `scripts/clean.js`, `scripts/task-runner.js`, `scripts/inline-workers.js`, and `.github/workflows/{ci,release,deploy}.yml` + `.github/actions/setup/action.yml`.
- **S2 — `@angular-helpers/core` & `@angular-helpers/browser-web-apis` Hardening + Tests:**
  Fix `hexToBytes` validation & `bytesToBase64`, `WorkerPool` URL/Blob/postMessage/leak/domain-leakage bugs, `debouncedSignal`/`throttledSignal` SSR & `NaN` handling, `core/README.md`; eliminate `browser-web-apis` `src/` vs `experimental/src/` duplication; fix SSR crashes in `FullscreenService` and `ScreenWakeLockService`; fix `WebSocketClient.close()`, `WebStorageService` event bus, `injectWebTransportResource`, and `CopyButtonDirective`/`VoiceInputDirective` (English defaults, `untracked`, shared `LiveAnnouncer`); add unit tests.
- **S3 — `@angular-helpers/storage` & `@angular-helpers/security` Hardening + Tests:**
  Harden `storage` crypto (`PBKDF2_ITERATIONS = 600_000`, no plaintext password in `keyCache`, fail-fast without passphrase), propagate `write()`/`delete()` errors so `storageResource` rollback works, fix `storageResource` param resets/error/crossTabSync, `injectStorageSignal` generation counter, `EntityStore.deleteOne`, `DestroyRef` in transports; harden `security` (`InputSanitizerService.getTrustedHtml`, strip `<script>`/`<style>` subtrees, `JwtService.decode` plain-object guard, `WebCryptoService` `providedIn: 'root'` + SSR guard, `SessionIdleService`/`RateLimiterService` SSR guards, `SecureStorageService` concurrent `ensureKey()` + `clear()` salt preservation, `SecureMessageService` `DestroyRef`, `WebAuthnService` null key guard, `SensitiveClipboardService` teardown, stop exporting `internal/validators-core`, add `provideCsp()`); add regression tests.
- **S4 — `@angular-helpers/worker-http`, `@angular-helpers/yjs`, `@angular-helpers/openlayers`, `@angular-helpers/testing`, `@angular-helpers/schematics` Hardening + Tests:**
  Package `worker-http` `schematics/` into `dist/` and fix `ng-add`, fix `terminate()`/`O(1)` demux/double serialization/`offline-sync-queue` lock/`close()` Subject completion; split `yjs` optional peers into `/websocket`, `/indexeddb`, `/awareness` entrypoints, fix `isSignal(yjsSignal(...))`, `observeDeep`, `YjsTextDirective` delta cursor + IME, SSR guard on `injectYjsWebsocket`; make `OlMapService` component-scoped (multi-map), fix `EPSG:4326` threshold, `unByKey`/`rAF`/Subject cleanup, `OnPush`, `GeolocationControlComponent`, `TileLayerComponent`, `OlControlService`, `DOCUMENT` injection; fix `testing` `render()` signal input types & `EnvironmentProviders`, `provideMockService` descriptors, `MockActivatedRoute.paramMap`, `mockCanvas2D` restore, `mockIndexedDB` `onsuccess`; clean `schematics` broken templates and prefix collision; add tests.
- **S5 — `apps/web` & `apps/web-e2e` Hardening + Docs Completeness + Tests:**
  Fix `Permissions-Policy` in `server.ts`, prerender `/blog` & `blog/:slug`, move `demo/**` to `RenderMode.Client`, replace regex `sanitizeBlogHtml` with safe sanitization and `highlight.js/lib/core`, unify canonical domain + expand `sitemap.xml`, add `OnPush` across `apps/web`, move `ol.css` & `demo.routes.ts` eager providers out of global/root chunks, debounce search, fix `CodeBlockComponent`/`DocsLayoutComponent`/`DocsVersionService`/`UnifiedOverviewComponent`/`UnifiedServiceDetailComponent`; document `@angular-helpers/schematics` and 6 missing `browser-web-apis` services, fix stale counts/snippets; fix WCAG AA contrast/landmarks/skip-link/inert/tabs/search-modal focus; fix `playwright.config.ts` and expand unit & E2E tests.
- **S6 — Final Full Verification & Independent Verifier Gate:**
  Run `pnpm format:check`, `pnpm lint`, `pnpm build:packages:prod`, `pnpm lint:packages`, `pnpm nx build web`, `pnpm test:ci`, `pnpm exec knip`, `pnpm exec tsx scripts/verify-docs-consistency.ts`, and pass an independent read-only verifier subagent.

## Tasks

| ID  | Task                                                                                                        | Specs | Route             | Risk                                   | Commit | Status  |
| --- | ----------------------------------------------------------------------------------------------------------- | ----- | ----------------- | -------------------------------------- | ------ | ------- |
| T1  | Workspace, Dependencies, CI/CD, Release & Tooling Hardening                                                 | S1    | inline            | item 5 (delivery/environment)          | —      | pending |
| T2  | `@angular-helpers/core` & `@angular-helpers/browser-web-apis` Hardening + Tests                             | S2    | inline            | item 3 (shared public contracts)       | —      | pending |
| T3  | `@angular-helpers/storage` & `@angular-helpers/security` Hardening + Tests                                  | S3    | inline            | item 2 (security/crypto)               | —      | pending |
| T4a | `@angular-helpers/worker-http` & `@angular-helpers/yjs` Hardening + Tests                                   | S4    | inline            | item 3, 4 (entrypoints, concurrency)   | —      | pending |
| T4b | `@angular-helpers/openlayers`, `@angular-helpers/testing` & `@angular-helpers/schematics` Hardening + Tests | S4    | inline            | item 3 (public component/testing APIs) | —      | pending |
| T5  | `apps/web` & `apps/web-e2e` Hardening, Docs Completeness & Tests                                            | S5    | inline            | item 2, 3 (XSS sanitizer, SSR, docs)   | —      | pending |
| T6  | Final Full Verification & Independent Verifier Gate                                                         | S6    | inline + verifier | —                                      | —      | pending |

## Log

- **L1 (2026-11-26):** User request verbatim: `"Quiero que lo ataques todo en una Super PR, genera tambien todos los test que necesites y adelante"`.
