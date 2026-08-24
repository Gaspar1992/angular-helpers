import { TestBed } from '@angular/core/testing';
import { RegexWorkerPoolService, REGEX_WORKER_CONFIG } from './regex-worker-pool.service';
import { injectWorkerPool } from '@angular-helpers/core';
import { vi, describe, it, expect, beforeEach } from 'vitest';

let mockExecute: ReturnType<typeof vi.fn>;
let mockTerminate: ReturnType<typeof vi.fn>;
let capturedOptions: any;

vi.mock('@angular-helpers/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@angular-helpers/core')>();
  return {
    ...actual,
    injectWorkerPool: vi.fn().mockImplementation((_url, options) => {
      capturedOptions = options;
      mockExecute = vi.fn();
      mockTerminate = vi.fn();
      return {
        execute: mockExecute,
        terminate: mockTerminate,
      };
    }),
  };
});

describe('RegexWorkerPoolService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should instantiate the worker pool with default workerUrl if no config is provided', () => {
    TestBed.configureTestingModule({
      providers: [RegexWorkerPoolService],
    });

    const service = TestBed.inject(RegexWorkerPoolService);
    expect(service).toBeDefined();
    expect(injectWorkerPool).toHaveBeenCalledTimes(1);
    const firstCallUrl = vi.mocked(injectWorkerPool).mock.calls[0][0];
    expect(firstCallUrl.toString()).toContain('assets/workers/regex.worker.js');
  });

  it('should instantiate the worker pool with config workerUrl when REGEX_WORKER_CONFIG is provided', () => {
    const customUrl = 'http://custom-host.com/custom-regex-worker.js';
    TestBed.configureTestingModule({
      providers: [
        RegexWorkerPoolService,
        {
          provide: REGEX_WORKER_CONFIG,
          useValue: { workerUrl: customUrl },
        },
      ],
    });

    const service = TestBed.inject(RegexWorkerPoolService);
    expect(service).toBeDefined();
    expect(injectWorkerPool).toHaveBeenCalledTimes(1);
    const firstCallUrl = vi.mocked(injectWorkerPool).mock.calls[0][0];
    expect(firstCallUrl.toString()).toBe(customUrl);
  });

  it('executeInWorker executes pool task and returns result', async () => {
    TestBed.configureTestingModule({
      providers: [RegexWorkerPoolService],
    });
    const service = TestBed.inject(RegexWorkerPoolService);

    mockExecute.mockResolvedValue({
      match: true,
      executionTime: 5,
      timeout: false,
    });

    const res = await service.executeInWorker('^[a-z]+$', 'hello', { timeout: 3000 });
    expect(mockExecute).toHaveBeenCalledWith(
      'regex-test',
      { pattern: '^[a-z]+$', text: 'hello', timeout: 3000 },
      3000,
    );
    expect(res).toEqual({ match: true, executionTime: 5, timeout: false });
  });

  it('executeInWorker handles timeout and errors correctly', async () => {
    TestBed.configureTestingModule({
      providers: [RegexWorkerPoolService],
    });
    const service = TestBed.inject(RegexWorkerPoolService);

    mockExecute.mockRejectedValue(new Error('Execution timeout'));
    const timeoutRes = await service.executeInWorker('^[a-z]+$', 'hello', {});
    expect(timeoutRes).toEqual({
      match: false,
      executionTime: 0,
      timeout: true,
      error: 'Execution timeout',
    });

    mockExecute.mockRejectedValue(new Error('Other worker error'));
    const errorRes = await service.executeInWorker('^[a-z]+$', 'hello', {});
    expect(errorRes).toEqual({
      match: false,
      executionTime: 0,
      timeout: false,
      error: 'Other worker error',
    });
  });

  it('fallbackExecutor handles regex-test correctly and catches invalid patterns', async () => {
    TestBed.configureTestingModule({
      providers: [RegexWorkerPoolService],
    });
    TestBed.inject(RegexWorkerPoolService);

    expect(capturedOptions.fallbackExecutor).toBeDefined();

    // Valid match
    const validMatch = await capturedOptions.fallbackExecutor('regex-test', {
      pattern: '^hello',
      text: 'hello world',
    });
    expect(validMatch.match).toBe(true);
    expect(validMatch.timeout).toBe(false);

    // Invalid pattern
    const invalidPattern = await capturedOptions.fallbackExecutor('regex-test', {
      pattern: '[invalid(',
      text: 'test',
    });
    expect(invalidPattern.match).toBe(false);
    expect(invalidPattern.error).toBeDefined();

    // Unknown type
    await expect(capturedOptions.fallbackExecutor('unknown-task', {})).rejects.toThrow(
      /Unknown task type/,
    );
  });

  it('terminates pool on ngOnDestroy', () => {
    TestBed.configureTestingModule({
      providers: [RegexWorkerPoolService],
    });
    const service = TestBed.inject(RegexWorkerPoolService);
    service.ngOnDestroy();
    expect(mockTerminate).toHaveBeenCalled();
  });
});
