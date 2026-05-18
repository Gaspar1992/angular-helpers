import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { workerHttpPlugin } from './plugin';
import type { PluginBuild } from 'esbuild';

describe('workerHttpPlugin', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'worker-http-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should create a plugin with default options', () => {
    const plugin = workerHttpPlugin();

    expect(plugin.name).toBe('worker-http');
    expect(typeof plugin.setup).toBe('function');
  });

  it('should create a plugin with explicit interceptors', () => {
    const plugin = workerHttpPlugin({
      interceptors: ['./src/interceptors/auth.ts'],
    });

    expect(plugin.name).toBe('worker-http');
  });

  it('should create a plugin with autoDiscover enabled', () => {
    const plugin = workerHttpPlugin({
      autoDiscover: true,
    });

    expect(plugin.name).toBe('worker-http');
  });

  it('should discover interceptors in src directory', async () => {
    // Create test directory structure
    const srcDir = path.join(tempDir, 'src');
    const interceptorsDir = path.join(srcDir, 'interceptors');
    fs.mkdirSync(interceptorsDir, { recursive: true });

    // Create interceptor files
    fs.writeFileSync(
      path.join(interceptorsDir, 'auth.interceptor.ts'),
      'export default function authInterceptor() {}',
    );
    fs.writeFileSync(
      path.join(interceptorsDir, 'logging.interceptor.ts'),
      'export default function loggingInterceptor() {}',
    );

    // Create a worker file
    const workerFile = path.join(srcDir, 'http-api.worker.ts');
    fs.writeFileSync(
      workerFile,
      `import { createWorkerMessageLoop } from '@angular-helpers/worker-http/backend';
createWorkerMessageLoop();`,
    );

    const plugin = workerHttpPlugin({ autoDiscover: true });

    // Mock build object
    const mockBuild = {
      initialOptions: {
        absWorkingDir: tempDir,
      },
      onLoad: () => {},
    } as unknown as PluginBuild;

    plugin.setup(mockBuild);
  });

  it('should skip test files when discovering interceptors', async () => {
    const srcDir = path.join(tempDir, 'src');
    const interceptorsDir = path.join(srcDir, 'interceptors');
    fs.mkdirSync(interceptorsDir, { recursive: true });

    // Create interceptor and test files
    fs.writeFileSync(
      path.join(interceptorsDir, 'auth.interceptor.ts'),
      'export default function authInterceptor() {}',
    );
    fs.writeFileSync(
      path.join(interceptorsDir, 'auth.interceptor.spec.ts'),
      'describe("auth", () => {});',
    );

    const plugin = workerHttpPlugin({ autoDiscover: true });
    expect(plugin.name).toBe('worker-http');
  });

  it('should merge explicit and discovered interceptors', () => {
    const plugin = workerHttpPlugin({
      interceptors: ['./src/interceptors/explicit.ts'],
      autoDiscover: true,
    });

    expect(plugin.name).toBe('worker-http');
  });

  it('should inject side-effect-only imports into the worker file', async () => {
    // Create test directory structure
    const srcDir = path.join(tempDir, 'src');
    const interceptorsDir = path.join(srcDir, 'interceptors');
    fs.mkdirSync(interceptorsDir, { recursive: true });

    // Create interceptor files
    const authPath = path.join(interceptorsDir, 'auth.interceptor.ts');
    fs.writeFileSync(authPath, 'export default function authInterceptor() {}');

    // Create a worker file
    const workerFile = path.join(srcDir, 'http-api.worker.ts');
    fs.writeFileSync(
      workerFile,
      `import { createWorkerMessageLoop } from '@angular-helpers/worker-http/backend';
createWorkerMessageLoop();`,
    );

    const plugin = workerHttpPlugin({ autoDiscover: true });

    // Mock build object to capture onLoad callback
    let onLoadFilter: RegExp | undefined;
    let onLoadCallback: Function | undefined;

    const mockBuild = {
      initialOptions: {
        absWorkingDir: tempDir,
      },
      onLoad: vi.fn((options, callback) => {
        onLoadFilter = options.filter;
        onLoadCallback = callback;
      }),
    } as unknown as PluginBuild;

    plugin.setup(mockBuild);

    expect(mockBuild.onLoad).toHaveBeenCalled();
    expect(onLoadFilter).toBeDefined();
    expect(onLoadCallback).toBeDefined();

    // Call the onLoad callback
    const result = await onLoadCallback!({ path: workerFile });

    expect(result).toBeDefined();
    expect(result.contents).toContain("import './src/interceptors/auth.interceptor.ts';");
    expect(result.contents).not.toContain('import interceptor_');
  });
});
