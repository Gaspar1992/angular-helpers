# Tasks: Monorepo Modernization and Build Centralization

## Review Workload Forecast

| Field                   | Value                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------- |
| Estimated changed lines | ~250 lines                                                                            |
| 400-line budget risk    | Low                                                                                   |
| Chained PRs recommended | No                                                                                    |
| Suggested split         | Centralized dependency cataloging and cross-platform script migration in a single PR. |
| Delivery strategy       | ask-on-risk                                                                           |
| Chain strategy          | size-exception                                                                        |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal                                                                                                  | Likely PR | Notes                                                     |
| ---- | ----------------------------------------------------------------------------------------------------- | --------- | --------------------------------------------------------- |
| 1    | Centralize dependency management and migrate clean/post-build tasks to cross-platform Node.js scripts | PR 1      | Base branch; covers all packages and scripts. (Single PR) |

## Phase 1: Foundation

- [x] 1.1 Add the `catalog:` configuration to `pnpm-workspace.yaml` containing the centralized dependency versions.
- [x] 1.2 Create empty Node.js skeleton scripts: `scripts/clean.js`, `scripts/post-build.js`, and `scripts/sync-versions.js`.

## Phase 2: Implementation of Node.js Utility Scripts

- [x] 2.1 Implement `scripts/clean.js` to recursively delete build and cache folders cross-platform using `fs.rmSync`.
- [x] 2.2 Implement `scripts/post-build.js` to find and delete `.map` files and strip source map reference comments.
- [x] 2.3 Implement `scripts/sync-versions.js` to read package.json version and update the source-level export version.

## Phase 3: Monorepo Integration

- [x] 3.1 Update dependencies to `"catalog:"` in core, browser-web-apis, openlayers, security, storage, testing, and worker-http.
- [x] 3.2 Run `pnpm install` to update the lockfile and verify dependency resolution from the centralized catalog.
- [x] 3.3 Update `clean` and `build` scripts in core, browser-web-apis, openlayers, security, storage, testing, and worker-http.
- [x] 3.4 Hook `scripts/sync-versions.js` into the `browser-web-apis` package build workflow.

## Phase 4: Verification and Tests

- [x] 4.1 Verify version synchronization runs and updates `packages/browser-web-apis/src/public-api.ts`.
- [x] 4.2 Run `pnpm run clean` to check cross-platform recursive directory deletion across all monorepo workspaces.
- [x] 4.3 Run `pnpm run build:packages:prod` and check that `.map` files are deleted and comments stripped from built files.
- [x] 4.4 Run all unit tests to ensure monorepo modernization did not introduce any regressions.
