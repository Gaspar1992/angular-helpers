# Apply Progress: Custom Angular Workspace Schematic

## TDD Cycle Evidence

| Cycle | Phase    | Test Case                                                              | Expected Result / Error                                                                          | Actual Result / Error                                                                                        | File                                                                                                                 | Status                  |
| ----- | -------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| 1     | RED      | `should generate all template files and update tsconfig.json mappings` | `Error: Collection .../dist/packages/schematics/collection.json cannot be found.`                | `Error: Collection .../dist/packages/schematics/collection.json cannot be found.`                            | [schematics.spec.ts](file:///home/gasparrv92/Repositorios/angular-helpers/test/schematics.spec.ts)                   | PASS (Expected Failure) |
| 1     | RED      | `should validate package name`                                         | `Error: Collection .../dist/packages/schematics/collection.json cannot be found.`                | `Error: Collection .../dist/packages/schematics/collection.json cannot be found.`                            | [schematics.spec.ts](file:///home/gasparrv92/Repositorios/angular-helpers/test/schematics.spec.ts)                   | PASS (Expected Failure) |
| 2     | GREEN    | `should generate all template files and update tsconfig.json mappings` | Verification tests run and assert file creation, dependencies, clean scripts, and path mappings. | Test runs successfully in isolated Vitest Node test suite runner.                                            | [schematics.spec.ts](file:///home/gasparrv92/Repositorios/angular-helpers/test/schematics.spec.ts)                   | PASS                    |
| 2     | GREEN    | `should validate package name`                                         | Invalid package name throws a validation SchematicsException.                                    | Reject promise with validation error when name has uppercase characters.                                     | [schematics.spec.ts](file:///home/gasparrv92/Repositorios/angular-helpers/test/schematics.spec.ts)                   | PASS                    |
| 3     | REFACTOR | Isolated test suite configuration                                      | Decouple schematics testing from the complex Angular/Analog browser-testing Vite pipeline.       | Extracted custom test runner configuration to `test/vitest.schematics.config.ts` and clean Node environment. | [vitest.schematics.config.ts](file:///home/gasparrv92/Repositorios/angular-helpers/test/vitest.schematics.config.ts) | PASS                    |

## Tasks Status

### Phase 1: Foundation

- [x] 1.1 Create the package folder `packages/schematics` and `packages/schematics/package.json` with devDependencies and compile build script.
- [x] 1.2 Create `packages/schematics/tsconfig.json` configured to target CommonJS compile and emit code to `dist/packages/schematics/`.
- [x] 1.3 Create `packages/schematics/collection.json` registering the `create-package` schematic with its CommonJS factory and schema.
- [x] 1.4 Implement `packages/schematics/scripts/rename-to-cjs.mjs` to copy templates, rename `.js` outputs to `.cjs`, and update `.js` references in `collection.json`.

### Phase 2: Schematic Code & Templates

- [x] 2.1 Create the options schema `packages/schematics/src/create-package/schema.json` and type file `packages/schematics/src/create-package/schema.d.ts` validating name option is dasherized.
- [x] 2.2 Implement `packages/schematics/src/create-package/index.ts` containing the schematic factory logic to copy files and register post-install node package task.
- [x] 2.3 Add AST/Regex tsconfig.json path mapping logic inside `packages/schematics/src/create-package/index.ts` to edit the root paths map.
- [x] 2.4 Create package JSON template `packages/schematics/src/create-package/files/package.json.template` referencing workspace dependencies using `catalog:` syntax.
- [x] 2.5 Create ng-package and tsconfig templates under `packages/schematics/src/create-package/files/` extending workspace settings (including allowedNonPeerDependencies for `ng-packagr` compatibility).
- [x] 2.6 Create entry point templates (`src/index.ts.template`, `src/public-api.ts.template`) and configurations (`vitest.config.ts.template`, `README.md.template`, `src/test-setup.ts.template`).
- [x] 2.7 Create subfolder template skeletons: `src/services/index.ts.template`, `src/interfaces/index.ts.template`, `src/utils/index.ts.template`, `src/guards/index.ts.template`.

### Phase 3: Monorepo Integration

- [x] 3.1 Add `build:schematics` and `generate:package` execution scripts to the root `package.json`.
- [x] 3.2 Run `pnpm install` at the workspace root to resolve new package workspace definitions and update lockfile.
- [x] 3.3 Delete the legacy bash script `scripts/create-package.sh` from the repository.

### Phase 4: Verification and Tests

- [x] 4.1 Write Vitest unit tests under `test/schematics.spec.ts` asserting schematic execution, package file output structure, and clean script setup.
- [x] 4.2 Run `pnpm build:schematics` and confirm compilation completes and outputs to `dist/packages/schematics/` successfully.
- [x] 4.3 Execute `pnpm generate:package` to verify schematic generates standard files under `packages/test-lib` and updates root `tsconfig.json` path mappings.
- [x] 4.4 Verify package build runs successfully on generated library and all workspace unit tests pass without regressions.
