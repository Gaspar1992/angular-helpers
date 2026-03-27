# Angular Helpers Packages

Este directorio contiene los packages publicables del monorepo Angular Helpers.

## Estructura

Cada package debe tener su propia carpeta con:

- `package.json` (con nombre scoped como `@angular-helpers/package-name`)
- `src/` (código fuente)
- `dist/` (build output, generado automáticamente)
- `README.md`
- `tsconfig.json`

## Scripts útiles

```bash
# Build todos los packages
npm run build:packages

# Publicar un package específico
npm run publish:package -- package-name

# Test todos los packages
npm run test:packages
```
