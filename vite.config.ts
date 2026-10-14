import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: [
      {
        find: '@angular-helpers/core/utils',
        replacement: resolve(import.meta.dirname, 'libs/core/utils/src/index.ts'),
      },
      {
        find: '@angular-helpers/storage/worker',
        replacement: resolve(import.meta.dirname, 'libs/storage/worker/src/index.ts'),
      },
    ],
  },

  build: {
    lib: {
      entry: {
        'echo.worker': resolve(import.meta.dirname, 'apps/web/src/workers/echo.worker.ts'),
        'http-api.worker': resolve(import.meta.dirname, 'apps/web/src/workers/http-api.worker.ts'),
        'benchmark.worker': resolve(
          import.meta.dirname,
          'apps/web/src/workers/benchmark.worker.ts',
        ),
        'regex.worker': resolve(import.meta.dirname, 'libs/security/src/workers/regex.worker.ts'),
        'search.worker': resolve(import.meta.dirname, 'apps/web/src/workers/search.worker.ts'),
        'storage.worker': resolve(
          import.meta.dirname,
          'apps/web/src/workers/app-storage.worker.ts',
        ),
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    outDir: 'apps/web/public/assets/workers',
    emptyOutDir: true,
    copyPublicDir: false,
    rollupOptions: {},
  },
});
