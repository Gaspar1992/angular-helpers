import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@angular-helpers/core/utils': resolve(__dirname, 'libs/core/utils/src/index.ts'),
      '@angular-helpers/core': resolve(__dirname, 'libs/core/src/index.ts'),
      '@angular-helpers/storage/worker': resolve(__dirname, 'libs/storage/worker/src/index.ts'),
      '@angular-helpers/worker-http/interceptors': resolve(
        __dirname,
        'libs/worker-http/interceptors/src/index.ts',
      ),
      '@angular-helpers/worker-http/transport': resolve(
        __dirname,
        'libs/worker-http/transport/src/index.ts',
      ),
      '@angular-helpers/worker-http/serializer': resolve(
        __dirname,
        'libs/worker-http/serializer/src/index.ts',
      ),
      '@angular-helpers/worker-http/crypto': resolve(
        __dirname,
        'libs/worker-http/crypto/src/index.ts',
      ),
    },
  },
  build: {
    lib: {
      entry: {
        'echo.worker': resolve(__dirname, 'apps/web/src/workers/echo.worker.ts'),
        'http-api.worker': resolve(__dirname, 'apps/web/src/workers/http-api.worker.ts'),
        'benchmark.worker': resolve(__dirname, 'apps/web/src/workers/benchmark.worker.ts'),
        'regex.worker': resolve(__dirname, 'libs/security/src/workers/regex.worker.ts'),
        'search.worker': resolve(__dirname, 'apps/web/src/workers/search.worker.ts'),
      },
      formats: ['es'],
      fileName: (format, entryName) => `${entryName}.js`,
    },
    outDir: 'apps/web/public/assets/workers',
    emptyOutDir: true,
    copyPublicDir: false,
    rollupOptions: {},
  },
});
