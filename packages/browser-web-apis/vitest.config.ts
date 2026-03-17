import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.spec.ts'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.spec.ts',
        '**/test-setup.ts'
      ]
    }
  },
  resolve: {
    alias: {
      '@angular-helpers/browser-web-apis': resolve(__dirname, 'src/public-api.ts')
    }
  }
});
