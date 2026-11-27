// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { Tree } from '@angular-devkit/schematics';
import * as path from 'node:path';

describe('schematics hardening regressions', () => {
  const collectionPath = path.join(__dirname, '../../../dist/libs/schematics/collection.json');
  const runner = new SchematicTestRunner('@angular-helpers/schematics', collectionPath);

  it('does not collide on package name prefixes in tsconfig.json', async () => {
    const tree = Tree.empty();
    tree.create(
      'tsconfig.json',
      JSON.stringify({
        compilerOptions: {
          paths: {
            '@angular-helpers/worker-http': ['./libs/worker-http/src/index.ts'],
            '@angular-helpers/*': ['./libs/*/src/index.ts'],
          },
        },
      }),
    );

    const result = await runner.runSchematic('create-package', { name: 'worker' }, tree);
    const tsconfig = result.readContent('tsconfig.json');
    expect(tsconfig).toContain('"@angular-helpers/worker":');
    expect(result.exists('libs/worker/src/test-setup.ts')).toBe(false);
    expect(result.exists('libs/worker/vitest.config.ts')).toBe(false);
  });

  it('throws when target package directory already exists', async () => {
    const tree = Tree.empty();
    tree.create(
      'tsconfig.json',
      JSON.stringify({
        compilerOptions: { paths: { '@angular-helpers/*': ['./libs/*/src/index.ts'] } },
      }),
    );
    tree.create('libs/existing/package.json', '{}');

    await expect(runner.runSchematic('create-package', { name: 'existing' }, tree)).rejects.toThrow(
      'already exists',
    );
  });
});
