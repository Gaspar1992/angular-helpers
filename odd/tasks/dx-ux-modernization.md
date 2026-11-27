# DX, UX, Performance & Markdown/Releases Modernization

Branch: `feat/dx-ux-modernization`
Base `main` commit: `6701d3b14d0e56bfa8c906d50c8314045b9edb77`

## Specs

- **S1 — High-Impact Library DX & Tree-Shaking (`security`, `worker-http`, `openlayers`):**
  - `@angular-helpers/security`: Migrate `provideSecurity` to tree-shakable `with*()` feature functions (keeping deprecated `SecurityConfig` overload for backward compatibility); make `NgZone` optional in `SessionIdleService`; add signal-first `injectSessionIdle()` and `injectRateLimiter()`.
  - `@angular-helpers/worker-http`: Fix `ng-add` fallback template exports and wire default `withWorkerRoutes([{ pattern: /^\/api\//, worker: 'http' }])` so requests route to the worker out of the box.
  - `@angular-helpers/openlayers`: Fix `ROTATE_CONTROL_MAP_SERVICE` in `withControls()` (`useExisting: OlMapService`), turn `withSelectInteraction`/`withDrawInteraction`/`withModifyInteraction`/`withMeasurementInteraction` into real `OlFeature`s accepted by `provideOpenLayers(...)`, and make `Feature<P>` generic.
- **S2 — Angular 22 Ergonomics (`browser-web-apis`, `storage`, `yjs`, `testing`, `core`):**
  - `@angular-helpers/browser-web-apis`: Make `NgZone` optional in `DeviceMotionService`, `DeviceOrientationService`, and `device-orientation.utils.ts`; add signal-first `injectFullscreen()`, `injectNotifications()`, and `injectWebShare()`.
  - `@angular-helpers/storage`: Support reactive key `string | (() => string)` in `injectStorageSignal` and `injectStorageResource`, expose resource signals directly on `injectStorageResource`, and fix `EntityStore.entitySignal(id)` O(1) reactivity for absent IDs.
  - `@angular-helpers/yjs`: Add multi-doc support (`YjsDocService.getDoc(name)` / `destroyDoc(name)` and `provideYjsDoc(name)`).
  - `@angular-helpers/testing`: Unwrap `OutputEmitterRef`/`EventEmitter` in `render()` `outputs`, add accessible queries (`getByText`, `getByRole`, `getByLabelText`) + `rerender()`, and add optional `peerDependenciesMeta` for `@angular/forms` & `@angular/router`.
  - `@angular-helpers/core`: Add `previousSignal()` helper.
- **S3 — `apps/web` Performance, UX & Enhanced Markdown Rendering:**
  - Cut initial bundle well below 700 kB: remove unused `@plugin "@tailwindcss/typography"`, move `.prose-angular` to lazy `blog-post`, defer `<app-search-modal />` (`@defer (when search.isOpen())`) & drop `FormsModule` from it, enable `withIncrementalHydration()` + `@defer (hydrate on viewport)` on home sections, fix `openlayers-demo` CSS budget.
  - Upgrade docs UX: render `demoLink` in Home/Overview/Detail, fix `DemoLayoutComponent` double sticky header & hide internal QA Harness from public nav, add ranked search, package manager switcher (`pnpm`/`npm`/`yarn`/`bun`), "On this page" TOC, Prev/Next pagination, "Edit on GitHub", visible `llms.txt` & Copy-as-Markdown, fix stale `"Eight packages"` / `"Angular 20+"` / `⌘K` copy & `100dvh - 56px` height.
  - Upgrade blog `.md` rendering: strip duplicate leading H1, support `date:`/`description:` and multiline YAML `tags:` lists, add GFM callouts (`[!NOTE]`/`[!TIP]`/`[!WARNING]`/`[!IMPORTANT]`/`[!CAUTION]`), heading anchor links, reading time, TOC, and responsive tables.
- **S4 — Internal Markdown Docs & Structured GitHub Releases:**
  - Fix all 6 broken quickstarts and unify all 9 `libs/*/README.md` with `cognitive-doc-design` structure.
  - Modernize root `README.md`, add `docs/README.md` index, update `CHANGELOG.md`.
  - Add `.github/release.yml`, `.github/PULL_REQUEST_TEMPLATE.md`, and upgrade `scripts/publish-packages.mjs` to generate per-package GitHub Releases comparing against the previous tag of the same package with install snippets, links, and filtered commits.
- **S5 — Full Verification & Independent Verifier Gate:**
  - Pass `format:check`, `lint`, `build:packages:prod`, `lint:packages`, `nx build web` (0 budget warnings), `test:ci`, `knip`, `verify-docs-consistency.ts`, `nx e2e web-e2e -c smoke`, and an independent read-only verifier.

## Tasks

| ID  | Task                                                                                    | Specs | Route             | Risk                                         | Commit                          | Status |
| --- | --------------------------------------------------------------------------------------- | ----- | ----------------- | -------------------------------------------- | ------------------------------- | ------ |
| T1  | High-impact DX (`security`, `worker-http`, `openlayers`) + tests                        | S1    | inline            | item 3 (public provider/feature APIs)        | `49695f1`                       | done   |
| T2  | Angular 22 Ergonomics (`browser-web-apis`, `storage`, `yjs`, `testing`, `core`) + tests | S2    | inline            | item 3 (public signal/testing APIs)          | `5ed10b3`                       | done   |
| T3  | `apps/web` Performance, Docs UX & Blog Markdown rendering + tests                       | S3    | inline            | item 2, 3 (blog sanitizer/MD, SSR hydration) | `e859474`, `6d1f612`, `aa8a653` | done   |
| T4  | Internal Markdown (`README`s, `docs/`, `CHANGELOG`) & GitHub Releases                   | S4    | inline            | item 5 (release script)                      | `ca4950a`                       | done   |
| T5  | Full Verification Gate & Independent Verifier                                           | S5    | inline + verifier | —                                            | `aa8a653`                       | done   |

## Log

- **L1 (2026-11-27):** User request verbatim: `"Vayamos a lo siguiente quiero que revises todo de nuevos pero el objetivo es distinto debemos optimizar, actualizar y modernizar tanto la pagina de documentación como revisar las libs y ver si se adaptan a los que los usuarios a nivel de experiencia pueden querer"` + `"Tambien revisar el formato de como se visualizan tambien los md internos y las publicaciones en github para que sean más faciles de entender."` + `"Haz todas las mejoras en orden de prioridad, debemos hacer grandes cambios para adaptarnos y ser más funcionales"`.
- **L2 (2026-11-27):** Completed T1–T5 on `feat/dx-ux-modernization`. Full gate passed: `oxfmt --check`, `nx lint web`, `build:packages:prod`, `lint:packages` (`publint` + `attw` for all 8 publishable packages), `nx build web` (0 budget warnings, 151 prerendered routes), `test:ci`, `knip`, `verify-docs-consistency.ts`, and `nx e2e web-e2e -c smoke` (7/7 passed including Axe Core WCAG AA). Independent read-only verifier (`897ec6dd`) returned PASS on `S1`–`S5` after fixing two stale copy items (`Nine packages.`, `Angular 22+`) and the WCAG 2.5.3 `Copy MD` accessible name.
