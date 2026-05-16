# Angular Helpers Packages

This directory contains the publishable packages of the Angular Helpers monorepo.

## Available Packages

- **[@angular-helpers/security](./security)** — ReDoS prevention, WebCrypto HMAC signing, and secure storage.
- **[@angular-helpers/browser-web-apis](./browser-web-apis)** — Unified, reactive wrappers for native Browser APIs with signals support.
- **[@angular-helpers/worker-http](./worker-http)** — Off-main-thread HTTP pipelines using Web Workers.
- **[@angular-helpers/openlayers](./openlayers)** — Declarative, modular Angular components for OpenLayers.

## Package Structure

Each package follows a standardized structure:

- `package.json` — Scoped name (`@angular-helpers/*`) and metadata.
- `src/` — TypeScript source code and public API.
- `dist/` — Compiled output (ignored by git, generated during build).
- `README.md` — Detailed package-specific documentation.
- `tsconfig.json` — Package-specific TypeScript configuration.

## Common Scripts

These scripts should be run from the repository root:

```bash
# Build all packages
pnpm run build:packages

# Run unit tests across all packages
pnpm test

# Run browser-based tests
pnpm run test:browser

# Lint the entire workspace
pnpm run lint
```

For package publication and advanced CI/CD scripts, refer to the root `package.json` or internal documentation.
