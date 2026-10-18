import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { SearchService } from './search.service';
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

describe('SearchService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be created', () => {
    const service = TestBed.inject(SearchService);
    expect(service).toBeDefined();
  });

  it('should execute search in Web Worker and update results asynchronously', async () => {
    const mockResults = [
      {
        type: 'docs' as const,
        title: 'Angular Helper',
        description: 'Test description',
        url: '/test',
        icon: '🚀',
      },
    ];
    const executeMock = vi.fn().mockResolvedValue(mockResults);
    vi.mocked(injectWorkerPool).mockImplementation(
      () =>
        ({
          execute: executeMock,
          terminate: vi.fn(),
        }) as any,
    );

    const service = TestBed.inject(SearchService);
    service.query.set('angular');

    TestBed.flushEffects();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(executeMock).toHaveBeenCalledWith('search', { q: 'angular' });
    expect(service.results()).toEqual(mockResults);
  });

  it('should immediately return empty results without calling the worker if query is empty or whitespace', async () => {
    const executeMock = vi.fn();
    vi.mocked(injectWorkerPool).mockImplementation(
      () =>
        ({
          execute: executeMock,
          terminate: vi.fn(),
        }) as any,
    );

    const service = TestBed.inject(SearchService);
    service.query.set('   ');

    TestBed.flushEffects();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(executeMock).not.toHaveBeenCalled();
    expect(service.results()).toEqual([]);
  });

  it('should cancel previous stale task when rapid typing occurs', async () => {
    let resolveFirst: any;
    const firstPromise = new Promise((resolve) => {
      resolveFirst = resolve;
    });
    const secondPromise = Promise.resolve([
      {
        type: 'docs' as const,
        title: 'Angular Router',
        description: 'Test description',
        url: '/test',
        icon: '🚀',
      },
    ]);

    const executeMock = vi
      .fn()
      .mockImplementationOnce(() => firstPromise)
      .mockImplementationOnce(() => secondPromise);

    vi.mocked(injectWorkerPool).mockImplementation(
      () =>
        ({
          execute: executeMock,
          terminate: vi.fn(),
        }) as any,
    );

    const service = TestBed.inject(SearchService);

    service.query.set('a');
    TestBed.flushEffects();

    service.query.set('ab');
    TestBed.flushEffects();

    await secondPromise;
    resolveFirst([]);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(service.results()).toEqual([
      {
        type: 'docs' as const,
        title: 'Angular Router',
        description: 'Test description',
        url: '/test',
        icon: '🚀',
      },
    ]);
  });

  it('should set searching signal to true during execution and false when complete', async () => {
    let resolveSearch: any;
    const searchPromise = new Promise<any>((resolve) => {
      resolveSearch = resolve;
    });
    const executeMock = vi.fn().mockImplementation(() => searchPromise);
    vi.mocked(injectWorkerPool).mockImplementation(
      () =>
        ({
          execute: executeMock,
          terminate: vi.fn(),
        }) as any,
    );

    const service = TestBed.inject(SearchService);
    expect(service.searching()).toBe(false);

    service.query.set('angular');
    TestBed.flushEffects();

    expect(service.searching()).toBe(true);

    resolveSearch([]);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(service.searching()).toBe(false);
  });

  it('should fall back to synchronous execution in SSR environment', async () => {
    // Import actual injectWorkerPool so we can verify the actual fallback routing under PLATFORM_ID: 'server'
    const realInjectWorkerPool = await vi
      .importActual<typeof import('@angular-helpers/core')>('@angular-helpers/core')
      .then((m) => m.injectWorkerPool);

    vi.mocked(injectWorkerPool).mockImplementation(realInjectWorkerPool);

    TestBed.configureTestingModule({
      providers: [SearchService, { provide: PLATFORM_ID, useValue: 'server' }],
    });

    const service = TestBed.inject(SearchService);
    service.query.set('security');

    TestBed.flushEffects();
    // Wait for the synchronous microtask queue to process
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Results should be populated synchronously using the fallbackExecutor
    const results = service.results();
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].title.toLowerCase()).toContain('security');
  });

  it('should handle worker errors gracefully and reset searching state', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const executeMock = vi.fn().mockRejectedValue(new Error('Worker crashed'));
    vi.mocked(injectWorkerPool).mockImplementation(
      () =>
        ({
          execute: executeMock,
          terminate: vi.fn(),
        }) as any,
    );

    const service = TestBed.inject(SearchService);
    service.query.set('test-error');

    TestBed.flushEffects();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(consoleSpy).toHaveBeenCalled();
    expect(service.results()).toEqual([]);
    expect(service.searching()).toBe(false);
    consoleSpy.mockRestore();
  });

  it('should manage modal state via open, close, and toggle and test fallbackExecutor branches', async () => {
    let capturedFallback: ((type: string, data: any) => Promise<any>) | undefined;
    vi.mocked(injectWorkerPool).mockImplementation((_url, options: any) => {
      capturedFallback = options?.fallbackExecutor;
      return {
        execute: vi.fn().mockResolvedValue([]),
        terminate: vi.fn(),
      } as any;
    });

    const service = TestBed.inject(SearchService);
    expect(service.isOpen()).toBe(false);

    service.toggle();
    expect(service.isOpen()).toBe(true);
    expect(service.query()).toBe('');

    service.toggle();
    expect(service.isOpen()).toBe(false);

    service.open();
    expect(service.isOpen()).toBe(true);
    // Calling open again when extra index is already loaded hits early return
    service.open();
    service.close();
    expect(service.isOpen()).toBe(false);

    expect(capturedFallback).toBeDefined();
    await expect(capturedFallback!('invalid', {})).rejects.toThrow('Unknown task type: invalid');
    expect(await capturedFallback!('search', { q: '   ' })).toEqual([]);

    // Wait for dynamic imports in loadExtraIndex to settle, then search by tag/description
    await new Promise((resolve) => setTimeout(resolve, 20));
    const tagResults = await capturedFallback!('search', { q: 'worker' });
    expect(tagResults.length).toBeGreaterThan(0);

    const apiDocResults = await capturedFallback!('search', { q: 'injectPlatform' });
    expect(apiDocResults.some((item: any) => item.url === '/docs/core/inject-platform')).toBe(true);
  });
});
