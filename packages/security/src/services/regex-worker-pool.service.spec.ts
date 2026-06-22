import { TestBed } from '@angular/core/testing';
import { RegexWorkerPoolService, REGEX_WORKER_CONFIG } from './regex-worker-pool.service';
import { injectWorkerPool } from '@angular-helpers/core';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@angular-helpers/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@angular-helpers/core')>();
  return {
    ...actual,
    injectWorkerPool: vi.fn().mockImplementation((_url, _options) => {
      return {
        execute: vi.fn(),
        terminate: vi.fn(),
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
});
