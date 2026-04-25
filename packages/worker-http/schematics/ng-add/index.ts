import type { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { NodePackageInstallTask, RunSchematicTask } from '@angular-devkit/schematics/tasks';
import { strings } from '@angular-devkit/core';
import * as path from 'node:path';
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
    const normalizedOptions = normalizeOptions(tree, options);

    // 1. Copy worker template file
    copyWorkerTemplate(tree, normalizedOptions);

    // 2. Update tsconfig.json paths
    updateTsConfig(tree);

    // 3. Add providers to app config
    await addProvidersToAppConfig(tree, normalizedOptions, context);

    // 4. Optionally update angular.json with esbuild plugin
    if (normalizedOptions.installEsbuildPlugin) {
      updateAngularJson(tree, normalizedOptions);
    }

    // 5. Schedule npm install
    context.addTask(
      new NodePackageInstallTask({
        packageName: '@angular-helpers/worker-http',
      }),
    );

    context.logger.info('✓ @angular-helpers/worker-http setup complete!');
    context.logger.info('  Worker created at: ' + normalizedOptions.workerPath);
    context.logger.info('  Next steps:');
    context.logger.info('  1. Import WorkerHttpClient in your components');
    context.logger.info('  2. Use provideWorkerHttpClient() with interceptors if needed');
    context.logger.info('  3. Build and test with ng serve');
  };
}

interface NormalizedOptions extends Schema {
  workerPath: string;
  project: string;
}

/**
 * Normalizes and validates the schematic options
 */
function normalizeOptions(tree: Tree, options: Schema): NormalizedOptions {
  const workerPath = options.workerPath ?? 'src/app/workers/http-api.worker.ts';
  const project = options.project ?? getDefaultProject(tree);

  return {
    ...options,
    workerPath,
    project,
  };
}

/**
 * Gets the default project name from angular.json
 */
function getDefaultProject(tree: Tree): string {
  const angularJson = readJson(tree, 'angular.json');
  const projects = Object.keys(angularJson.projects ?? {});

  if (projects.length === 0) {
    throw new Error('No projects found in angular.json');
  }

  // Return default project or first project
  return angularJson.defaultProject ?? projects[0];
}

/**
 * Copies the worker template to the target path
 */
function copyWorkerTemplate(tree: Tree, options: NormalizedOptions): void {
  const templatePath = path.join(__dirname, 'files', 'http-api.worker.ts.template');

  if (!tree.exists(templatePath)) {
    // Fallback: create worker file with basic content
    const workerContent = `import {
  createWorkerMessageLoop,
  type WorkerMessageLoopConfig,
} from '@angular-helpers/worker-http/backend';

/**
 * HTTP API Worker
 *
 * This worker handles HTTP requests off the main thread,
 * with configurable interceptors, serialization, and crypto.
 */
const config: WorkerMessageLoopConfig = {
  // Add custom interceptors here:
  // interceptors: [loggingInterceptor, authInterceptor],
};

createWorkerMessageLoop(config);
`;

    if (!tree.exists(options.workerPath)) {
      tree.create(options.workerPath, workerContent);
    }
    return;
  }

  // If file already exists, don't overwrite
  if (tree.exists(options.workerPath)) {
    return;
  }

  const templateContent = tree.read(templatePath);
  if (templateContent) {
    tree.create(options.workerPath, templateContent.toString());
  }
}

/**
 * Updates tsconfig.json with web worker lib
 */
function updateTsConfig(tree: Tree): void {
  const tsConfigPaths = ['tsconfig.json', 'tsconfig.app.json'];

  for (const tsConfigPath of tsConfigPaths) {
    if (!tree.exists(tsConfigPath)) {
      continue;
    }

    const tsConfig = readJson(tree, tsConfigPath);

    // Ensure compilerOptions exists
    tsConfig.compilerOptions = tsConfig.compilerOptions ?? {};

    // Add webworker lib if not present
    const lib = tsConfig.compilerOptions.lib ?? [];
    if (!lib.includes('webworker')) {
      lib.push('webworker');
      tsConfig.compilerOptions.lib = lib;
    }

    tree.overwrite(tsConfigPath, JSON.stringify(tsConfig, null, 2));
    break; // Only update the first found config
  }
}

/**
 * Adds provider imports and configuration to app.config.ts
 */
async function addProvidersToAppConfig(
  tree: Tree,
  options: NormalizedOptions,
  context: SchematicContext,
): Promise<void> {
  const appConfigPaths = [
    `projects/${options.project}/src/app/app.config.ts`,
    'src/app/app.config.ts',
    `projects/${options.project}/src/app/app.module.ts`,
    'src/app/app.module.ts',
  ];

  for (const configPath of appConfigPaths) {
    if (!tree.exists(configPath)) {
      continue;
    }

    let content = tree.read(configPath)?.toString() ?? '';

    // Check if already updated
    if (content.includes('provideWorkerHttpClient')) {
      context.logger.info(`Skipping ${configPath} - already configured`);
      return;
    }

    // Add import statement
    const importStatement = `import { provideWorkerHttpClient, withWorkerConfigs } from '@angular-helpers/worker-http/backend';`;
    if (!content.includes(importStatement)) {
      content = addImport(content, importStatement);
    }

    // Add worker URL import if using standalone
    const workerUrlImport = `import WorkerUrl from '${options.workerPath.replace('.ts', '')}';`;
    if (configPath.includes('app.config.ts') && !content.includes(workerUrlImport)) {
      // Skip this - worker URL will be inline in the config
    }

    // Add to providers array (for app.config.ts pattern)
    if (configPath.endsWith('app.config.ts')) {
      content = addProviderToConfig(content, options.workerPath);
    }

    tree.overwrite(configPath, content);
    context.logger.info(`Updated ${configPath}`);
    return;
  }

  context.logger.warn('Could not find app.config.ts or app.module.ts to update providers');
}

/**
 * Adds an import statement to the file content
 */
function addImport(content: string, importStatement: string): string {
  // Find the last import statement
  const lastImportMatch = content.match(/^import .*;$/gm);

  if (lastImportMatch) {
    const lastImport = lastImportMatch[lastImportMatch.length - 1];
    const insertIndex = content.lastIndexOf(lastImport) + lastImport.length;
    return content.slice(0, insertIndex) + '\n' + importStatement + content.slice(insertIndex);
  }

  // No imports found, add at the beginning
  return importStatement + '\n' + content;
}

/**
 * Adds the worker HTTP provider to the application config
 */
function addProviderToConfig(content: string, workerPath: string): string {
  const workerConfig = `provideWorkerHttpClient(
    withWorkerConfigs([
      {
        id: 'http',
        workerUrl: new URL('./workers/http-api.worker', import.meta.url),
        maxInstances: 2,
      },
    ]),
  ),`;

  // Find providers array and add the config
  const providersMatch = content.match(/providers:\s*\[([^\]]*)\]/s);

  if (providersMatch) {
    const providersContent = providersMatch[1];
    const newProvidersContent = providersContent.trim()
      ? `${providersContent.trim()}\n    ${workerConfig}`
      : workerConfig;

    return content.replace(providersMatch[0], `providers: [${newProvidersContent}]`);
  }

  // If no providers array found, look for export const appConfig
  const appConfigMatch = content.match(/export const appConfig[^=]*=\s*{/);
  if (appConfigMatch) {
    const insertIndex = content.indexOf('{', appConfigMatch.index) + 1;
    return (
      content.slice(0, insertIndex) +
      `\n  providers: [${workerConfig}],` +
      content.slice(insertIndex)
    );
  }

  return content;
}

/**
 * Updates angular.json with esbuild plugin configuration
 */
function updateAngularJson(tree: Tree, options: NormalizedOptions): void {
  if (!tree.exists('angular.json')) {
    return;
  }

  const angularJson = readJson(tree, 'angular.json');
  const project = angularJson.projects?.[options.project];

  if (!project) {
    return;
  }

  // Add esbuild plugin configuration to build architect
  const buildOptions = project.architect?.build?.options;
  if (buildOptions) {
    buildOptions.plugins = buildOptions.plugins ?? [];

    const pluginConfig = {
      path: '@angular-helpers/worker-http/esbuild-plugin',
      options: {
        autoDiscover: true,
      },
    };

    // Check if plugin already configured
    const hasPlugin = buildOptions.plugins.some(
      (p: { path?: string }) => p.path === pluginConfig.path,
    );

    if (!hasPlugin) {
      buildOptions.plugins.push(pluginConfig);
    }
  }

  tree.overwrite('angular.json', JSON.stringify(angularJson, null, 2));
}

/**
 * Reads and parses a JSON file from the tree
 */
function readJson(tree: Tree, path: string): Record<string, unknown> {
  const content = tree.read(path);
  if (!content) {
    throw new Error(`File not found: ${path}`);
  }
  return JSON.parse(content.toString()) as Record<string, unknown>;
}
