# Technical Design - Custom Angular Workspace Schematic

This design replaces the legacy `create-package.sh` shell script with a cross-platform, type-safe Angular v22 workspace schematic under a private monorepo package `@angular-helpers/schematics`.

## 1. Package Structure

The new package will reside under `packages/schematics/` with the following structure:

```
packages/schematics/
├── package.json
├── tsconfig.json
├── collection.json
├── scripts/
│   └── rename-to-cjs.mjs
└── src/
    └── create-package/
        ├── index.ts
        ├── schema.json
        ├── schema.d.ts
        └── files/
            ├── package.json.template
            ├── ng-package.json.template
            ├── tsconfig.json.template
            ├── README.md.template
            ├── vitest.config.ts.template
            └── src/
                ├── index.ts.template
                ├── public-api.ts.template
                ├── test-setup.ts.template
                ├── services/
                │   └── index.ts.template
                ├── interfaces/
                │   └── index.ts.template
                ├── utils/
                │   └── index.ts.template
                └── guards/
                    └── index.ts.template
```

## 2. Package Configurations & Build Pipeline

### `packages/schematics/package.json`

Specifies devDependencies from root `catalog:` and automates compilation and CommonJS conversion:

```json
{
  "name": "@angular-helpers/schematics",
  "version": "1.0.0",
  "private": true,
  "schematics": "./collection.json",
  "scripts": {
    "build": "tsc -p tsconfig.json && node scripts/rename-to-cjs.mjs"
  },
  "devDependencies": {
    "@angular-devkit/core": "catalog:",
    "@angular-devkit/schematics": "catalog:",
    "@types/node": "catalog:",
    "typescript": "catalog:"
  }
}
```

### `packages/schematics/tsconfig.json`

Compiles TypeScript files under `src/` to CommonJS targeting `dist/packages/schematics/`:

```json
{
  "compilerOptions": {
    "ignoreDeprecations": "6.0",
    "baseUrl": ".",
    "lib": ["es2020", "dom"],
    "module": "commonjs",
    "moduleResolution": "node",
    "declaration": false,
    "noEmitOnError": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "noUnusedParameters": true,
    "noUnusedLocals": true,
    "rootDir": "src",
    "outDir": "../../dist/packages/schematics",
    "skipDefaultLibCheck": true,
    "skipLibCheck": true,
    "strictNullChecks": true,
    "target": "es2020",
    "types": ["node"]
  },
  "include": ["src/**/*"],
  "exclude": ["**/*.spec.ts"]
}
```

### `packages/schematics/scripts/rename-to-cjs.mjs`

Automates asset copy (`collection.json`, `schema.json`, and `files` templates) to `dist/packages/schematics/`, renames compiled `.js` files to `.cjs`, and rewrites factory imports:

- Copied files match destination structure: `dist/packages/schematics/create-package/files/`
- JSON files regex-processed to reference `.cjs` instead of `.js`

### `packages/schematics/collection.json`

Registers `create-package` with `.cjs` factory and JSON schema validation:

```json
{
  "$schema": "../../node_modules/@angular-devkit/schematics/collection-schema.json",
  "schematics": {
    "create-package": {
      "description": "Create a new Angular helper package in the monorepo",
      "factory": "./create-package/index.cjs#createPackage",
      "schema": "./create-package/schema.json"
    }
  }
}
```

## 3. Schematic Implementation

### Options Schema (`schema.json` & `schema.d.ts`)

Uses regex validation for lowercase, dasherized package names:

- Pattern: `^[a-z][a-z0-9-]*$` for `name` (required).
- Optional: `description`, `author` (defaulting to empty strings).

### Schematic Factory (`src/create-package/index.ts`)

Orchestrates generation using DevKit rules:

1. **Rule Chain**: Combines file generation and TS configuration editing.
2. **Template Expansion**: Compiles `files/` templates using `applyTemplates` and outputs them using `move('packages/' + options.name)`.
3. **Automatic Path Mapping**: Reads root `tsconfig.json`, finds the wildcard mapping `"@angular-helpers/*": ["./packages/*/src/index.ts"]`, and inserts the new package mapping right before it using an indentation-preserving regular expression:
   ```typescript
   const wildcardPattern =
     /([\t ]*)("@angular-helpers\/\*":\s*\[\s*"\.\/packages\/\*\/src\/index\.ts"\s*\])/;
   const newMapping = `"@angular-helpers/${options.name}": ["./packages/${options.name}/src/index.ts"],`;
   const updated = content.replace(
     wildcardPattern,
     (match, indent, line) => `${indent}${newMapping}\n${indent}${line}`,
   );
   ```
4. **Post-Scaffold Installation Task**: Invokes a `NodePackageInstallTask` specifying `packageManager: 'pnpm'` to auto-resolve dependency updates non-interactively at the workspace root.

## 4. Templates Design

### `package.json.template`

Directly matches workspace standard versions using the `catalog:` syntax:

- Dependencies: `@angular/core`, `@angular/common`, `@angular/platform-browser`, `rxjs`, and `tslib` configured with `"catalog:"`.
- Custom Clean Command: Runs the cross-platform clean script `"clean": "node ../../scripts/clean.js"`.

### `tsconfig.json.template`

Extends workspace configurations and outputs to `dist/`:

- Extends: `"extends": "../../tsconfig.json"`
- Output: `"outDir": "../../dist/<%= name %>"`

## 5. Entry Points

- `src/index.ts.template` exports all from `public-api`: `export * from './public-api';`
- `src/public-api.ts.template` acts as entrypoint exporting core modules.

## 6. Root Integration

1. Add scripts to root `package.json`:
   - `"build:schematics": "pnpm --filter @angular-helpers/schematics build"`
   - `"generate:package": "ng generate ./dist/packages/schematics/collection.json:create-package"`
2. Remove legacy `scripts/create-package.sh` file.
