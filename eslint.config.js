import angularEslint from '@angular-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import angularTemplateEslint from '@angular-eslint/eslint-plugin-template';
import angularTemplateParser from '@angular-eslint/template-parser';

export default [
  {
    ignores: ['**/coverage/**', '**/dist/**', '**/node_modules/**'],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsparser,
    },
    plugins: {
      '@angular-eslint': angularEslint,
    },
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
    },
  },
  {
    files: ['packages/openlayers/**/*.ts'],
    languageOptions: {
      parser: tsparser,
    },
    plugins: {
      '@angular-eslint': angularEslint,
    },
    rules: {
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'ol', style: 'kebab-case' },
      ],
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'ol', style: 'camelCase' },
      ],
    },
  },
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsparser,
    },
    plugins: {
      '@angular-eslint': angularEslint,
    },
    rules: {
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],
    },
  },
  {
    files: ['packages/browser-web-apis/**/*.ts'],
    languageOptions: {
      parser: tsparser,
    },
    plugins: {
      '@angular-eslint': angularEslint,
    },
    rules: {
      '@angular-eslint/directive-selector': 'off',
    },
  },
  {
    files: [
      'packages/*/src/worker/**/*.ts',
      'packages/*/src/workers/**/*.ts',
      'src/workers/**/*.ts',
      '**/*.worker.ts',
    ],
    languageOptions: {
      parser: tsparser,
    },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@angular/core',
              message:
                'Web Workers must not import @angular/core to avoid dragging Angular compiler or lifecycle code into isolated background threads. Use pure TypeScript abstractions or interfaces.',
              allowTypeImports: true,
            },
            {
              name: '@angular/common',
              message: 'Web Workers must not import @angular/common.',
              allowTypeImports: true,
            },
            {
              name: '@angular/platform-browser',
              message: 'Web Workers must not import @angular/platform-browser.',
            },
            {
              name: '@angular/router',
              message: 'Web Workers must not import @angular/router.',
            },
            {
              name: '@angular/ssr',
              message: 'Web Workers must not import @angular/ssr.',
            },
          ],
          patterns: [
            {
              group: [
                '**/components/**',
                '**/directives/**',
                '**/services/*.service',
                '**/services/local-transport',
                '**/services/entity-store',
                '**/services/storage-transport',
              ],
              message:
                'Web Workers must not import UI components, directives, or Angular services since they carry heavy main-thread dependencies.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    languageOptions: {
      parser: angularTemplateParser,
    },
    plugins: {
      '@angular-eslint/template': angularTemplateEslint,
    },
    rules: {
      ...angularTemplateEslint.configs.recommended.rules,
    },
  },
];
