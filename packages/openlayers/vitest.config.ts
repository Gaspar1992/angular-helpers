import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import angular from '@analogjs/vite-plugin-angular';

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));

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
      include: [
        'core/src/**/*.ts',
        'layers/src/**/*.ts',
        'controls/src/**/*.ts',
        'interactions/src/**/*.ts',
      ],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.spec.ts',
        '**/index.ts',
        '**/models/**',
        '**/config/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@angular-helpers/openlayers/core': here('./core/src/index.ts'),
      '@angular-helpers/openlayers/layers': here('./layers/src/index.ts'),
      '@angular-helpers/openlayers/controls': here('./controls/src/index.ts'),
      '@angular-helpers/openlayers/interactions': here('./interactions/src/index.ts'),
      '@angular-helpers/openlayers': here('./src'),
    },
  },
});
