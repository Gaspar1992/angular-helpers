# ⚡ Angular Helpers

> Production-ready, zoneless-first **Angular 22+** utility suite — signal-driven Browser Web APIs, tree-shakable client security, tiered L1/L2 storage, off-main-thread Web Worker HTTP, OpenLayers, Yjs CRDTs, and testing utilities.

[![CI](https://github.com/Gaspar1992/angular-helpers/actions/workflows/ci.yml/badge.svg)](https://github.com/Gaspar1992/angular-helpers/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-live-blue)](https://gaspar1992.github.io/angular-helpers/docs)
[![Demos](https://img.shields.io/badge/demos-interactive-violet)](https://gaspar1992.github.io/angular-helpers/demo)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## Packages

| Package                                                                | Purpose                                                                                                     | Docs                                                                       | Demo                                                                   |
| :--------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------- | :--------------------------------------------------------------------- |
| [`@angular-helpers/core`](libs/core/README.md)                         | Signal primitives (`debouncedSignal`, `previousSignal`), `injectWorkerPool`, `injectPlatform`               | [Docs](https://gaspar1992.github.io/angular-helpers/docs/core)             | —                                                                      |
| [`@angular-helpers/browser-web-apis`](libs/browser-web-apis/README.md) | Signal-first Browser APIs (`injectFullscreen`, `injectNotifications`, `injectWebShare`, observers, sensors) | [Docs](https://gaspar1992.github.io/angular-helpers/docs/browser-web-apis) | [Demo](https://gaspar1992.github.io/angular-helpers/demo/browser-apis) |
| [`@angular-helpers/security`](libs/security/README.md)                 | Tree-shakable `provideSecurity(with*())`, WebCrypto, ReDoS worker, `injectRateLimiter`, `injectSessionIdle` | [Docs](https://gaspar1992.github.io/angular-helpers/docs/security)         | [Demo](https://gaspar1992.github.io/angular-helpers/demo/security)     |
| [`@angular-helpers/storage`](libs/storage/README.md)                   | Tiered L1/L2 storage, reactive `Signal<string>` keys, `injectStorageResource`, O(1) `EntityStore`           | [Docs](https://gaspar1992.github.io/angular-helpers/docs/storage)          | [Demo](https://gaspar1992.github.io/angular-helpers/demo/storage)      |
| [`@angular-helpers/worker-http`](libs/worker-http/README.md)           | Off-main-thread Angular `HttpClient` & `httpResource` over Web Workers + `ng add` schematic                 | [Docs](https://gaspar1992.github.io/angular-helpers/docs/worker-http)      | [Demo](https://gaspar1992.github.io/angular-helpers/demo/worker-http)  |
| [`@angular-helpers/openlayers`](libs/openlayers/README.md)             | Modular standalone OpenLayers components (`core`, `layers`, `controls`, `interactions`, `overlays`)         | [Docs](https://gaspar1992.github.io/angular-helpers/docs/openlayers)       | [Demo](https://gaspar1992.github.io/angular-helpers/demo/openlayers)   |
| [`@angular-helpers/yjs`](libs/yjs/README.md)                           | Reactive Yjs CRDT signals, multi-doc `YjsDocService`, WebSocket & IndexedDB sync                            | [Docs](https://gaspar1992.github.io/angular-helpers/docs/yjs)              | [Demo](https://gaspar1992.github.io/angular-helpers/demo/yjs)          |
| [`@angular-helpers/testing`](libs/testing/README.md)                   | Zoneless `render()` with typed `ComponentOutputs<T>`, `getByRole`, `getByText`, `rerender()`                | [Docs](https://gaspar1992.github.io/angular-helpers/docs/testing)          | —                                                                      |
| [`@angular-helpers/schematics`](libs/schematics/README.md)             | Angular CLI `ng add` & service generators                                                                   | [Docs](https://gaspar1992.github.io/angular-helpers/docs/schematics)       | —                                                                      |

---

## Quick Start (Angular 22+)

```bash
pnpm add @angular-helpers/browser-web-apis @angular-helpers/security @angular-helpers/storage
```

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideBrowserWebApis } from '@angular-helpers/browser-web-apis';
import { provideSecurity, withWebCrypto, withRateLimiter } from '@angular-helpers/security';
import { provideStorage } from '@angular-helpers/storage';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserWebApis(),
    provideSecurity(withWebCrypto(), withRateLimiter()),
    provideStorage(),
  ],
};
```

---

## Monorepo Structure

```text
angular-helpers/
├── apps/
│   ├── web/            # Documentation, Interactive Demos & Blog (Angular 22 SSR/SSG)
│   └── web-e2e/        # Playwright E2E smoke & visual specs
├── libs/               # 9 modular Angular libraries
├── docs/               # Internal architecture, SDDs & guides (see docs/README.md)
└── scripts/            # Build, lint-packages (publint + attw), llms.txt & release automation
```

---

## Common Workspace Commands

| Command                    | Description                                                        |
| :------------------------- | :----------------------------------------------------------------- |
| `pnpm test:ci`             | Run full Vitest suite across libraries and `apps/web`              |
| `pnpm build:packages:prod` | Build all publishable packages in production mode (`ng-packagr`)   |
| `pnpm lint:packages`       | Validate package exports and TypeScript types (`publint` + `attw`) |
| `pnpm nx build web`        | Build `apps/web` with SSR + 151 prerendered routes                 |
| `pnpm nx serve web`        | Start local docs & demo dev server                                 |
| `pnpm format:check`        | Verify formatting with `oxfmt`                                     |

---

## Internal Documentation & Releases

- 📚 **[Internal Docs Index](docs/README.md)** — SSR/SSG architecture, worker deployment, and SDDs.
- 📝 **[Changelog](CHANGELOG.md)** — Recent `22.x` releases and DX/UX modernization history.
- 🤖 **[`llms.txt`](https://gaspar1992.github.io/angular-helpers/llms.txt)** — LLM-friendly full documentation index.

## License

MIT © [Gaspar](https://github.com/Gaspar1992)
