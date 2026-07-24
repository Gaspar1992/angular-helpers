# Migration Guide: 0.7.x → 1.0.0

This guide covers breaking changes and new features when upgrading from `@angular-helpers/worker-http` 0.7.x to 1.0.0.

## Breaking Changes

None. Version 1.0.0 is a **feature-complete release** that adds new capabilities without changing existing APIs. All code written for 0.7.x will continue to work.

## New Features

### 1. ng-add Schematic (Recommended Setup)

The easiest way to add worker-http to your project is now via Angular CLI:

```bash
ng add @angular-helpers/worker-http
```

This single command:

- Installs the package
- Creates `src/app/workers/http-api.worker.ts` from a template
- Updates `tsconfig.json` with the `webworker` lib
- Adds `provideWorkerHttpClient()` to your `app.config.ts`

**To migrate an existing manual setup:**
If you've already manually configured worker-http, you can still use `ng add` or continue with your existing setup. Both approaches work identically.

### 2. esbuild Plugin for Interceptor Auto-Bundling

When using custom esbuild configurations (e.g., with `@angular-builders/custom-webpack`), you can now auto-discover and bundle interceptors:

```typescript
// esbuild.config.ts
import { workerHttpPlugin } from '@angular-helpers/worker-http/esbuild-plugin';

export default {
  plugins: [
    workerHttpPlugin({
      autoDiscover: true, // Scan src/ for *interceptor*.ts files
    }),
  ],
};
```

**Migration:** If you previously imported interceptors manually in your worker file, you can continue doing so. The plugin is optional and only needed for custom build setups.

### 3. Safari Streams Polyfill

Safari 16-17 lack transferable `ReadableStream` support. Enable the polyfill for full compatibility:

```typescript
import { withWorkerStreamsPolyfill } from '@angular-helpers/worker-http/backend';

provideWorkerHttpClient(
  withWorkerConfigs([...]),
  withWorkerStreamsPolyfill(), // Enable for Safari 16-17
);
```

**Migration:** Only needed if:

- You use `responseType: 'stream'` AND
- You support Safari 16-17

The polyfill is lazy-loaded and adds 0 bytes for modern browsers.

## Deprecations

None. All 0.7.x APIs remain fully supported.

## TypeScript Compatibility

Version 1.0.0 maintains the same TypeScript requirements as 0.7.x:

- TypeScript 5.0+
- Angular 16+

## Bundle Size Impact

| Feature          | Impact                                    |
| ---------------- | ----------------------------------------- |
| ng-add schematic | 0 bytes (build-time only)                 |
| esbuild plugin   | 0 bytes (build-time only)                 |
| streams polyfill | 0 bytes unless loaded (Safari 16-17 only) |

## Getting Help

- [Full Documentation](./README.md)
- [GitHub Issues](https://github.com/Gaspar1992/angular-helpers/issues)

---

**Happy upgrading!** 🚀
