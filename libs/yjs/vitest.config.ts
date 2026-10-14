import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  cacheDir: '../../node_modules/.vitest-cache/yjs',
  resolve: {
    alias: {
      '@angular-helpers/yjs': resolve(__dirname, 'src/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.spec.ts'],
    exclude: ['**/node_modules/**'],
  },
});
