import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Plugin, OnLoadArgs, OnLoadResult } from 'esbuild';

export interface WorkerHttpPluginOptions {
  /**
   * Explicit list of interceptor file paths to bundle into the worker.
   * Paths are relative to project root.
   * @example ['./src/interceptors/auth.ts', './src/interceptors/logging.ts']
   */
  interceptors?: string[];

  /**
   * Auto-discover interceptors by scanning src folders for files
   * matching the interceptor naming pattern.
   * Discovered interceptors are merged with explicit interceptors list.
   * @default false
   */
  autoDiscover?: boolean;
}

/**
 * esbuild plugin for worker-http that bundles interceptors into worker files.
 *
 * This plugin:
 * 1. Intercepts worker file builds
 * 2. Discovers interceptor files if autoDiscover is true
 * 3. Injects interceptor imports into the worker bootstrap
 * 4. Ensures interceptors are available in the worker's interceptor pipeline
 *
 * @param options - Plugin configuration
 * @returns esbuild Plugin
 *
 * @example
 * ```typescript
 * import { workerHttpPlugin } from '@angular-helpers/worker-http/esbuild-plugin';
 *
 * const config = {
 *   plugins: [
 *     workerHttpPlugin({
 *       autoDiscover: true,
 *     })
 *   ]
 * };
 * ```
 */
export function workerHttpPlugin(options: WorkerHttpPluginOptions = {}): Plugin {
  const { interceptors = [], autoDiscover = false } = options;

  return {
    name: 'worker-http',
    setup(build) {
      const filter = /\.worker\.(ts|js|mjs)$/;
      const discoveredInterceptors: string[] = [];

      // Auto-discover interceptors from src directory
      if (autoDiscover) {
        const rootDir = build.initialOptions.absWorkingDir ?? process.cwd();
        discoveredInterceptors.push(...discoverInterceptors(rootDir));
      }

      const allInterceptors = [...new Set([...interceptors, ...discoveredInterceptors])];

      // Intercept worker file loads to inject interceptor imports
      build.onLoad({ filter }, async (args: OnLoadArgs): Promise<OnLoadResult> => {
        let contents = await fs.promises.readFile(args.path, 'utf-8');

        if (allInterceptors.length > 0) {
          const importStatements = generateInterceptorImports(allInterceptors, args.path);
          contents = injectImports(contents, importStatements);
        }

        return {
          contents,
          loader: 'ts',
        };
      });
    },
  };
}

/**
 * Discovers interceptor files by scanning src directories.
 * Looks for files matching interceptor naming patterns
 * in TypeScript or JavaScript files.
 */
function discoverInterceptors(rootDir: string): string[] {
  const interceptors: string[] = [];
  const srcDir = path.join(rootDir, 'src');

  if (!fs.existsSync(srcDir)) {
    return interceptors;
  }

  scanDirectory(srcDir, interceptors, rootDir);
  return interceptors;
}

/**
 * Recursively scans a directory for interceptor files.
 */
function scanDirectory(dir: string, interceptors: string[], rootDir: string): void {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip node_modules and dist
      if (entry.name === 'node_modules' || entry.name === 'dist') {
        continue;
      }
      scanDirectory(fullPath, interceptors, rootDir);
    } else if (entry.isFile()) {
      const isInterceptorFile =
        /interceptor/i.test(entry.name) &&
        (entry.name.endsWith('.ts') || entry.name.endsWith('.js') || entry.name.endsWith('.mjs')) &&
        !entry.name.endsWith('.spec.ts') &&
        !entry.name.endsWith('.test.ts') &&
        !entry.name.endsWith('.d.ts');

      if (isInterceptorFile) {
        // Get relative path from project root
        const relativePath = path.relative(rootDir, fullPath);
        interceptors.push('./' + relativePath.replace(/\\/g, '/'));
      }
    }
  }
}

/**
 * Generates import statements for discovered interceptors.
 * Converts relative paths to valid import specifiers.
 */
function generateInterceptorImports(interceptorPaths: string[], workerFilePath: string): string[] {
  return interceptorPaths.map((interceptorPath, index) => {
    // Create a valid identifier from the path
    const identifier = `interceptor_${index}_${interceptorPath.replace(/[^a-zA-Z0-9]/g, '_')}`;
    return `import ${identifier} from '${interceptorPath}';`;
  });
}

/**
 * Injects import statements at the top of the worker file.
 * Preserves any existing imports.
 */
function injectImports(contents: string, importStatements: string[]): string {
  if (importStatements.length === 0) {
    return contents;
  }

  const imports = importStatements.join('\n');
  const marker = '// Auto-injected by worker-http esbuild plugin';

  // Check if already injected
  if (contents.includes(marker)) {
    return contents;
  }

  const injection = `${marker}\n${imports}\n`;

  // Find the first non-comment, non-whitespace line to insert before
  const lines = contents.split('\n');
  let insertIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Skip shebang, comments, and empty lines
    if (
      line.startsWith('#!') ||
      line.startsWith('//') ||
      line.startsWith('/*') ||
      line.startsWith('*') ||
      line === ''
    ) {
      insertIndex = i + 1;
      continue;
    }
    break;
  }

  lines.splice(insertIndex, 0, injection);
  return lines.join('\n');
}
