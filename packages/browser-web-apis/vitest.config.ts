import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.test.ts', 'src/**/*.spec.ts'],
    exclude: ['node_modules', 'dist'],
    setupFiles: ['../../test-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: '../../node_modules/.vitest/coverage',
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.spec.ts',
        '**/test-setup.ts'
      ]
    },
    reporters: ['verbose', 'json'],
    outputFile: {
      json: '../../node_modules/.vitest/results.json'
    }
  },
  resolve: {
    alias: {
      '@angular-helpers/browser-web-apis': resolve(__dirname, 'src/public-api.ts')
    }
  }
});
