# 🛠️ @angular-helpers/schematics

Developer tooling and code generation schematics for the `@angular-helpers` ecosystem. Provides automated generators to scaffold new monorepo helper libraries with strict Angular best practices, path mappings, and testing setup.

---

## Quick Path

### 1. Execution

Generate a new library package within the monorepo workspace:

```bash
# Using Nx
pnpm nx g @angular-helpers/schematics:create-package --name=my-new-lib

# Or using Angular CLI
ng g @angular-helpers/schematics:create-package --name=my-new-lib
```

### 2. Available Options

| Option          | Type     | Required | Description                                                         |
| :-------------- | :------- | :------- | :------------------------------------------------------------------ |
| `--name`        | `string` | **Yes**  | Name of the new package (kebab-case, e.g. `audio-engine`).          |
| `--description` | `string` | No       | Package summary added to the generated `package.json` and `README`. |
| `--author`      | `string` | No       | Package author string for metadata.                                 |

---

## Schematics Collection

| Schematic        | Factory                      | Description                                                                              |
| :--------------- | :--------------------------- | :--------------------------------------------------------------------------------------- |
| `create-package` | `./create-package/index.cjs` | Scaffolds a new helper package under `libs/<name>`, configures tsconfig, and links pnpm. |

---

## Architecture & Guarantees

- **Automated Monorepo Wiring**: Generates the package directory under `libs/<name>` with standard `tsconfig.json`, `package.json`, and initial entry points.
- **Path Mapping Integration**: Safely modifies the root `tsconfig.json` paths mapping (`@angular-helpers/<name>`) without breaking existing aliases or duplicate registrations.
- **Dependency Installation**: Schedules an automated `pnpm install` lifecycle task upon schematic completion to link workspace packages immediately.
- **Strict Linting & Formats**: Output files adhere directly to the repository's oxlint, oxfmt, and Angular standalone/signals standards.

---

## License

MIT
