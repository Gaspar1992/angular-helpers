# Monorepo Modernization Specification

## Purpose

Define the requirements for centralized dependency management, cross-platform build cleanup, build output processing, and runtime version synchronization within the monorepo.

## Requirements

| ID      | Requirement          | Description                                                                                                                                             | Strength |
| ------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| REQ-001 | Centralized Catalogs | Workspace packages MUST resolve dependencies using a central catalog in `pnpm-workspace.yaml` via the `catalog:` protocol.                              | MUST     |
| REQ-002 | Cross-Platform Clean | The cleanup task MUST remove build and cache directories recursively cross-platform using Node.js, avoiding Unix-specific or shell-dependent utilities. | MUST     |
| REQ-003 | Post-Build Stripping | The post-build process MUST delete all `.map` files and remove source map comments from built files cross-platform.                                     | MUST     |
| REQ-004 | Version Syncing      | The runtime version constant in source code files MUST be synced programmatically to match the package's `package.json` version.                        | MUST     |

---

### Requirement: REQ-001 - Centralized Catalogs

All shared workspace dependencies MUST be declared in the default catalog of `pnpm-workspace.yaml` and referenced in workspace `package.json` files using the `catalog:` protocol.

#### Scenario: Successful resolution from catalog

- GIVEN a dependency declared in `pnpm-workspace.yaml`'s catalog
- WHEN `pnpm install` is executed in a workspace referencing that dependency with `"catalog:"`
- THEN pnpm MUST resolve the correct version from the catalog and update the lockfile.

#### Scenario: Install fails on missing catalog entry

- GIVEN a `package.json` referencing a dependency version via `"catalog:"`
- WHEN the dependency is not defined in `pnpm-workspace.yaml`'s catalog and install runs
- THEN the installation process MUST fail and report a missing catalog entry.

---

### Requirement: REQ-002 - Cross-Platform Clean

The cleanup utility MUST recursively delete `.angular`, `dist`, `out-tsc`, `coverage`, and `.vitest` directories cross-platform without platform-dependent commands.

#### Scenario: Directories deleted successfully

- GIVEN target build/cache folders exist with files in a package
- WHEN the clean utility is executed on Windows, macOS, or Linux
- THEN all target folders MUST be recursively deleted.

#### Scenario: Safe execution when folders are missing

- GIVEN target build/cache folders do not exist
- WHEN the clean utility is executed
- THEN the utility MUST exit cleanly with code 0 without throwing errors.

---

### Requirement: REQ-003 - Post-Build Stripping

The build post-processor MUST find and remove all `.map` files and strip source map reference comments (e.g. `//# sourceMappingURL=...`) from compiled `.js`, `.mjs`, and `.css` files.

#### Scenario: Source maps deleted and references stripped

- GIVEN build artifacts containing `.map` files and source map mapping comments
- WHEN the post-build processor is executed
- THEN all `.map` files MUST be deleted and all mapping comments MUST be removed.

#### Scenario: No-op on files without source maps

- GIVEN build artifacts without `.map` files or source map reference comments
- WHEN the post-build processor is executed
- THEN the files MUST remain unchanged and the process MUST exit successfully.

---

### Requirement: REQ-004 - Version Syncing

The version sync script MUST read the `version` field from a package's `package.json` and rewrite the runtime version constant in target source files to match it.

#### Scenario: Source version constant is updated

- GIVEN a source file exporting `export const version = '0.1.0';` and `package.json` with version `22.0.0`
- WHEN the version sync script is executed
- THEN the source file MUST be updated to export `export const version = '22.0.0';`.

#### Scenario: No-op when version is already in sync

- GIVEN a source file exporting a version constant matching the `package.json` version
- WHEN the version sync script is executed
- THEN the source file MUST NOT be modified.
