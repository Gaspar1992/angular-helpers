import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@angular-helpers/core/utils': resolve(__dirname, 'packages/core/utils/src/index.ts'),
      '@angular-helpers/core': resolve(__dirname, 'packages/core/src/index.ts'),
      '@angular-helpers/storage/worker': resolve(__dirname, 'packages/storage/worker/src/index.ts'),
      '@angular-helpers/worker-http/interceptors': resolve(
        __dirname,
        'packages/worker-http/interceptors/src/index.ts',
      ),
      '@angular-helpers/worker-http/transport': resolve(
        __dirname,
        'packages/worker-http/transport/src/index.ts',
      ),
      '@angular-helpers/worker-http/serializer': resolve(
        __dirname,
        'packages/worker-http/serializer/src/index.ts',
      ),
      '@angular-helpers/worker-http/crypto': resolve(
        __dirname,
        'packages/worker-http/crypto/src/index.ts',
      ),
    },
  },
  build: {
    lib: {
      entry: {
        'echo.worker': resolve(__dirname, 'src/workers/echo.worker.ts'),
        'http-api.worker': resolve(__dirname, 'src/workers/http-api.worker.ts'),
        'benchmark.worker': resolve(__dirname, 'src/workers/benchmark.worker.ts'),
        'regex.worker': resolve(__dirname, 'packages/security/src/workers/regex.worker.ts'),
        'search.worker': resolve(__dirname, 'src/workers/search.worker.ts'),
      },
      formats: ['es'],
      fileName: (format, entryName) => `${entryName}.js`,
    },
    outDir: 'public/assets/workers',
    emptyOutDir: true,
    copyPublicDir: false,
    rollupOptions: {},
  },
});
