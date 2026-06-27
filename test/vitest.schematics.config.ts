import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/schematics.spec.ts'],
    server: {
      deps: {
        inline: ['ora', '@angular-devkit/schematics', '@angular-devkit/core'],
      },
    },
  },
});
