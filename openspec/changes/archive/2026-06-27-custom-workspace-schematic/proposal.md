# Proposal: Custom Angular Workspace Schematic for Package Creation

## Intent

Replace the legacy, error-prone shell script `create-package.sh` with a cross-platform, automated Angular v22 workspace schematic. This will provide input validation, automatic peer dependency configuration using monorepo defaults, and full structure generation to avoid manual configuration and setup.

## Scope

### In Scope

- Create `@angular-helpers/schematics` package under `packages/schematics`.
- Define `create-package` schematic with schema validation, custom options (name, description, author), and template files.
- Compile schematics using `tsc` and convert to CommonJS via a CJS rename script.
- Update root `package.json` to include build and execution scripts.
- Remove the legacy `scripts/create-package.sh` script.

### Out of Scope

- Creating other schematics such as components, directives, or consumer-facing setup (`ng-add`).

## Capabilities

### New Capabilities

- `custom-workspace-schematics`: The @angular-helpers/schematics package containing custom schematics, build automation, and execution CLI options.

### Modified Capabilities

- None

## Approach

Implement `@angular-helpers/schematics` as a private monorepo package inside `packages/`. The schematic will be compiled to `dist/packages/schematics` using `tsc` (extending a local TS config) and processed by a CJS renaming script to ensure compatibility with Angular DevKit. It will feature standard DevKit schematic rules to scaffold packages, configure path mappings, read dependency versions dynamically, and run `pnpm install` via a post-install task.

## Affected Areas

| Area                        | Impact   | Description                                                                              |
| --------------------------- | -------- | ---------------------------------------------------------------------------------------- |
| `pnpm-workspace.yaml`       | Verified | Standard monorepo wildcard `packages/*` automatically detects the new package directory. |
| `package.json`              | Modified | Add root commands `build:schematics` and `generate:package`.                             |
| `packages/schematics/*`     | New      | All schematic library files, templates, schemas, and configurations.                     |
| `scripts/create-package.sh` | Removed  | Legacy bash script deleted from the repository.                                          |

## Risks

| Risk                                 | Likelihood | Mitigation                                                                       |
| ------------------------------------ | ---------- | -------------------------------------------------------------------------------- |
| Development build script differences | Low        | Mirror the working compile/rename structure from `@angular-helpers/worker-http`. |

## Rollback Plan

Revert the git commit to restore `scripts/create-package.sh`, and delete the `packages/schematics` directory.

## Dependencies

- `@angular-devkit/core` and `@angular-devkit/schematics` as devDependencies.

## Success Criteria

- [ ] New package `@angular-helpers/schematics` successfully compiles to `dist/packages/schematics/`.
- [ ] Running `pnpm generate:package` prompts for package configuration, generates all template files, and executes `pnpm install` automatically.
- [ ] Generated package conforms to current monorepo structure and builds correctly.
