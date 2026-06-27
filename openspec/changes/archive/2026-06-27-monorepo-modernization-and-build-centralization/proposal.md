# Proposal: Monorepo Modernization and Build Centralization

## Intent

Resolve technical debt consisting of dependency versions skew, OS-dependent clean and post-build commands, and manual browser-web-apis runtime version synchronization.

## Scope

### In Scope

- Centralize dependency versions in `pnpm-workspace.yaml` catalog.
- Replace duplicate Unix shell script clean and post-build tasks with cross-platform Node.js scripts.
- Sync runtime version constant in `packages/browser-web-apis/src/public-api.ts` programmatically from its `package.json`.

### Out of Scope

- Migrating to other package managers or build orchestrators (e.g. Turbo, Nx).
- Upgrading major dependency versions unless needed for catalog integration.

## Capabilities

### New Capabilities

- `monorepo-modernization`: Cross-platform scripts for clean, post-build, and version sync, plus pnpm Catalogs integration.

### Modified Capabilities

- None

## Approach

Implement Approach 1: Add a `catalog` to `pnpm-workspace.yaml` and reference it across all `package.json` configurations. Build cross-platform Node.js utility scripts (`scripts/clean.js`, `scripts/post-build.js`, `scripts/sync-versions.js`) to handle clean, source map / mapping comment stripping, and version synchronization.

## Affected Areas

| Area                                          | Impact   | Description                                                         |
| --------------------------------------------- | -------- | ------------------------------------------------------------------- |
| `pnpm-workspace.yaml`                         | Modified | Configure pnpm catalog block.                                       |
| `package.json`                                | Modified | Update root dependencies and scripts.                               |
| `packages/core/package.json`                  | Modified | Update dependencies and build/clean scripts.                        |
| `packages/browser-web-apis/package.json`      | Modified | Update dependencies, build/clean scripts, and trigger version sync. |
| `packages/browser-web-apis/src/public-api.ts` | Modified | Replace hardcoded version constant with dynamic sync hook.          |
| `packages/openlayers/package.json`            | Modified | Update dependencies and build/clean scripts.                        |
| `packages/security/package.json`              | Modified | Update dependencies and build/clean scripts.                        |
| `packages/storage/package.json`               | Modified | Update dependencies and build/clean scripts.                        |
| `packages/testing/package.json`               | Modified | Update dependencies and build/clean scripts.                        |
| `packages/worker-http/package.json`           | Modified | Update dependencies and build/clean scripts.                        |
| `scripts/clean.js`                            | New      | Node.js clean script.                                               |
| `scripts/post-build.js`                       | New      | Node.js post-build cleanup.                                         |
| `scripts/sync-versions.js`                    | New      | Node.js version synchronizer.                                       |

## Risks

| Risk                                     | Likelihood | Mitigation                                   |
| ---------------------------------------- | ---------- | -------------------------------------------- |
| Lockfile regeneration issues             | Low        | Run `pnpm install` after catalog definition. |
| Source Map comment stripping regex error | Low        | Standardized strict regex and test coverage. |

## Rollback Plan

Revert git changes with `git reset --hard HEAD` and clean untracked files with `git clean -fd`.

## Dependencies

- Node.js (v18+)
- pnpm (v11+)

## Success Criteria

- [ ] All workspaces resolve dependencies successfully from the centralized catalog.
- [ ] Build and clean commands work successfully on both Unix-based and Windows systems.
- [ ] Built artifacts contain no source maps or sourceMappingURL comments.
- [ ] Runtime version constant in `browser-web-apis` is automatically synced to `package.json`'s version.
