import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { resolve } from 'path';

export default defineConfig({
  plugins: [tsconfigPaths()],

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
