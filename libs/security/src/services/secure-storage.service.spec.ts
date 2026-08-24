import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { webcrypto } from 'node:crypto';
import { SecureStorageService, SECURE_STORAGE_CONFIG } from './secure-storage.service';

describe('SecureStorageService', () => {
  let service: SecureStorageService;

  beforeAll(() => {
    vi.stubGlobal('crypto', webcrypto);
  });

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        SecureStorageService,
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: SECURE_STORAGE_CONFIG, useValue: { storage: 'local', pbkdf2Iterations: 1000 } },
      ],
    });
    service = TestBed.inject(SecureStorageService);
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.resetTestingModule();
  });

  describe('isSupported', () => {
    it('returns true when in browser with webcrypto and localStorage', () => {
      expect(service.isSupported()).toBe(true);
    });

    it('returns false in server environment (SSR)', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [SecureStorageService, { provide: PLATFORM_ID, useValue: 'server' }],
      });
      const ssrService = TestBed.inject(SecureStorageService);
      expect(ssrService.isSupported()).toBe(false);
    });
  });

  describe('Ephemeral Mode (Default)', () => {
    it('encrypts, stores, and retrieves complex objects', async () => {
      const payload = { userId: 42, username: 'neo', roles: ['admin', 'operator'] };
      await service.set('user_profile', payload);

      // Verify raw storage contains encrypted payload (not plain JSON)
      const rawStored = localStorage.getItem('user_profile');
      expect(rawStored).toBeTruthy();
      const parsedStored = JSON.parse(rawStored!);
      expect(parsedStored).toHaveProperty('iv');
      expect(parsedStored).toHaveProperty('ct');
      expect(rawStored).not.toContain('neo');

      const retrieved = await service.get<typeof payload>('user_profile');
      expect(retrieved).toEqual(payload);
    });

    it('supports storing strings, numbers, and booleans', async () => {
      await service.set('str_key', 'hello');
      await service.set('num_key', 12345);
      await service.set('bool_key', true);

      expect(await service.get<string>('str_key')).toBe('hello');
      expect(await service.get<number>('num_key')).toBe(12345);
      expect(await service.get<boolean>('bool_key')).toBe(true);
    });

    it('throws TypeError when trying to set undefined', async () => {
      await expect(service.set('bad_key', undefined)).rejects.toThrow(TypeError);
    });

    it('returns null for non-existent key', async () => {
      const val = await service.get('does_not_exist');
      expect(val).toBeNull();
    });

    it('returns null when stored payload is invalid or corrupted', async () => {
      localStorage.setItem('corrupt_json', 'not json');
      expect(await service.get('corrupt_json')).toBeNull();

      localStorage.setItem('corrupt_schema', JSON.stringify({ wrong: 'schema' }));
      expect(await service.get('corrupt_schema')).toBeNull();

      localStorage.setItem('corrupt_ct', JSON.stringify({ iv: 'AAAA', ct: 'AAAA' }));
      expect(await service.get('corrupt_ct')).toBeNull();
    });

    it('supports namespaces for key isolation', async () => {
      await service.set('token', 'token_auth', 'auth');
      await service.set('token', 'token_api', 'api');

      expect(localStorage.getItem('auth:token')).toBeTruthy();
      expect(localStorage.getItem('api:token')).toBeTruthy();

      expect(await service.get('token', 'auth')).toBe('token_auth');
      expect(await service.get('token', 'api')).toBe('token_api');
    });

    it('removes individual keys with and without namespace', async () => {
      await service.set('key1', 'val1');
      await service.set('key2', 'val2', 'ns');

      service.remove('key1');
      expect(await service.get('key1')).toBeNull();

      service.remove('key2', 'ns');
      expect(await service.get('key2', 'ns')).toBeNull();
    });

    it('clears whole storage or only a specific namespace', async () => {
      await service.set('k1', 'v1', 'tenantA');
      await service.set('k2', 'v2', 'tenantA');
      await service.set('k1', 'v1', 'tenantB');
      await service.set('globalKey', 'vGlobal');

      service.clear('tenantA');
      expect(await service.get('k1', 'tenantA')).toBeNull();
      expect(await service.get('k2', 'tenantA')).toBeNull();
      expect(await service.get('k1', 'tenantB')).toBe('v1');
      expect(await service.get('globalKey')).toBe('vGlobal');

      service.clear();
      expect(await service.get('k1', 'tenantB')).toBeNull();
      expect(await service.get('globalKey')).toBeNull();
    });
  });

  describe('Passphrase Mode (PBKDF2)', () => {
    it('initializes key with passphrase and automatically manages salt in storage', async () => {
      await service.initWithPassphrase('my-secret-passphrase');

      const salt = localStorage.getItem('__ss_salt__');
      expect(salt).toBeTruthy();

      await service.set('persisted_key', { secret: 'data' });

      // Re-init with same passphrase reuses stored salt and decrypts data
      const newServiceInstance = TestBed.inject(SecureStorageService);
      await newServiceInstance.initWithPassphrase('my-secret-passphrase');
      const retrieved = await newServiceInstance.get<{ secret: string }>('persisted_key');
      expect(retrieved).toEqual({ secret: 'data' });
    });

    it('supports explicit base64 salt', async () => {
      const explicitSalt = btoa('16bytesrandomsalt');
      await service.initWithPassphrase('passphrase', explicitSalt);

      await service.set('key', 'val');
      expect(await service.get('key')).toBe('val');
    });

    it('fails decryption and returns null when wrong passphrase is provided', async () => {
      await service.initWithPassphrase('correct-passphrase');
      await service.set('vault_entry', 'confidential');

      await service.initWithPassphrase('wrong-passphrase');
      const result = await service.get('vault_entry');
      expect(result).toBeNull();
    });
  });

  describe('sessionStorage target & unsupported error handling', () => {
    it('uses sessionStorage when configured', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          SecureStorageService,
          { provide: PLATFORM_ID, useValue: 'browser' },
          { provide: SECURE_STORAGE_CONFIG, useValue: { storage: 'session' } },
        ],
      });
      const sessionService = TestBed.inject(SecureStorageService);

      await sessionService.set('session_key', 'session_value');
      expect(sessionStorage.getItem('session_key')).toBeTruthy();
      expect(localStorage.getItem('session_key')).toBeNull();
      expect(await sessionService.get('session_key')).toBe('session_value');
    });

    it('throws error when methods called in unsupported environment', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [SecureStorageService, { provide: PLATFORM_ID, useValue: 'server' }],
      });
      const ssrService = TestBed.inject(SecureStorageService);

      await expect(ssrService.initWithPassphrase('p')).rejects.toThrow(/not supported/);
      await expect(ssrService.set('k', 'v')).rejects.toThrow(/not supported/);
      await expect(ssrService.get('k')).rejects.toThrow(/not supported/);
      expect(() => ssrService.remove('k')).toThrow(/not supported/);
      expect(() => ssrService.clear()).toThrow(/not supported/);
    });
  });
});
