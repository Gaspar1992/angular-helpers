import { describe, it, expect, beforeEach, vi } from 'vitest';
import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { WebStorageService, StorageOptions, StorageEvent } from './web-storage.service';
import { BrowserApiBaseService } from './base/browser-api-base.service';
import { NgZone } from '@angular/core';

// Mock dependencies
vi.mock('@angular/common', () => ({
  isPlatformBrowser: vi.fn(() => true)
}));

describe('WebStorageService', () => {
  let service: WebStorageService;
  let mockLocalStorage: any;
  let mockSessionStorage: any;
  let mockWindow: any;

  beforeEach(() => {
    mockLocalStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 5,
      [Symbol.iterator]: function* () {
        for (let i = 0; i < this.length; i++) {
          yield `key${i}`;
        }
      }
    };

    mockSessionStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 3,
      [Symbol.iterator]: function* () {
        for (let i = 0; i < this.length; i++) {
          yield `sessionKey${i}`;
        }
      }
    };

    mockWindow = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    };

    // Mock global browser objects
    global.localStorage = mockLocalStorage;
    global.sessionStorage = mockSessionStorage;
    global.window = mockWindow;
    global.navigator = { userAgent: 'test' } as any;

    TestBed.configureTestingModule({
      providers: [
        WebStorageService,
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: NgZone, useValue: { run: vi.fn((fn) => fn()) } }
      ]
    });
    service = TestBed.inject(WebStorageService);
  });

  describe('isStorageSupported', () => {
    it('should return true when localStorage is available', () => {
      expect(service.isStorageSupported()).toBe(true);
    });

    it('should return false when localStorage is not available', () => {
      global.localStorage = null as any;
      expect(service.isStorageSupported()).toBe(false);
    });
  });

  describe('localStorage operations', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should set item in localStorage', () => {
      const key = 'testKey';
      const value = { data: 'test' };
      const options: StorageOptions = { prefix: 'app' };

      mockLocalStorage.setItem.mockImplementation(() => {});

      const result = service.setLocalStorage(key, value, options);

      expect(result).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('app:testKey', JSON.stringify(value));
    });

    it('should get item from localStorage', () => {
      const key = 'testKey';
      const defaultValue = null;
      const mockValue = JSON.stringify({ data: 'test' });
      const options: StorageOptions = { prefix: 'app' };

      mockLocalStorage.getItem.mockReturnValue(mockValue);

      const result = service.getLocalStorage(key, defaultValue, options);

      expect(result).toEqual({ data: 'test' });
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('app:testKey');
    });

    it('should return default value when item does not exist', () => {
      const key = 'nonExistentKey';
      const defaultValue = 'default';
      const options: StorageOptions = { prefix: 'app' };

      mockLocalStorage.getItem.mockReturnValue(null);

      const result = service.getLocalStorage(key, defaultValue, options);

      expect(result).toBe(defaultValue);
    });

    it('should remove item from localStorage', () => {
      const key = 'testKey';
      const options: StorageOptions = { prefix: 'app' };

      mockLocalStorage.removeItem.mockImplementation(() => {});

      const result = service.removeLocalStorage(key, options);

      expect(result).toBe(true);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('app:testKey');
    });

    it('should clear all localStorage', () => {
      mockLocalStorage.clear.mockImplementation(() => {});

      const result = service.clearLocalStorage();

      expect(result).toBe(true);
      expect(mockLocalStorage.clear).toHaveBeenCalled();
    });

    it('should clear localStorage with prefix', () => {
      const prefix = 'app';
      const keys = ['app:key1', 'app:key2', 'other:key'];
      
      mockLocalStorage.key.mockImplementation((index) => keys[index]);
      mockLocalStorage.removeItem.mockImplementation(() => {});

      const result = service.clearLocalStorage(prefix);

      expect(result).toBe(true);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('app:key1');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('app:key2');
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalledWith('other:key');
    });
  });

  describe('sessionStorage operations', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should set item in sessionStorage', () => {
      const key = 'testKey';
      const value = { data: 'test' };
      const options: StorageOptions = { prefix: 'session' };

      mockSessionStorage.setItem.mockImplementation(() => {});

      const result = service.setSessionStorage(key, value, options);

      expect(result).toBe(true);
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('session:testKey', JSON.stringify(value));
    });

    it('should get item from sessionStorage', () => {
      const key = 'testKey';
      const defaultValue = null;
      const mockValue = JSON.stringify({ data: 'test' });
      const options: StorageOptions = { prefix: 'session' };

      mockSessionStorage.getItem.mockReturnValue(mockValue);

      const result = service.getSessionStorage(key, defaultValue, options);

      expect(result).toEqual({ data: 'test' });
      expect(mockSessionStorage.getItem).toHaveBeenCalledWith('session:testKey');
    });

    it('should remove item from sessionStorage', () => {
      const key = 'testKey';
      const options: StorageOptions = { prefix: 'session' };

      mockSessionStorage.removeItem.mockImplementation(() => {});

      const result = service.removeSessionStorage(key, options);

      expect(result).toBe(true);
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('session:testKey');
    });

    it('should clear all sessionStorage', () => {
      mockSessionStorage.clear.mockImplementation(() => {});

      const result = service.clearSessionStorage();

      expect(result).toBe(true);
      expect(mockSessionStorage.clear).toHaveBeenCalled();
    });
  });

  describe('utility methods', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should get localStorage size', () => {
      const mockStorage = {
        key1: 'value1',
        key2: 'value2'
      };
      
      // Mock localStorage behavior
      Object.defineProperty(mockLocalStorage, 'key1', {
        value: 'value1',
        enumerable: true
      });
      Object.defineProperty(mockLocalStorage, 'key2', {
        value: 'value2',
        enumerable: true
      });

      // Mock hasOwnProperty
      mockLocalStorage.hasOwnProperty = vi.fn((key) => key in mockStorage);

      const size = service.getLocalStorageSize();
      
      expect(size).toBeGreaterThan(0);
    });

    it('should get localStorage keys', () => {
      const keys = ['key1', 'key2', 'key3'];
      mockLocalStorage.key.mockImplementation((index) => keys[index]);

      const result = service.getLocalStorageKeys();

      expect(result).toEqual(keys);
    });

    it('should get localStorage keys with prefix', () => {
      const keys = ['app:key1', 'app:key2', 'other:key'];
      mockLocalStorage.key.mockImplementation((index) => keys[index]);

      const result = service.getLocalStorageKeys('app');

      expect(result).toEqual(['app:key1', 'app:key2']);
    });
  });

  describe('convenience methods', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should set user preferences', () => {
      const prefs = { theme: 'dark', language: 'es' };
      mockLocalStorage.setItem.mockImplementation(() => {});

      const result = service.setUserPreferences(prefs);

      expect(result).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('app:userPreferences', JSON.stringify(prefs));
    });

    it('should get user preferences', () => {
      const prefs = { theme: 'dark', language: 'es' };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(prefs));

      const result = service.getUserPreferences();

      expect(result).toEqual(prefs);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('app:userPreferences');
    });

    it('should set auth token', () => {
      const token = 'jwt-token-123';
      mockSessionStorage.setItem.mockImplementation(() => {});

      const result = service.setAuthToken(token);

      expect(result).toBe(true);
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('auth:authToken', token);
    });

    it('should get auth token', () => {
      const token = 'jwt-token-123';
      mockSessionStorage.getItem.mockReturnValue(token);

      const result = service.getAuthToken();

      expect(result).toBe(token);
      expect(mockSessionStorage.getItem).toHaveBeenCalledWith('auth:authToken');
    });

    it('should remove auth token', () => {
      mockSessionStorage.removeItem.mockImplementation(() => {});

      const result = service.removeAuthToken();

      expect(result).toBe(true);
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('auth:authToken');
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should handle localStorage setItem error', () => {
      const key = 'testKey';
      const value = { data: 'test' };
      
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      const result = service.setLocalStorage(key, value);

      expect(result).toBe(false);
    });

    it('should handle localStorage getItem error', () => {
      const key = 'testKey';
      const defaultValue = 'default';
      
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Access denied');
      });

      const result = service.getLocalStorage(key, defaultValue);

      expect(result).toBe(defaultValue);
    });

    it('should handle unsupported environment', () => {
      // Mock server environment
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          WebStorageService,
          { provide: PLATFORM_ID, useValue: 'server' }
        ]
      });
      const serverService = TestBed.inject(WebStorageService);

      const result = serverService.setLocalStorage('key', 'value');

      expect(result).toBe(false);
    });
  });
});
