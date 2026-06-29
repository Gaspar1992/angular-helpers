Created At: 2026-06-29T19:30:52+02:00
Completed At: 2026-06-29T19:30:53+02:00
File Path: `file:///home/gasparrv92/Repositorios/angular-helpers/openspec/changes/ponytail-cleanup/tasks.md`

# Tasks: ponytail-cleanup

## Review Workload Forecast

| Field                   | Value                            |
| ----------------------- | -------------------------------- |
| Estimated changed lines | ~350 lines (primarily deletions) |
| 400-line budget risk    | Low                              |
| Chained PRs recommended | No                               |
| Suggested split         | Single PR                        |
| Delivery strategy       | ask-on-risk                      |
| Chain strategy          | size-exception                   |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal                                              | Likely PR | Notes                                                                                                 |
| ---- | ------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------- |
| 1    | Complete cleanup of unused and experimental items | PR 1      | Includes openlayers/military, browser-web-apis experimental deduplication, and class simplifications. |

## Phase 1: Cleanup openlayers/military

- [x] 1.1 Delete the entire `packages/openlayers/military` directory.
- [x] 1.2 Remove `milsymbol` from root [package.json](file:///home/gasparrv92/Repositorios/angular-helpers/package.json) `devDependencies` and update [pnpm-lock.yaml](file:///home/gasparrv92/Repositorios/angular-helpers/pnpm-lock.yaml).
- [x] 1.3 Remove `milsymbol` from `peerDependencies` and `peerDependenciesMeta` in [packages/openlayers/package.json](file:///home/gasparrv92/Repositorios/angular-helpers/packages/openlayers/package.json).
- [x] 1.4 Remove `"@angular-helpers/openlayers/military"` mapping from [tsconfig.json](file:///home/gasparrv92/Repositorios/angular-helpers/tsconfig.json) and its alias from [vitest.config.ts](file:///home/gasparrv92/Repositorios/angular-helpers/vitest.config.ts).
- [x] 1.5 Remove `withMilitary` import and provider from [src/app/demo/demo.routes.ts](file:///home/gasparrv92/Repositorios/angular-helpers/src/app/demo/demo.routes.ts).

## Phase 2: Deduplicate browser-web-apis experimental

- [x] 2.1 Delete duplicate service files [idle-detector.service.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/experimental/src/idle-detector.service.ts) and [eye-dropper.service.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/experimental/src/eye-dropper.service.ts).
- [x] 2.2 Update [packages/browser-web-apis/experimental/src/index.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/experimental/src/index.ts) to re-export `IdleDetectorService` and `EyeDropperService` from `@angular-helpers/browser-web-apis`.
- [x] 2.3 Export `EyeDropperResult` as `ColorSelectionResult` in [packages/browser-web-apis/experimental/src/index.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/experimental/src/index.ts) for backwards compatibility.
- [x] 2.4 Update imports in [inject-idle-detector.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/experimental/src/inject-idle-detector.ts) and [providers.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/experimental/src/providers.ts) to use `@angular-helpers/browser-web-apis`.

## Phase 3: Simplify classes and interfaces

- [x] 3.1 Delete [packages/security/src/services/regex-builder.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/security/src/services/regex-builder.ts) entirely.
- [x] 3.2 Remove static `builder()` method and associated builder imports from [packages/security/src/services/regex-security.service.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/security/src/services/regex-security.service.ts).
- [x] 3.3 Delete [safe-readonly-map.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/storage/src/utils/safe-readonly-map.ts) and its test file [safe-readonly-map.spec.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/storage/src/utils/safe-readonly-map.spec.ts).
- [x] 3.4 Replace `SafeReadonlyMap` usage with native `Map` in [packages/storage/src/services/entity-store.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/storage/src/services/entity-store.ts) and remove its imports.
- [x] 3.5 Delete [packages/storage/src/interfaces/storage-resource.types.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/storage/src/interfaces/storage-resource.types.ts) and verify no files import from it.

## Phase 4: Verification

- [x] 4.1 Run `pnpm run test` to verify all 800+ Vitest unit tests pass.
- [x] 4.2 Run `pnpm run build:packages` to ensure all packages compile successfully.
- [x] 4.3 Run `pnpm run lint` to verify clean code linting across the repository.
