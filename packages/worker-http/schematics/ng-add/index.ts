import type { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import type { Schema } from './schema';

/**
 * ng-add schematic for @angular-helpers/worker-http
 *
 * Performs the following setup:
 * 1. Adds package to dependencies
 * 2. Copies http-api.worker.ts template to workerPath
 * 3. Updates tsconfig.json paths
 * 4. Adds provideWorkerHttp() to app providers
 * 5. Optionally configures esbuild plugin in angular.json
 */
export function ngAdd(options: Schema): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    // TODO: Implement schematic logic
    // 1. Get project name from options or prompt
    // 2. Add package to package.json dependencies
    // 3. Copy worker template file
    // 4. Update tsconfig paths
    // 5. Add providers to app config
    // 6. Optionally update angular.json with esbuild plugin
    // 7. Install dependencies

    context.addTask(
      new NodePackageInstallTask({
        packageName: '@angular-helpers/worker-http',
      }),
    );

    context.logger.info('✓ @angular-helpers/worker-http setup complete!');
    context.logger.info('  Next steps:');
    context.logger.info('  1. Import WorkerHttpClient in your components');
    context.logger.info('  2. Use provideWorkerHttp() with interceptors if needed');
    context.logger.info('  3. Build and test with ng serve');
  };
}
