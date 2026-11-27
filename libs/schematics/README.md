# 🛠️ @angular-helpers/schematics

Angular CLI schematics and workspace generators for `@angular-helpers/*` — scaffold browser API services, security configurations, and zoneless signal components.

---

## Quick Path

### 1. Installation

```bash
pnpm add -D @angular-helpers/schematics
```

### 2. Available Schematics

```bash
# Add @angular-helpers/browser-web-apis to an Angular project
ng add @angular-helpers/schematics

# Generate a browser-API-backed service
ng generate @angular-helpers/schematics:api-service --name location --api geolocation
```

---

## Schematics Reference

| Schematic     | Purpose                                                                                                |
| :------------ | :----------------------------------------------------------------------------------------------------- |
| `ng-add`      | Installs `@angular-helpers/browser-web-apis` and wires `provideBrowserWebApis()` into `app.config.ts`. |
| `api-service` | Scaffolds a typed service wrapping a selected Browser Web API with unit tests.                         |

---

## Interactive Documentation

👉 **[Schematics Docs](https://gaspar1992.github.io/angular-helpers/docs/schematics)**

## License

MIT
