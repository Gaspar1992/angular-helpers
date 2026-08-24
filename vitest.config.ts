import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import angular from '@analogjs/vite-plugin-angular';

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  root: here('.'),
  plugins: [
    angular({
      tsconfig: here('./apps/web/tsconfig.spec.json'),
      workspaceRoot: here('.'),
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [here('./apps/web/src/test-setup.ts')],
    include: ['libs/**/*.spec.ts', 'apps/web/src/**/*.spec.ts'],
    exclude: ['libs/**/schematics/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        'libs/testing/src/**/*.ts': {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80,
        },
      },
    },
    onConsoleLog(log: string) {
      if (log.includes('Could not parse CSS stylesheet')) {
        return false;
      }
    },
    server: {
      deps: {
        inline: ['ora'],
      },
    },
  },
  resolve: {
    alias: {
      '@angular-helpers/core/utils': here('./libs/core/utils/src/index.ts'),
      '@angular-helpers/core': here('./libs/core/src/index.ts'),
      '@angular-helpers/testing': here('./libs/testing/src/public-api.ts'),
      '@angular-helpers/storage/worker': here('./libs/storage/worker/src/index.ts'),
      '@angular-helpers/storage': here('./libs/storage/src/index.ts'),
      '@angular-helpers/browser-web-apis': here('./libs/browser-web-apis/src/index.ts'),
      '@analogjs/vitest-angular/setup-vitest': here(
        './node_modules/@analogjs/vitest-angular/setup-vitest.js',
      ),
      '@angular-helpers/worker-http/transport': here('./libs/worker-http/transport/src/index.ts'),
      '@angular-helpers/worker-http/serializer': here('./libs/worker-http/serializer/src/index.ts'),
      '@angular-helpers/worker-http/backend': here('./libs/worker-http/backend/src/index.ts'),
      '@angular-helpers/worker-http/interceptors': here(
        './libs/worker-http/interceptors/src/index.ts',
      ),
      '@angular-helpers/worker-http/crypto': here('./libs/worker-http/crypto/src/index.ts'),
      '@angular-helpers/worker-http/realtime': here('./libs/worker-http/realtime/src/index.ts'),
      '@angular-helpers/security/forms': here('./libs/security/forms/src/index.ts'),
      '@angular-helpers/security/signal-forms': here('./libs/security/signal-forms/src/index.ts'),
      '@angular-helpers/security': here('./libs/security/src/index.ts'),
      '@angular-helpers/browser-web-apis/experimental': here(
        './libs/browser-web-apis/experimental/src/index.ts',
      ),
      '@angular-helpers/openlayers/core': here('./libs/openlayers/core/src/index.ts'),
      '@angular-helpers/openlayers/layers': here('./libs/openlayers/layers/src/index.ts'),
      '@angular-helpers/openlayers/controls': here('./libs/openlayers/controls/src/index.ts'),
      '@angular-helpers/openlayers/interactions': here(
        './libs/openlayers/interactions/src/index.ts',
      ),
      '@angular-helpers/openlayers/overlays': here('./libs/openlayers/overlays/src/index.ts'),
    },
  },
});
