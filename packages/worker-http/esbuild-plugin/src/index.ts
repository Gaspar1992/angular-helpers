/**
 * esbuild plugin for @angular-helpers/worker-http
 *
 * Automatically bundles worker interceptors and injects them into the worker bootstrap.
 *
 * @example
 * ```typescript
 * // angular.json custom webpack config
 * import { workerHttpPlugin } from '@angular-helpers/worker-http/esbuild-plugin';
 *
 * export default {
 *   plugins: [
 *     workerHttpPlugin({
 *       interceptors: ['./src/interceptors/auth.ts'],
 *       autoDiscover: true
 *     })
 *   ]
 * };
 * ```
 */

export { workerHttpPlugin } from './plugin';
export type { WorkerHttpPluginOptions } from './plugin';
