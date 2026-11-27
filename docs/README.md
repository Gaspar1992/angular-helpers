# Angular Helpers — Internal Documentation Index

Welcome to the internal engineering and architecture documentation for the `angular-helpers` monorepo.

## Architecture & Guides

| Document                                                        | Scope                                                                 |
| :-------------------------------------------------------------- | :-------------------------------------------------------------------- |
| [Root README](../README.md)                                     | Monorepo overview, 9-package matrix, quickstart, and scripts.         |
| [CHANGELOG](../CHANGELOG.md)                                    | Workspace release history and modernization highlights.               |
| [SSR & SSG Implementation](ssr-ssg-implementation.md)           | Angular SSR, prerendering, and hydration architecture for `apps/web`. |
| [Worker Deployment Strategies](worker-deployment-strategies.md) | Bundling and deploying Web Workers across Angular CLI and Vite.       |
| [HTTP Web Workers SDD](sdd-angular-http-web-workers.md)         | Software design document for `@angular-helpers/worker-http`.          |
| [GitHub Projects Import](github-projects-import.md)             | Backlog import and issue tracking conventions.                        |

## Subdirectories

- [Design Proposals](design-proposals/) — RFCs and architectural proposals.
- [Research](research/) — Technical spikes and benchmarks.

## Package READMEs

- [`@angular-helpers/core`](../libs/core/README.md)
- [`@angular-helpers/browser-web-apis`](../libs/browser-web-apis/README.md)
- [`@angular-helpers/security`](../libs/security/README.md)
- [`@angular-helpers/storage`](../libs/storage/README.md)
- [`@angular-helpers/worker-http`](../libs/worker-http/README.md)
- [`@angular-helpers/openlayers`](../libs/openlayers/README.md)
- [`@angular-helpers/yjs`](../libs/yjs/README.md)
- [`@angular-helpers/testing`](../libs/testing/README.md)
- [`@angular-helpers/schematics`](../libs/schematics/README.md)
