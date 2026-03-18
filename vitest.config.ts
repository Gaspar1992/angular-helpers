/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    // Global test setup
    globals: true,
    environment: 'jsdom', // DOM environment for browser API tests
    
    // Test files patterns
    include: [
      'packages/*/src/**/*.test.ts',
      'packages/*/src/**/*.spec.ts',
      'packages/*/tests/**/*.test.ts'
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      '**/*.d.ts'
    ],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './node_modules/.vitest/coverage',
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.spec.ts',
        'packages/*/tests/**'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    
    // Test timeout
    testTimeout: 10000,
    hookTimeout: 10000,
    
    // Setup files
    setupFiles: ['./test/setup.ts'],
    
    // Watch mode configuration
    watch: true,
    
    // Reporter configuration
    reporters: ['verbose', 'json'],
    
    // Output directory
    outputFile: {
      json: './node_modules/.vitest/results.json'
    }
  },
  
  // Resolve configuration for TypeScript paths
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@angular-helpers/browser-web-apis': resolve(__dirname, './packages/browser-web-apis/src'),
      '@angular-helpers/security': resolve(__dirname, './packages/security/src'),
      '@angular-helpers/shared': resolve(__dirname, './packages/shared/src')
    }
  },
  
  // Define global constants for tests
  define: {
    'process.env.NODE_ENV': '"test"'
  }
});
