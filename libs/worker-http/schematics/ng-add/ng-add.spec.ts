// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { Tree } from '@angular-devkit/schematics';
import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('worker-http ng-add schematic', () => {
  const collectionPath = path.resolve(process.cwd(), 'dist/worker-http/schematics/collection.json');

  beforeAll(() => {
    if (!fs.existsSync(collectionPath)) {
      execSync('pnpm --filter @angular-helpers/worker-http run build:schematics', {
        stdio: 'inherit',
      });
    }
  });

  it('ng-add creates tsconfig.worker.json without polluting root tsconfig.json and handles nested providers', async () => {
    const runner = new SchematicTestRunner('@angular-helpers/worker-http', collectionPath);
    const tree = Tree.empty();
    tree.create(
      'angular.json',
      JSON.stringify({ projects: { app: { architect: { build: { options: {} } } } } }),
    );
    tree.create('tsconfig.json', JSON.stringify({ compilerOptions: { lib: ['es2024', 'dom'] } }));
    tree.create(
      'src/app/app.config.ts',
      `import { ApplicationConfig } from '@angular/core';\nexport const appConfig: ApplicationConfig = {\n  providers: [\n    provideRouter([])\n  ]\n};\n`,
    );

    const resultTree = await runner.runSchematic(
      'ng-add',
      { workerPath: 'src/app/custom/my.worker.ts' },
      tree,
    );

    expect(resultTree.exists('tsconfig.worker.json')).toBe(true);
    const rootTs = JSON.parse(resultTree.readContent('tsconfig.json'));
    expect(rootTs.compilerOptions.lib).not.toContain('webworker');

    const appConfig = resultTree.readContent('src/app/app.config.ts');
    expect(appConfig).toContain("new URL('./custom/my.worker', import.meta.url)");
    expect(appConfig).toContain('provideRouter([])');

    const workerFile = resultTree.readContent('src/app/custom/my.worker.ts');
    expect(workerFile).toContain('@angular-helpers/worker-http/backend');
  });
});
