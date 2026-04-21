import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  cacheDir: '../../node_modules/.vitest-cache/security',
  resolve: {
    alias: {
      '@angular-helpers/security': resolve(__dirname, 'src/index.ts'),
      '@angular-helpers/security/forms': resolve(__dirname, 'forms/src/index.ts'),
      '@angular-helpers/security/signal-forms': resolve(__dirname, 'signal-forms/src/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['**/*.spec.ts'],
    exclude: ['**/node_modules/**'],
  },
});
