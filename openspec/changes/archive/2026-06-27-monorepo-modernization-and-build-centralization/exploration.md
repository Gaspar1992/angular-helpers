## Exploration: Modernize monorepo by centralizing build post-processing, configuring pnpm Catalogs, and resolving runtime version constants skew

### Current State

Currently, the monorepo has several points of configuration drift and platform-dependent scripts:

1. **Dependency Skew**: External dependencies (like `@angular/*`, `rxjs`, `vitest`, `jsdom`, etc.) are declared with varying versions across the root `package.json` and individual package `package.json` files. There is no central configuration of these shared versions.
2. **Build Post-Processing**: The production build scripts (`build:prod`) in all packages (`packages/*/package.json`) use duplicate shell-specific commands (`find` and `sed`) to delete source maps and strip `sourceMappingURL` comments from built files. These commands are OS-dependent and error-prone on non-Unix environments (e.g. Windows).
3. **Clean Commands**: The cleanup scripts (`clean`) are partially defined in some packages and root-level script runs a hardcoded `rm -rf packages/*/dist` which is not cross-platform and does not clean auxiliary folders (like `.angular`, `.vitest`, `coverage`, `out-tsc`).
4. **Runtime Version Skew**: The runtime version constant exported in `packages/browser-web-apis/src/public-api.ts` is hardcoded to `'0.1.0'`, which differs from its `package.json` version (`22.0.0`). There is no automated sync mechanism.

### Affected Areas

- [pnpm-workspace.yaml](file:///home/gasparrv92/Repositorios/angular-helpers/pnpm-workspace.yaml) — Needs `catalog` configuration to declare centralized dependency versions.
- [package.json](file:///home/gasparrv92/Repositorios/angular-helpers/package.json) — Needs updates to delegate dependency versions to `catalog:`.
- [packages/core/package.json](file:///home/gasparrv92/Repositorios/angular-helpers/packages/core/package.json) — Needs `peerDependencies` updated to `catalog:` and `build:prod` post-processing centralized.
- [packages/browser-web-apis/package.json](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/package.json) — Needs dependencies updated to `catalog:` and `build:prod` post-processing centralized.
- [packages/browser-web-apis/src/public-api.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/src/public-api.ts) — Needs runtime version constant updated and synced.
- [packages/openlayers/package.json](file:///home/gasparrv92/Repositorios/angular-helpers/packages/openlayers/package.json) — Needs dependencies updated to `catalog:` and `build:prod` post-processing centralized.
- [packages/security/package.json](file:///home/gasparrv92/Repositorios/angular-helpers/packages/security/package.json) — Needs dependencies updated to `catalog:` and `build:prod` post-processing centralized.
- [packages/storage/package.json](file:///home/gasparrv92/Repositorios/angular-helpers/packages/storage/package.json) — Needs dependencies updated to `catalog:` and `build:prod` post-processing centralized.
- [packages/testing/package.json](file:///home/gasparrv92/Repositorios/angular-helpers/packages/testing/package.json) — Needs dependencies updated to `catalog:` and `build:prod` post-processing centralized.
- [packages/worker-http/package.json](file:///home/gasparrv92/Repositorios/angular-helpers/packages/worker-http/package.json) — Needs dependencies updated to `catalog:` and `build:prod` post-processing centralized.
- `scripts/clean.js` — New script to clean build artifacts cross-platform.
- `scripts/post-build.js` — New script to centralize build post-processing (deleting maps/stripping source comments) cross-platform.
- `scripts/sync-versions.js` — New script to automatically sync package version numbers into source code constants.

### Approaches

1. **Fully Centralized Automation (Modern PNPM Catalogs + Unified Build/Clean/Sync Node Scripts)** — Implement a default `catalog` block in `pnpm-workspace.yaml`, update all packages to reference `catalog:`, and implement Node-based scripts for `clean`, `post-build`, and `sync-versions` to unify monorepo operations.
   - Pros:
     - Single source of truth for dependency versions.
     - Fully cross-platform build/clean commands (works on Windows, macOS, Linux).
     - Resolves version constant skew permanently by automating sync before/after builds or commits.
     - Simplifies packages' package.json configurations significantly.
   - Cons:
     - Requires modifying multiple package files to adapt `catalog:` protocol.
   - Effort: Medium

2. **Partial Monorepo Modernization (PNPM Catalogs + Centralized Scripts without Version Sync)** — Implement pnpm Catalogs and Node-based clean/post-build scripts, but leave the runtime version constant updates as a manual developer task.
   - Pros:
     - Fewer lines of custom script code to maintain.
   - Cons:
     - High risk of runtime version constants drift / skew recurring in the future.
   - Effort: Low

### Recommendation

We recommend **Approach 1**. Centralizing all build processes, introducing pnpm Catalogs, and automating version constant sync will establish a highly maintainable, platform-independent monorepo architecture. The version constant synchronization script can automatically read the local package.json files and update the code files before packaging.

### Risks

- **PNPM Catalog syntax compat**: Older lockfiles might need recreation, though pnpm v11 fully supports catalogs natively.
- **Source Map stripping regex precision**: The post-build stripping regex must be accurate to ensure it doesn't corrupt source code or bundle structures. We will use a safe and strict match for standard `//# sourceMappingURL=` patterns.
- **CI/CD Integration**: We must ensure that the version synchronization and clean scripts are fully run during normal local and CI builds.

### Ready for Proposal

Yes — The orchestrator should proceed to define the proposal phase.
