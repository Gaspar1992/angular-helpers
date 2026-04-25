import type { Plugin } from 'esbuild';

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
      // TODO: Implement plugin logic
    },
  };
}
