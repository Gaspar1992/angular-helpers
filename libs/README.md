# Angular Helpers Packages

This directory contains the publishable packages of the Angular Helpers monorepo.

## Available Packages

- **[@angular-helpers/core](./core)** — Lightweight, high-performance, and SSR-safe timing signal operators, Transferables, and Worker pooling.
- **[@angular-helpers/browser-web-apis](./browser-web-apis)** — Unified, reactive wrappers for 36+ native Browser APIs with signals support.
- **[@angular-helpers/security](./security)** — ReDoS prevention, WebCrypto HMAC signing, password entropy, and secure storage.
- **[@angular-helpers/storage](./storage)** — High-performance reactive storage system with L1/L2 caching, schema drift validation, and encryption.
- **[@angular-helpers/worker-http](./worker-http)** — Off-main-thread HTTP client pipelines using Web Workers.
- **[@angular-helpers/openlayers](./openlayers)** — Declarative, modular Angular components for OpenLayers maps and layers.
- **[@angular-helpers/yjs](./yjs)** — Bidirectional Angular Signal bindings for Yjs CRDT real-time collaborative state.
- **[@angular-helpers/testing](./testing)** — Streamlined testing utilities, render wrapper, and mocks for modern Angular applications.
- **[@angular-helpers/schematics](./schematics)** — Code generation and package scaffolding schematics for the monorepo.

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
