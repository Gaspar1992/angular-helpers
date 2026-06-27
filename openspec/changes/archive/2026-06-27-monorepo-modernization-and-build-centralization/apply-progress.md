# Apply Progress: Monorepo Modernization and Build Centralization

This document records the progress and details of the monorepo modernization and build centralization tasks.

## TDD Cycle Evidence

The implementation of the new cross-platform Node.js utility scripts followed the **Strict TDD cycle** since `strictTddMode` is set to `true`.

| Script             | Phase           | Test Case                                                                                                                    | Command                                           | Outcome                                           |
| :----------------- | :-------------- | :--------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------ | :------------------------------------------------ |
| `clean.js`         | **RED**         | Verify `should delete specified paths when passed as arguments` and `should clean default directories relative to cwd` fail. | `pnpm exec vitest run test/clean.spec.ts`         | **Failed** as expected (No script logic existed). |
| `clean.js`         | **GREEN**       | Implement basic directory and packages clean logic.                                                                          | `pnpm exec vitest run test/clean.spec.ts`         | **Passed**.                                       |
| `clean.js`         | **TRIANGULATE** | Add `should handle non-existent directories gracefully without crashing` and test preserving non-default directories.        | `pnpm exec vitest run test/clean.spec.ts`         | **Passed** with 3 tests passing.                  |
| `clean.js`         | **REFACTOR**    | Polish code structure and check readability.                                                                                 | `pnpm exec vitest run test/clean.spec.ts`         | **Passed**.                                       |
| `post-build.js`    | **RED**         | Verify recursive deletion of `.map` files and stripping of `sourceMappingURL` comments fail.                                 | `pnpm exec vitest run test/post-build.spec.ts`    | **Failed** as expected.                           |
| `post-build.js`    | **GREEN**       | Implement walking directory recursively, deleting `.map` files, and regex comment replacements.                              | `pnpm exec vitest run test/post-build.spec.ts`    | **Passed**.                                       |
| `post-build.js`    | **TRIANGULATE** | Add nested dir tests, plain files that shouldn't be touched, and missing arguments exit checks.                              | `pnpm exec vitest run test/post-build.spec.ts`    | **Passed** with 2 tests passing.                  |
| `post-build.js`    | **REFACTOR**    | Keep code clean and efficient.                                                                                               | `pnpm exec vitest run test/post-build.spec.ts`    | **Passed**.                                       |
| `sync-versions.js` | **RED**         | Verify parsing `package.json` and replacing single/double quoted version constants in source file fail.                      | `pnpm exec vitest run test/sync-versions.spec.ts` | **Failed** as expected.                           |
| `sync-versions.js` | **GREEN**       | Implement regex replacement for version constants in target file.                                                            | `pnpm exec vitest run test/sync-versions.spec.ts` | **Passed**.                                       |
| `sync-versions.js` | **TRIANGULATE** | Add double quote preservation, `mtime` check for no-op runs, and missing arguments check.                                    | `pnpm exec vitest run test/sync-versions.spec.ts` | **Passed** with 4 tests passing.                  |
| `sync-versions.js` | **REFACTOR**    | Ensure robust ESM structure.                                                                                                 | `pnpm exec vitest run test/sync-versions.spec.ts` | **Passed**.                                       |

## Verification Runs

1. **Clean Command**:
   - Command: `pnpm run clean`
   - Outcome: Successful, removed all build and cache folders (e.g. `.angular`, `dist`, `coverage`, `out-tsc`) in both root and workspace subpackages.
2. **Production Build Command**:
   - Command: `pnpm run build:packages:prod`
   - Outcome: Successful, compiled all 7 packages, stripped source mapping URL comments in-place from built `.mjs` assets, deleted `.map` files, and executed version syncing on `browser-web-apis`.
3. **Vitest Unit Test Suite**:
   - Command: `pnpm test`
   - Outcome: **140 passed (140)** test files, representing 851 tests passing cleanly (842 existing package tests + 9 new script tests).
