import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
  plugins: [angular()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.spec.ts'],
    pool: 'threads',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: ['node_modules/', 'dist/', '**/*.spec.ts'],
    },
  },
  resolve: {
    alias: {
      '@angular-helpers/openlayers': './src',
      '@angular-helpers/openlayers/core': './core/src/index.ts',
      '@angular-helpers/openlayers/layers': './layers/src/index.ts',
      '@angular-helpers/openlayers/controls': './controls/src/index.ts',
    },
  },
});
