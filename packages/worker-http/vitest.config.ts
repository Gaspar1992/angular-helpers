import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@angular-helpers/worker-http/transport': resolve(__dirname, 'transport/src/index.ts'),
      '@angular-helpers/worker-http/serializer': resolve(__dirname, 'serializer/src/index.ts'),
      '@angular-helpers/worker-http/interceptors': resolve(__dirname, 'interceptors/src/index.ts'),
      '@angular-helpers/worker-http/crypto': resolve(__dirname, 'crypto/src/index.ts'),
      '@angular-helpers/worker-http/backend': resolve(__dirname, 'backend/src/index.ts'),
      '@angular-helpers/worker-http': resolve(__dirname, 'src/index.ts'),
    },
  },
  test: {
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.spec.ts'],
    exclude: ['**/node_modules/**'],
  },
});
