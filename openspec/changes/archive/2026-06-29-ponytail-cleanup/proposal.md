# SDD Proposal: ponytail-cleanup

## 1. Problem Statement

The codebase currently contains several legacy, experimental, or over-engineered components that increase maintenance overhead, bundle size, and architectural complexity without providing corresponding value:

1. **Military Package Prototype**: The `@angular-helpers/openlayers/military` package (and its `milsymbol` dependency) is an unused/prototype feature that introduces large third-party dependencies.
2. **Duplicate Experimental Web APIs**: `IdleDetectorService` and `EyeDropperService` are duplicated between the main `@angular-helpers/browser-web-apis` package and its `/experimental` secondary entry point.
3. **Over-engineered Classes**:
   - `RegexSecurityBuilder`: A complex builder class for regex construction that adds unnecessary abstraction over native regex literals and patterns.
   - `SafeReadonlyMap`: A custom wrapper class in `@angular-helpers/storage` designed to enforce read-only maps, which can be replaced by standard TypeScript `ReadonlyMap` casting.
   - `storage-resource.types.ts`: An unused duplicate interface file.

## 2. Proposed Changes & Approach

We will perform a pure refactoring and cleanup under the following approach:

### 2.1 Remove Military Package & `milsymbol`

- **Action**: Delete the entire directory `packages/openlayers/military`.
- **Dependencies**: Remove `milsymbol` from:
  - `packages/openlayers/package.json` (`peerDependencies` and `peerDependenciesMeta`)
  - Root `package.json` (`devDependencies`)
- **Configuration & Integration**:
  - Remove path mapping `"@angular-helpers/openlayers/military"` from `tsconfig.json`.
  - Remove alias `'@angular-helpers/openlayers/military'` from `vitest.config.ts`.
  - Remove imports and usage of `withMilitary` in the demo application (`src/app/demo/demo.routes.ts`).

### 2.2 Deduplicate Experimental Web APIs

- **Action**: Delete the duplicate service files:
  - `packages/browser-web-apis/experimental/src/idle-detector.service.ts`
  - `packages/browser-web-apis/experimental/src/eye-dropper.service.ts`
- **Re-exports**:
  - In `packages/browser-web-apis/experimental/src/index.ts`, re-export `IdleDetectorService`, `EyeDropperService`, and their types from the main entry point `@angular-helpers/browser-web-apis`.
  - Update `packages/browser-web-apis/experimental/src/inject-idle-detector.ts` and `packages/browser-web-apis/experimental/src/providers.ts` to import these services and types from `@angular-helpers/browser-web-apis`.

### 2.3 Simplify `RegexSecurityBuilder`

- **Action**: Remove `packages/security/src/services/regex-builder.ts` entirely.
- **Simplification**:
  - Remove the `RegexSecurityBuilder` class.
  - Remove the static `builder()` method from `RegexSecurityService`.
  - Update `packages/security/src/services/regex-security.service.ts` to remove the builder export and imports.

### 2.4 Remove `SafeReadonlyMap`

- **Action**: Delete `packages/storage/src/utils/safe-readonly-map.ts` and `packages/storage/src/utils/safe-readonly-map.spec.ts`.
- **Simplification**:
  - In `packages/storage/src/services/entity-store.ts`, remove `SafeReadonlyMap` imports.
  - Replace `new SafeReadonlyMap(this._rawMap)` with `new Map(this._rawMap)` to trigger signal updates while relying on TypeScript's `ReadonlyMap` type safety.

### 2.5 Delete Unused Types File

- **Action**: Delete `packages/storage/src/interfaces/storage-resource.types.ts`.
- **Verification**: Ensure no files import from it.

## 3. Impact & Out of Scope

- **In Scope**: Only the specified deletions, export updates, and helper simplifications.
- **Out of Scope**: Any other package refactoring, API changes to other services, or functional requirement modifications.
- **Testing**: Run Vitest suite (`pnpm test`) to verify all existing tests pass after the cleanup.

## 4. Risks & Mitigations

- **Risk**: The demo app or other packages might fail to compile due to the removal of `@angular-helpers/openlayers/military` (specifically `withMilitary`).
  - **Mitigation**: Update `src/app/demo/demo.routes.ts` to remove the import and provider.
- **Risk**: Secondary entry point consumers of `/experimental` might experience type mismatches if type names differ.
  - **Mitigation**: Re-export `EyeDropperResult` as `ColorSelectionResult` to maintain backwards compatibility in the `/experimental` entry point if needed, or alias it accordingly.
