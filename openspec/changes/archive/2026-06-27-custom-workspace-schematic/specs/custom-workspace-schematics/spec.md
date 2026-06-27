# custom-workspace-schematics Specification

## Purpose

Replace legacy package creation scripting with a robust, cross-platform Angular v22 workspace schematic under a private package `@angular-helpers/schematics` to automate template generation, path mapping, dependency resolution, and monorepo integration.

## Requirements

### Requirement: @angular-helpers/schematics Package & Build Pipeline

The schematics tooling MUST be organized as a private monorepo package that compiles to CommonJS format using `tsconfig.schematics.json` and a script to convert outputs for Angular DevKit compatibility.

#### Scenario: Build and Compilation Process

- GIVEN the `@angular-helpers/schematics` package under `packages/schematics`
- WHEN `pnpm build:schematics` is run
- THEN the build system MUST compile TypeScript files into `dist/packages/schematics`
- AND the `rename-to-cjs.mjs` script MUST rename compiled `.js` files to `.cjs`
- AND all file paths and imports in `collection.json` referencing `.js` MUST be updated to `.cjs`
- AND the `package.json` for the schematics package MUST specify `"private": true`

---

### Requirement: create-package Schematic Schema Validation

The schematic `create-package` MUST validate user inputs before execution using a JSON validation schema to enforce proper workspace naming conventions and option parameters.

#### Scenario: Option Validation

- GIVEN the `create-package` schematic JSON schema
- WHEN a execution is triggered with a missing `name` option, or with an invalid non-dasherized package name
- THEN the schematic engine MUST throw a validation error and abort execution
- WHEN optional parameters `description` or `author` are omitted
- THEN the schematic MUST use default empty values and proceed without error

---

### Requirement: Package Scaffolding and Structure

The schematic MUST generate a complete monorepo-compatible package using pre-defined templates, pulling dependency versions from the workspace catalog, and adding a cross-platform clean command.

#### Scenario: Successful File Generation

- GIVEN a valid package name "new-lib" and description "A new helper library"
- WHEN the `create-package` schematic is executed
- THEN it MUST generate the directory `packages/new-lib` containing:
  - `package.json` referencing core dependencies using `catalog:` versions from `pnpm-workspace.yaml`
  - `tsconfig.json` extending the workspace root `tsconfig.build.json` or `tsconfig.json`
  - `src/index.ts` containing the standard export statements (`export * from './public-api';`)
  - `src/public-api.ts` representing the package entry point
- AND the generated `package.json` MUST define a `"clean"` script that runs the cross-platform clean script `node ../../scripts/clean.js`

---

### Requirement: Path Mapping Registration

The schematic MUST register path mappings for the newly generated package within the root `tsconfig.json` to ensure immediate TypeScript compiler and IDE discovery.

#### Scenario: Automatic Path Mapping Registration

- GIVEN a new package generated under `packages/new-lib`
- WHEN the schematic execution completes template generation
- THEN it MUST read the root `tsconfig.json` and add a path mapping pointing from `@angular-helpers/new-lib` to `./packages/new-lib/src/index.ts`
- AND it MUST preserve formatting, existing mappings, and comments of the modified `tsconfig.json`

---

### Requirement: Post-Scaffold Installation Task

The schematic MUST invoke the package manager automatically after files are generated and path mappings are registered to ensure dependencies are fully resolved.

#### Scenario: Automatic pnpm install Execution

- GIVEN a successful file scaffolding and path mapping registration
- WHEN the schematic execution concludes
- THEN it MUST schedule and run a `NodePackageInstallTask` using `pnpm`
- AND the task MUST run a non-interactive `pnpm install` at the workspace root
