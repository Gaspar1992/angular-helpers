import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { resolve } from 'path';

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: [
      {
        find: '@angular-helpers/core/utils',
        replacement: resolve(__dirname, 'libs/core/utils/src/index.ts'),
      },
      {
        find: '@angular-helpers/storage/worker',
        replacement: resolve(__dirname, 'libs/storage/worker/src/index.ts'),
      },
    ],
  },

  build: {
    lib: {
      entry: {
        'echo.worker': resolve(__dirname, 'apps/web/src/workers/echo.worker.ts'),
        'http-api.worker': resolve(__dirname, 'apps/web/src/workers/http-api.worker.ts'),
        'benchmark.worker': resolve(__dirname, 'apps/web/src/workers/benchmark.worker.ts'),
        'regex.worker': resolve(__dirname, 'libs/security/src/workers/regex.worker.ts'),
        'search.worker': resolve(__dirname, 'apps/web/src/workers/search.worker.ts'),
        'storage.worker': resolve(__dirname, 'apps/web/src/workers/app-storage.worker.ts'),
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
