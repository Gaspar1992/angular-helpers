# Design: Monorepo Modernization and Build Centralization

## Technical Approach

Modernize monorepo tooling by centralizing shared dependency versions under a pnpm Catalog and replacing duplicate, shell-dependent post-build and cleanup scripts with cross-platform Node.js utility scripts. Version drift of source-level constants is resolved by programmatically syncing package version changes into source code files.

## Architecture Decisions

| Option                                   | Tradeoff                                                                                                                              | Decision                                                                                                              |
| :--------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------- |
| **Node.js Scripts for Clean/Post-Build** | Zero dependencies, highly performant, fully cross-platform. Requires maintaining small utilities.                                     | **Chosen**. Avoids bringing third-party libraries (e.g., `rimraf`, `shx`) and eliminates OS-specific script failures. |
| **Default Catalog (`catalog:`)**         | Unifies core external package versions. Does not support version overrides for specific workspaces except when bypassing the catalog. | **Chosen**. Simplifies the configurations of all 7 packages and root `package.json` under `pnpm-workspace.yaml`.      |
| **Pre-Build Version Syncing Hook**       | Ensures code constants match package definitions. Adds a minor execution step prior to compiling.                                     | **Chosen**. Hooked into the package's build process to automate synchronization, avoiding stale constants.            |

### Decision: Custom Clean and Post-Build Utilities

**Choice**: Implement [scripts/clean.js](file:///home/gasparrv92/Repositorios/angular-helpers/scripts/clean.js) and [scripts/post-build.js](file:///home/gasparrv92/Repositorios/angular-helpers/scripts/post-build.js) as lightweight ESM modules.

- **clean.js**: Uses `fs.rmSync(path, { recursive: true, force: true })` on target directories (`.angular`, `dist`, `out-tsc`, `coverage`, `.vitest`).
- **post-build.js**: Traverses built outputs recursively, deletes `.map` files, and removes matching source map reference comments (regex `/\/\/#\s*sourceMappingURL=.*/g` and CSS equivalents) in-place.

### Decision: Automation Hook for Version Syncing

**Choice**: Run [scripts/sync-versions.js](file:///home/gasparrv92/Repositorios/angular-helpers/scripts/sync-versions.js) prior to building `browser-web-apis`.
**Rationale**: By reading the package's version from `package.json` and replacing `export const version = '...';` using a regex replacement in `src/public-api.ts`, it prevents outdated version exports.

## Script Flow

```
[pnpm run build]
   └──> [scripts/sync-versions.js] ──> Updates src/public-api.ts version
   └──> [ng-packagr] ────────────────> Generates build artifacts
   └──> [scripts/post-build.js] ─────> Deletes .map files & strips sourceMappingURL
```

## File Changes

| File                                                                                                                                            | Action | Description                                                                                                  |
| :---------------------------------------------------------------------------------------------------------------------------------------------- | :----- | :----------------------------------------------------------------------------------------------------------- |
| [pnpm-workspace.yaml](file:///home/gasparrv92/Repositorios/angular-helpers/pnpm-workspace.yaml)                                                 | Modify | Define the central catalog block.                                                                            |
| [package.json](file:///home/gasparrv92/Repositorios/angular-helpers/package.json)                                                               | Modify | Reference catalog version for dependencies; use centralized clean script.                                    |
| [packages/browser-web-apis/package.json](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/package.json)           | Modify | Reference catalog, update build/clean scripts to call Node.js utilities, add version sync to prebuild/build. |
| [packages/browser-web-apis/src/public-api.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/src/public-api.ts) | Modify | Runtime version constant target for sync.                                                                    |
| [packages/core/package.json](file:///home/gasparrv92/Repositorios/angular-helpers/packages/core/package.json)                                   | Modify | Reference catalog and update build/clean scripts.                                                            |
| [packages/openlayers/package.json](file:///home/gasparrv92/Repositorios/angular-helpers/packages/openlayers/package.json)                       | Modify | Reference catalog and update build/clean scripts.                                                            |
| [packages/security/package.json](file:///home/gasparrv92/Repositorios/angular-helpers/packages/security/package.json)                           | Modify | Reference catalog and update build/clean/prebuild scripts.                                                   |
| [packages/storage/package.json](file:///home/gasparrv92/Repositorios/angular-helpers/packages/storage/package.json)                             | Modify | Reference catalog and update build/clean scripts.                                                            |
| [packages/testing/package.json](file:///home/gasparrv92/Repositorios/angular-helpers/packages/testing/package.json)                             | Modify | Reference catalog and update build/clean scripts.                                                            |
| [packages/worker-http/package.json](file:///home/gasparrv92/Repositorios/angular-helpers/packages/worker-http/package.json)                     | Modify | Reference catalog and update build/clean scripts.                                                            |
| [scripts/clean.js](file:///home/gasparrv92/Repositorios/angular-helpers/scripts/clean.js)                                                       | Create | Implement cross-platform cleanup logic.                                                                      |
| [scripts/post-build.js](file:///home/gasparrv92/Repositorios/angular-helpers/scripts/post-build.js)                                             | Create | Implement cross-platform `.map` deletion and comment stripping.                                              |
| [scripts/sync-versions.js](file:///home/gasparrv92/Repositorios/angular-helpers/scripts/sync-versions.js)                                       | Create | Implement dynamic version sync for codebase constants.                                                       |

## Interfaces / Contracts

```typescript
// scripts/clean.js interface
// Usage: node scripts/clean.js [optional_target_paths...]
// If no arguments provided, defaults to standard build and cache directories.

// scripts/post-build.js interface
// Usage: node scripts/post-build.js <target_directory>

// scripts/sync-versions.js interface
// Usage: node scripts/sync-versions.js <package_directory> <relative_source_file_path>
```

## Testing Strategy

| Layer           | What to Test                  | Approach                                                                                                                   |
| :-------------- | :---------------------------- | :------------------------------------------------------------------------------------------------------------------------- |
| **Script Unit** | `clean.js` operations         | Verify target files are deleted successfully; check that execution is a no-op if paths do not exist.                       |
| **Script Unit** | `post-build.js` operations    | Build dummy JS/CSS files with source map comments and `.map` files, execute script, and assert comments/files are removed. |
| **Script Unit** | `sync-versions.js` operations | Write mock `package.json` and code file, execute sync, assert constant is updated, verify no-op if version matches.        |
| **Integration** | Monorepo builds               | Execute `pnpm run clean` and `pnpm run build` on Windows and Linux and verify success.                                     |

## Migration / Rollout

1. Declare catalog in `pnpm-workspace.yaml`.
2. Migrate all workspace package dependencies to use `"catalog:"`.
3. Run `pnpm install` to update the lockfile.
4. Replace existing custom scripts with calls to Node utilities.

## Open Questions

- **Shared scripts location**: Should we export these tools in a development workspace tool helper, or keep them inside the root `/scripts` folder? Keeping them in `/scripts` is standard.
