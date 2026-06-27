# Exploration: Custom Angular Workspace Schematic for Package Creation

This document outlines the findings, comparison, and recommendation for replacing the legacy shell script [create-package.sh](file:///home/gasparrv92/Repositorios/angular-helpers/scripts/create-package.sh) with a custom Angular schematic.

---

## 1. Context & Objectives

Currently, creating a new package in the `@angular-helpers` monorepo is done via a Bash script [create-package.sh](file:///home/gasparrv92/Repositorios/angular-helpers/scripts/create-package.sh). While functional, this approach has several drawbacks:

- **Lack of validation**: No schema validation for package names or options.
- **Outdated templates**: Hardcoded peer dependencies (e.g. Angular v21 in the script while the monorepo is on v22).
- **Incomplete generation**: The shell script does not generate files like `tsconfig.json` or `src/index.ts`, requiring developers to add them manually to satisfy workspace path mapping configuration.
- **Cross-platform issues**: Bash scripts do not run natively on Windows without Git Bash or WSL.

By converting this to an Angular CLI workspace schematic, we gain:

- Full TypeScript-based control over AST manipulation and file templating.
- Automatic integration with Angular CLI (`ng generate`).
- Schema validation via JSON schemas.
- Dry-run capability (`--dry-run`) out of the box.

---

## 2. Codebase Investigation

### Current Compilation, Build, and Generation Tooling

Based on our codebase inspection, the repository uses the following tools:

1. **pnpm**: The package manager orchestrating the monorepo workspace.
2. **ng-packagr**: Used to compile and build Angular libraries (e.g. `@angular-helpers/core`, `@angular-helpers/worker-http`).
3. **tsc (TypeScript Compiler)**: Used directly to compile schematics in `@angular-helpers/worker-http/schematics` using a custom `tsconfig.schematics.json`.
4. **custom build scripts**: `@angular-helpers/worker-http` uses `scripts/rename-to-cjs.mjs` to convert the compiled `.js` files to CommonJS `.cjs` to ensure compatibility with Angular DevKit, which runs in a CommonJS context.
5. **vitest**: Runs unit tests (`vitest.config.ts` inside each package).
6. **eslint & oxlint / oxfmt**: Running linting and formatting.

---

## 3. Comparison of Approaches

We compare two main approaches for integrating the custom schematic into our workspace.

### Approach A: Local Workspace Schematic

Define the schematic inside a local `tools/schematics/` directory at the workspace root, run via Angular CLI or a custom script.

- **Structure**:
  ```
  tools/schematics/
  ├── tsconfig.json
  ├── collection.json
  └── create-package/
      ├── index.ts
      ├── schema.json
      ├── schema.d.ts
      └── files/
          └── __name@dasherize__/
              ├── package.json.template
              ├── tsconfig.json.template
              └── ...
  ```
- **Execution**:
  1. Compile schematic: `tsc -p tools/schematics/tsconfig.json`
  2. Run schematic: `ng generate ./dist/tools/schematics/collection.json:create-package`
- **Pros**:
  - Keep internal tooling completely separate from standard workspace libraries.
  - Prevents publishing internal developer tooling to NPM.
  - Keeps the `packages/` directory clean.
- **Cons**:
  - Requires maintaining a separate compile/output cycle setup (`tools/schematics` -> `dist/tools/schematics`) that is isolated from existing package build scripts.

### Approach B: Dedicated Monorepo Package `packages/schematics`

Create a new package `@angular-helpers/schematics` inside `packages/`, marked as `"private": true`.

- **Structure**:
  ```
  packages/schematics/
  ├── package.json (marked with "private": true)
  ├── tsconfig.json (compiles directly to dist)
  ├── collection.json
  └── create-package/
      ├── index.ts
      ├── schema.json
      ├── schema.d.ts
      └── files/
          └── ...
  ```
- **Execution**:
  1. Build package: `pnpm --filter @angular-helpers/schematics build`
  2. Run schematic: `ng generate ./dist/packages/schematics/collection.json:create-package`
- **Pros**:
  - Reuses existing monorepo build and lint patterns.
  - We can mirror the schema compilation setup from `@angular-helpers/worker-http` (which uses a custom `tsconfig.schematics.json` + CJS rename script).
  - Keeps the monorepo modular. If we decide in the future to publish public schematics (like `ng-add` or code generators for consumers), they can easily be added to this package and made public by removing `"private": true`.
- **Cons**:
  - Populates the `packages/` directory with a tool that is currently intended only for internal monorepo developers.

---

## 4. Trade-off Matrix

| Criteria                   | Approach A (Local `tools/`)                | Approach B (Package `packages/schematics`)                 |
| :------------------------- | :----------------------------------------- | :--------------------------------------------------------- |
| **Workspace Consistency**  | Moderate (introduces root `tools/` folder) | **High** (follows the standard library package structure)  |
| **Tooling Reuse**          | Low (requires custom TS config and script) | **High** (reuses same compile pattern as `worker-http`)    |
| **Privacy & Publishing**   | **High** (completely internal)             | High (safeguarded via `"private": true` in `package.json`) |
| **Future Extensibility**   | Low (workspace-only)                       | **High** (can easily expose public schematics later)       |
| **CLI Running Complexity** | Identical (`ng g ./dist/...`)              | Identical (`ng g ./dist/...`)                              |

---

## 5. Proposed Implementation Details

Whichever approach is chosen, the schematic should:

1. Accept input options defined in `schema.json`:
   - `name` (string, the package name, e.g. `browser-storage`)
   - `description` (string, optional description)
   - `author` (string, optional author)
2. Use template files located in the `files/` folder:
   - Generate standard workspace path mapping compatible `src/index.ts` containing `export * from './public-api';`.
   - Generate `tsconfig.json` extends root config, ensuring TypeScript integration.
   - Dynamic peer dependency configuration reading the current Angular versions from the root `package.json`.
3. Auto-run `pnpm install` after generating the directory using schematic tasks.

---

## 6. Recommendation

We recommend **Approach B (Dedicated package `@angular-helpers/schematics`)** configured as a private package.

- It aligns with the existing structures in the monorepo (specifically `@angular-helpers/worker-http/schematics`).
- It allows utilizing the existing build tooling and keeps the monorepo architecture consistent.
- It provides a pathway to ship developer utilities to users in the future if needed, without changing the directory layout.
