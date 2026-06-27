// @vitest-environment node
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { HostTree } from '@angular-devkit/schematics';
import * as path from 'node:path';
import { describe, it, expect } from 'vitest';

const collectionPath = path.join(__dirname, '../dist/packages/schematics/collection.json');

describe('create-package schematic', () => {
  it('should generate all template files and update tsconfig.json mappings', async () => {
    const runner = new SchematicTestRunner('schematics', collectionPath);

    const tree = new UnitTestTree(new HostTree());

    const tsconfigContent = JSON.stringify(
      {
        compilerOptions: {
          paths: {
            '@angular-helpers/*': ['./packages/*/src/index.ts'],
          },
        },
      },
      null,
      2,
    );
    tree.create('tsconfig.json', tsconfigContent);

    // Run the schematic
    const resultTree = await runner.runSchematic('create-package', { name: 'my-test-lib' }, tree);

    // Assert files are created
    expect(resultTree.files).toContain('/packages/my-test-lib/package.json');
    expect(resultTree.files).toContain('/packages/my-test-lib/ng-package.json');
    expect(resultTree.files).toContain('/packages/my-test-lib/tsconfig.json');
    expect(resultTree.files).toContain('/packages/my-test-lib/README.md');
    expect(resultTree.files).toContain('/packages/my-test-lib/vitest.config.ts');
    expect(resultTree.files).toContain('/packages/my-test-lib/src/index.ts');
    expect(resultTree.files).toContain('/packages/my-test-lib/src/public-api.ts');
    expect(resultTree.files).toContain('/packages/my-test-lib/src/test-setup.ts');
    expect(resultTree.files).toContain('/packages/my-test-lib/src/services/index.ts');
    expect(resultTree.files).toContain('/packages/my-test-lib/src/interfaces/index.ts');
    expect(resultTree.files).toContain('/packages/my-test-lib/src/utils/index.ts');
    expect(resultTree.files).toContain('/packages/my-test-lib/src/guards/index.ts');

    // Assert tsconfig.json has been updated
    const updatedTsconfig = JSON.parse(resultTree.readContent('tsconfig.json'));
    expect(updatedTsconfig.compilerOptions.paths['@angular-helpers/my-test-lib']).toEqual([
      './packages/my-test-lib/src/index.ts',
    ]);

    // Assert package.json has catalog dependencies
    const packageJson = JSON.parse(resultTree.readContent('/packages/my-test-lib/package.json'));
    expect(packageJson.dependencies['@angular/core']).toBe('catalog:');
    expect(packageJson.scripts['clean']).toBe('node ../../scripts/clean.js');
  });

  it('should validate package name', async () => {
    const runner = new SchematicTestRunner('schematics', collectionPath);
    const tree = new UnitTestTree(new HostTree());

    await expect(
      runner.runSchematic('create-package', { name: 'Invalid_Name' }, tree),
    ).rejects.toThrow();
  });
});
