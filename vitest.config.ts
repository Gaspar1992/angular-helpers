import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import angular from '@analogjs/vite-plugin-angular';

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  plugins: [angular({ tsconfig: './tsconfig.spec.json' })],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['packages/**/*.spec.ts', 'src/**/*.spec.ts'],
    exclude: ['packages/**/schematics/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        'packages/testing/src/**/*.ts': {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80,
        },
      },
    },
    server: {
      deps: {
        inline: ['ora'],
      },
    },
  },
  resolve: {
    alias: {
      '@angular-helpers/core/utils': here('./packages/core/utils/src/index.ts'),
      '@angular-helpers/core': here('./packages/core/src/index.ts'),
      '@angular-helpers/testing': here('./packages/testing/src/public-api.ts'),
      '@angular-helpers/storage/worker': here('./packages/storage/worker/src/index.ts'),
      '@analogjs/vitest-angular/setup-vitest': here(
        './node_modules/@analogjs/vitest-angular/setup-vitest.js',
      ),
      '@angular-helpers/worker-http/transport': here(
        './packages/worker-http/transport/src/index.ts',
      ),
      '@angular-helpers/worker-http/serializer': here(
        './packages/worker-http/serializer/src/index.ts',
      ),
      '@angular-helpers/worker-http/backend': here('./packages/worker-http/backend/src/index.ts'),
      '@angular-helpers/worker-http/interceptors': here(
        './packages/worker-http/interceptors/src/index.ts',
      ),
      '@angular-helpers/worker-http/crypto': here('./packages/worker-http/crypto/src/index.ts'),
      '@angular-helpers/security/forms': here('./packages/security/forms/src/index.ts'),
      '@angular-helpers/security/signal-forms': here(
        './packages/security/signal-forms/src/index.ts',
      ),
      '@angular-helpers/browser-web-apis/experimental': here(
        './packages/browser-web-apis/experimental/src/index.ts',
      ),
      '@angular-helpers/openlayers/core': here('./packages/openlayers/core/src/index.ts'),
      '@angular-helpers/openlayers/layers': here('./packages/openlayers/layers/src/index.ts'),
      '@angular-helpers/openlayers/controls': here('./packages/openlayers/controls/src/index.ts'),
      '@angular-helpers/openlayers/interactions': here(
        './packages/openlayers/interactions/src/index.ts',
      ),
      '@angular-helpers/openlayers/overlays': here('./packages/openlayers/overlays/src/index.ts'),
      '@angular-helpers/openlayers/military': here('./packages/openlayers/military/src/index.ts'),
    },
  },
});
