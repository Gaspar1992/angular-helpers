import { resolve } from 'path';
import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
  cacheDir: '../../node_modules/.vitest-cache/security',
  plugins: [angular()],
  resolve: {
    alias: {
      '@angular-helpers/core/utils': resolve(__dirname, '../core/utils/src/index.ts'),
      '@angular-helpers/core': resolve(__dirname, '../core/src/index.ts'),
      '@angular-helpers/security': resolve(__dirname, 'src/index.ts'),
      '@angular-helpers/security/forms': resolve(__dirname, 'forms/src/index.ts'),
      '@angular-helpers/security/signal-forms': resolve(__dirname, 'signal-forms/src/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.spec.ts'],
    exclude: ['**/node_modules/**'],
  },
});
