import { configDefaults, defineConfig } from 'vitest/config';
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
  optimizeDeps: {
    disabled: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    reporters: process.env.CI ? ['default', 'github-actions', 'junit'] : ['default'],
    outputFile: {
      junit: './coverage/junit.xml',
    },
    setupFiles: [here('./apps/web/src/test-setup.ts')],
    include: ['libs/**/*.spec.ts', 'apps/web/src/**/*.spec.ts'],
    exclude: [...configDefaults.exclude, 'libs/**/schematics/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'json-summary', 'lcov'],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 75,
        statements: 90,
        'libs/core/**/*.ts': {
          lines: 95,
          functions: 95,
          branches: 90,
          statements: 95,
        },
        'libs/testing/src/**/*.ts': {
          lines: 90,
          functions: 90,
          branches: 85,
          statements: 90,
        },
        'libs/yjs/src/**/*.ts': {
          lines: 95,
          functions: 95,
          branches: 85,
          statements: 95,
        },
        'libs/storage/**/*.ts': {
          lines: 90,
          functions: 90,
          branches: 80,
          statements: 90,
        },
        'libs/security/**/*.ts': {
          lines: 90,
          functions: 90,
          branches: 85,
          statements: 90,
        },
        'libs/worker-http/**/*.ts': {
          lines: 90,
          functions: 90,
          branches: 75,
          statements: 90,
        },
        'libs/openlayers/**/*.ts': {
          lines: 90,
          functions: 90,
          branches: 70,
          statements: 90,
        },
        'libs/browser-web-apis/**/*.ts': {
          lines: 85,
          functions: 85,
          branches: 75,
          statements: 85,
        },
        'apps/web/src/**/*.ts': {
          lines: 85,
          functions: 85,
          branches: 80,
          statements: 85,
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
      '@angular-helpers/browser-web-apis/experimental': here(
        './libs/browser-web-apis/experimental/src/index.ts',
      ),
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
      '@angular-helpers/worker-http/streams-polyfill': here(
        './libs/worker-http/streams-polyfill/src/index.ts',
      ),
      '@angular-helpers/worker-http/esbuild-plugin': here(
        './libs/worker-http/esbuild-plugin/src/index.ts',
      ),
      '@angular-helpers/worker-http': here('./libs/worker-http/src/index.ts'),
      '@angular-helpers/security/forms': here('./libs/security/forms/src/index.ts'),
      '@angular-helpers/security/signal-forms': here('./libs/security/signal-forms/src/index.ts'),
      '@angular-helpers/security': here('./libs/security/src/index.ts'),
      '@angular-helpers/openlayers/core': here('./libs/openlayers/core/src/index.ts'),
      '@angular-helpers/openlayers/layers': here('./libs/openlayers/layers/src/index.ts'),
      '@angular-helpers/openlayers/controls': here('./libs/openlayers/controls/src/index.ts'),
      '@angular-helpers/openlayers/interactions': here(
        './libs/openlayers/interactions/src/index.ts',
      ),
      '@angular-helpers/openlayers/overlays': here('./libs/openlayers/overlays/src/index.ts'),
      '@angular-helpers/openlayers/testing': here('./libs/openlayers/testing/src/index.ts'),
      '@angular-helpers/openlayers': here('./libs/openlayers/src/index.ts'),
      '@angular-helpers/yjs': here('./libs/yjs/src/index.ts'),
    },
  },
});
