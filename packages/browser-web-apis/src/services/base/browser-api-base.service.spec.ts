import { describe, it, expect, beforeEach, vi } from 'vitest';
import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { BrowserApiBaseService } from './browser-api-base.service';
import { PermissionsService } from '../permissions.service';
import { BrowserSupportUtil } from '../../utils/browser-support.util';

// Test implementation of BrowserApiBaseService
class TestBrowserApiService extends BrowserApiBaseService {
  protected override getApiName(): string {
    return 'test-api';
  }

  // Expose protected methods for testing
  public testIsSupported(): boolean {
    return this.isSupported();
  }

  public testIsBrowserEnvironment(): boolean {
    return this.isBrowserEnvironment();
  }

  public testIsServerEnvironment(): boolean {
    return this.isServerEnvironment();
  }

  public async testCheckPermission(permission: string): Promise<boolean> {
    return this.checkPermission(permission);
  }

  public async testRequestPermission(permission: string): Promise<boolean> {
    return this.requestPermission(permission);
  }

  public testCreateError(message: string, originalError?: any): Error {
    return this.createError(message, originalError);
  }

  public testLogWarning(message: string, ...args: any[]): void {
    this.logWarning(message, ...args);
  }

  public testLogError(message: string, ...args: any[]): void {
    this.logError(message, ...args);
  }

  public testLogInfo(message: string, ...args: any[]): void {
    this.logInfo(message, ...args);
  }

  public async testExecuteWithErrorHandling<T>(
    operation: () => Promise<T>,
    errorMessage?: string
  ): Promise<T> {
    return this.executeWithErrorHandling(operation, errorMessage);
  }

  public testExecuteSyncWithErrorHandling<T>(
    operation: () => T,
    errorMessage?: string
  ): T {
    return this.executeSyncWithErrorHandling(operation, errorMessage);
  }

  public testIsDestroyed(): boolean {
    return this.isDestroyed();
  }
}

// Mock dependencies
vi.mock('../../utils/browser-support.util', () => ({
  BrowserSupportUtil: {
    isSupported: vi.fn()
  }
}));

vi.mock('../../utils/ssr-safe.util', () => ({
}));

describe('BrowserApiBaseService', () => {
  let service: TestBrowserApiService;
  let mockPermissionsService: any;
  let mockDestroyRef: any;

  beforeEach(() => {
    mockPermissionsService = {
      isGranted: vi.fn(),
      request: vi.fn()
    };

    mockDestroyRef = {
      destroyed: false,
      onDestroy: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        TestBrowserApiService,
        { provide: PermissionsService, useValue: mockPermissionsService },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });

    service = TestBed.inject(TestBrowserApiService);
  });

  describe('isSupported', () => {
    it('should return BrowserSupportUtil result', () => {
      vi.mocked(BrowserSupportUtil.isSupported).mockReturnValue(true);

      const result = service.testIsSupported();

      expect(result).toBe(true);
      expect(BrowserSupportUtil.isSupported).toHaveBeenCalledWith('test-api');
    });

    it('should return false when BrowserSupportUtil returns false', () => {
      vi.mocked(BrowserSupportUtil.isSupported).mockReturnValue(false);

      const result = service.testIsSupported();

      expect(result).toBe(false);
    });
  });

  describe('isBrowserEnvironment', () => {
    it('should return true when in browser', () => {
      vi.mocked(isPlatformBrowser).mockReturnValue(true);

      const result = service.testIsBrowserEnvironment();

      expect(result).toBe(true);
      expect(isPlatformBrowser).toHaveBeenCalledWith('browser');
    });

    it('should return false when not in browser', () => {
      vi.mocked(isPlatformBrowser).mockReturnValue(false);

      const result = service.testIsBrowserEnvironment();

      expect(result).toBe(false);
    });
  });

  describe('isServerEnvironment', () => {
    it('should return true when in server', () => {
      vi.mocked(isPlatformServer).mockReturnValue(true);

      const result = service.testIsServerEnvironment();

      expect(result).toBe(true);
      expect(isPlatformServer).toHaveBeenCalledWith('browser');
    });

    it('should return false when not in server', () => {
      vi.mocked(isPlatformServer).mockReturnValue(false);

      const result = service.testIsServerEnvironment();

      expect(result).toBe(false);
    });
  });

  describe('checkPermission', () => {
    it('should check permission successfully', async () => {
      vi.mocked(BrowserSupportUtil.isSupported).mockReturnValue(true);
      mockPermissionsService.isGranted.mockResolvedValue(true);

      const result = await service.testCheckPermission('camera');

      expect(result).toBe(true);
      expect(mockPermissionsService.isGranted).toHaveBeenCalledWith('camera');
    });

    it('should return false when not supported', async () => {
      vi.mocked(BrowserSupportUtil.isSupported).mockReturnValue(false);

      const result = await service.testCheckPermission('camera');

      expect(result).toBe(false);
      expect(mockPermissionsService.isGranted).not.toHaveBeenCalled();
    });

    it('should handle permission check error', async () => {
      vi.mocked(BrowserSupportUtil.isSupported).mockReturnValue(true);
      mockPermissionsService.isGranted.mockRejectedValue(new Error('Permission error'));

      const result = await service.testCheckPermission('camera');

      expect(result).toBe(false);
    });
  });

  describe('requestPermission', () => {
    it('should request permission successfully', async () => {
      vi.mocked(BrowserSupportUtil.isSupported).mockReturnValue(true);
      mockPermissionsService.request.mockResolvedValue({ state: 'granted' });

      const result = await service.testRequestPermission('camera');

      expect(result).toBe(true);
      expect(mockPermissionsService.request).toHaveBeenCalledWith({ name: 'camera' });
    });

    it('should throw error when not supported', async () => {
      vi.mocked(BrowserSupportUtil.isSupported).mockReturnValue(false);

      await expect(service.testRequestPermission('camera')).rejects.toThrow(
        'test-api API not supported'
      );
    });

    it('should handle permission request error', async () => {
      vi.mocked(BrowserSupportUtil.isSupported).mockReturnValue(true);
      mockPermissionsService.request.mockRejectedValue(new Error('Request error'));

      const result = await service.testRequestPermission('camera');

      expect(result).toBe(false);
    });
  });

  describe('createError', () => {
    it('should create error with API name prefix', () => {
      const originalError = new Error('Original error');
      const error = service.testCreateError('Test message', originalError);

      expect(error.message).toBe('test-api: Test message');
      expect((error as any).originalError).toBe(originalError);
    });

    it('should create error without original error', () => {
      const error = service.testCreateError('Test message');

      expect(error.message).toBe('test-api: Test message');
      expect((error as any).originalError).toBeUndefined();
    });
  });

  describe('logging methods', () => {
    beforeEach(() => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(console, 'info').mockImplementation(() => {});
    });

    it('should log warning with API name prefix', () => {
      vi.mocked(isPlatformBrowser).mockReturnValue(true);

      service.testLogWarning('Test warning', 'arg1', 'arg2');

      expect(console.warn).toHaveBeenCalledWith('test-api: Test warning', 'arg1', 'arg2');
    });

    it('should not log warning in server environment', () => {
      vi.mocked(isPlatformBrowser).mockReturnValue(false);

      service.testLogWarning('Test warning');

      expect(console.warn).not.toHaveBeenCalled();
    });

    it('should log error with API name prefix', () => {
      vi.mocked(isPlatformBrowser).mockReturnValue(true);

      service.testLogError('Test error', 'arg1');

      expect(console.error).toHaveBeenCalledWith('test-api: Test error', 'arg1');
    });

    it('should log info with API name prefix', () => {
      vi.mocked(isPlatformBrowser).mockReturnValue(true);

      service.testLogInfo('Test info');

      expect(console.info).toHaveBeenCalledWith('test-api: Test info');
    });
  });

  describe('executeWithErrorHandling', () => {
    it('should execute operation successfully', async () => {
      const operation = vi.fn().mockResolvedValue('success');

      const result = await service.testExecuteWithErrorHandling(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalled();
    });

    it('should throw error when not supported', async () => {
      vi.mocked(BrowserSupportUtil.isSupported).mockReturnValue(false);
      const operation = vi.fn();

      await expect(service.testExecuteWithErrorHandling(operation)).rejects.toThrow(
        'API not supported or not available in current environment'
      );
      expect(operation).not.toHaveBeenCalled();
    });

    it('should throw custom error message', async () => {
      vi.mocked(BrowserSupportUtil.isSupported).mockReturnValue(true);
      const operation = vi.fn().mockRejectedValue(new Error('Operation failed'));

      await expect(
        service.testExecuteWithErrorHandling(operation, 'Custom error')
      ).rejects.toThrow('test-api: Custom error');
    });

    it('should throw default error message', async () => {
      vi.mocked(BrowserSupportUtil.isSupported).mockReturnValue(true);
      const operation = vi.fn().mockRejectedValue(new Error('Operation failed'));

      await expect(service.testExecuteWithErrorHandling(operation)).rejects.toThrow(
        'test-api: Operation failed'
      );
    });
  });

  describe('executeSyncWithErrorHandling', () => {
    it('should execute sync operation successfully', () => {
      const operation = vi.fn().mockReturnValue('success');

      const result = service.testExecuteSyncWithErrorHandling(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalled();
    });

    it('should throw error when not supported', () => {
      vi.mocked(BrowserSupportUtil.isSupported).mockReturnValue(false);
      const operation = vi.fn();

      expect(() => service.testExecuteSyncWithErrorHandling(operation)).toThrow(
        'API not supported or not available in current environment'
      );
      expect(operation).not.toHaveBeenCalled();
    });

    it('should throw custom error message', () => {
      vi.mocked(BrowserSupportUtil.isSupported).mockReturnValue(true);
      const operation = vi.fn().mockImplementation(() => {
        throw new Error('Operation failed');
      });

      expect(() => 
        service.testExecuteSyncWithErrorHandling(operation, 'Custom error')
      ).toThrow('test-api: Custom error');
    });
  });

  describe('isDestroyed', () => {
    it('should return destroyRef destroyed status', () => {
      mockDestroyRef.destroyed = false;

      const result = service.testIsDestroyed();

      expect(result).toBe(false);
    });

    it('should return true when destroyed', () => {
      mockDestroyRef.destroyed = true;

      const result = service.testIsDestroyed();

      expect(result).toBe(true);
    });
  });

  describe('initialize', () => {
    it('should initialize successfully', async () => {
      vi.mocked(isPlatformServer).mockReturnValue(false);
      vi.mocked(BrowserSupportUtil.isSupported).mockReturnValue(true);

      await service['initialize']();

      // Should not throw
      expect(true).toBe(true);
    });

    it('should log warning in server environment', async () => {
      vi.mocked(isPlatformServer).mockReturnValue(true);
      vi.spyOn(console, 'warn').mockImplementation(() => {});

      await service['initialize']();

      expect(console.warn).toHaveBeenCalledWith(
        'test-api: API not available in server environment'
      );
    });

    it('should log warning when not supported', async () => {
      vi.mocked(isPlatformServer).mockReturnValue(false);
      vi.mocked(BrowserSupportUtil.isSupported).mockReturnValue(false);
      vi.spyOn(console, 'warn').mockImplementation(() => {});

      await service['initialize']();

      expect(console.warn).toHaveBeenCalledWith(
        'test-api: API not supported in this browser'
      );
    });

    it('should handle initialization error', async () => {
      vi.mocked(isPlatformServer).mockReturnValue(false);
      vi.mocked(BrowserSupportUtil.isSupported).mockReturnValue(true);
      vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock onInitialize to throw error
      vi.spyOn(service, 'onInitialize' as any).mockRejectedValue(new Error('Init error'));

      await service['initialize']();

      expect(console.error).toHaveBeenCalledWith(
        'test-api: Error initializing test-api service:',
        expect.any(Error)
      );
    });
  });

  describe('dependency injection', () => {
    it('should inject required dependencies', () => {
      expect(service).toBeDefined();
      expect(mockPermissionsService).toBeDefined();
      expect(mockDestroyRef).toBeDefined();
    });

    it('should have platform ID injected', () => {
      expect(service['platformId']).toBe('browser');
    });
  });

  describe('abstract method implementation', () => {
    it('should require getApiName implementation', () => {
      expect(service.testIsSupported()).toBeDefined();
      expect(() => service.testCreateError('test')).not.toThrow();
    });
  });

  describe('error handling edge cases', () => {
    it('should handle null original error', () => {
      const error = service.testCreateError('Test message', null);

      expect(error.message).toBe('test-api: Test message');
      expect((error as any).originalError).toBeNull();
    });

    it('should handle undefined original error', () => {
      const error = service.testCreateError('Test message', undefined);

      expect(error.message).toBe('test-api: Test message');
      expect((error as any).originalError).toBeUndefined();
    });

    it('should handle complex original error', () => {
      const originalError = {
        code: 404,
        message: 'Not found',
        details: { reason: 'Missing' }
      };

      const error = service.testCreateError('Test message', originalError);

      expect(error.message).toBe('test-api: Test message');
      expect((error as any).originalError).toEqual(originalError);
    });
  });
});
