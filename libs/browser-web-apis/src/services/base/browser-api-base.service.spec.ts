import '@angular/compiler';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Injectable, PLATFORM_ID } from '@angular/core';
import { BrowserApiBaseService } from './browser-api-base.service';
import { BROWSER_API_LOGGER, type BrowserApiLogger } from '../../tokens/logger.token';
import { BrowserCapabilityService, type BrowserCapabilityId } from '../browser-capability.service';

@Injectable()
class TestBrowserApiService extends BrowserApiBaseService {
  capability: BrowserCapabilityId | null = null;

  protected getApiName(): string {
    return 'TestApi';
  }

  override getCapabilityId(): BrowserCapabilityId | null {
    return this.capability;
  }

  public testEnsureSupported(): void {
    this.ensureSupported();
  }

  public testCreateError(message: string, cause?: unknown): Error {
    return this.createError(message, cause);
  }

  public testLogError(message: string, error?: unknown): void {
    this.logError(message, error);
  }

  public testLogWarn(message: string): void {
    this.logWarn(message);
  }

  public testLogInfo(message: string): void {
    this.logInfo(message);
  }

  public testLogDebug(message: string): void {
    this.logDebug(message);
  }
}

describe('BrowserApiBaseService', () => {
  let service: TestBrowserApiService;
  let mockLogger: BrowserApiLogger;
  let mockCapabilities: { isSupported: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockLogger = {
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
    };

    mockCapabilities = {
      isSupported: vi.fn().mockReturnValue(true),
    };

    TestBed.configureTestingModule({
      providers: [
        TestBrowserApiService,
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: BROWSER_API_LOGGER, useValue: mockLogger },
        { provide: BrowserCapabilityService, useValue: mockCapabilities },
      ],
    });

    service = TestBed.inject(TestBrowserApiService);
  });

  describe('isSupported', () => {
    it('returns true in browser when capability id is null', () => {
      service.capability = null;
      expect(service.isSupported()).toBe(true);
    });

    it('delegates to BrowserCapabilityService when capability id is provided', () => {
      service.capability = 'camera';
      mockCapabilities.isSupported.mockReturnValue(false);
      expect(service.isSupported()).toBe(false);
      expect(mockCapabilities.isSupported).toHaveBeenCalledWith('camera');

      mockCapabilities.isSupported.mockReturnValue(true);
      expect(service.isSupported()).toBe(true);
    });

    it('returns false when in server environment', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          TestBrowserApiService,
          { provide: PLATFORM_ID, useValue: 'server' },
          { provide: BROWSER_API_LOGGER, useValue: mockLogger },
          { provide: BrowserCapabilityService, useValue: mockCapabilities },
        ],
      });
      const serverService = TestBed.inject(TestBrowserApiService);
      expect(serverService.isSupported()).toBe(false);
    });
  });

  describe('ensureSupported', () => {
    it('succeeds without throwing when browser and capabilities match', () => {
      service.capability = 'camera';
      mockCapabilities.isSupported.mockReturnValue(true);
      expect(() => service.testEnsureSupported()).not.toThrow();
    });

    it('throws error when in server environment', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          TestBrowserApiService,
          { provide: PLATFORM_ID, useValue: 'server' },
          { provide: BROWSER_API_LOGGER, useValue: mockLogger },
          { provide: BrowserCapabilityService, useValue: mockCapabilities },
        ],
      });
      const serverService = TestBed.inject(TestBrowserApiService);
      expect(() => serverService.testEnsureSupported()).toThrow(
        'TestApi API not available in server environment',
      );
    });

    it('throws error when capability is not supported in browser', () => {
      service.capability = 'camera';
      mockCapabilities.isSupported.mockReturnValue(false);
      expect(() => service.testEnsureSupported()).toThrow(
        'TestApi API not supported in this browser',
      );
    });
  });

  describe('createError and logging', () => {
    it('attaches cause when provided in createError', () => {
      const cause = new Error('root cause');
      const err = service.testCreateError('failed operation', cause);
      expect(err.message).toBe('failed operation');
      expect((err as any).cause).toBe(cause);
    });

    it('delegates log messages with API prefix to logger', () => {
      service.testLogError('something broke', { code: 500 });
      expect(mockLogger.error).toHaveBeenCalledWith('[TestApi] something broke', { code: 500 });

      service.testLogWarn('deprecated call');
      expect(mockLogger.warn).toHaveBeenCalledWith('[TestApi] deprecated call');

      service.testLogInfo('connected');
      expect(mockLogger.info).toHaveBeenCalledWith('[TestApi] connected');

      service.testLogDebug('state tick');
      expect(mockLogger.debug).toHaveBeenCalledWith('[TestApi] state tick');
    });
  });
});
