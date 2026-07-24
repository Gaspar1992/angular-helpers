/**
 * Options for the ng-add schematic
 */
export interface Schema {
  /**
   * Name of the project to target
   */
  project?: string;

  /**
   * Path where the worker file will be created
   * @default "src/app/workers/http-api.worker.ts"
   */
  workerPath?: string;

  /**
   * Whether to configure the esbuild plugin in angular.json
   * @default false
   */
  installEsbuildPlugin?: boolean;
}
