import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/public-api.ts'),
      formats: ['es'],
      fileName: () => 'index.js',
    },
    outDir: 'dist/workers',
    emptyOutDir: true,
    rollupOptions: {
      external: ['@angular/core', '@angular/common', 'rxjs'],
    },
  },
});
