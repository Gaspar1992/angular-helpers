import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CredentialManagementService } from './credential-management.service';
import { BrowserCapabilityService } from './browser-capability.service';

describe('CredentialManagementService', () => {
  let service: CredentialManagementService;
  let mockCredentials: any;

  beforeEach(() => {
    mockCredentials = {
      get: vi.fn().mockResolvedValue({ id: 'user@example.com', type: 'password' }),
      store: vi.fn().mockResolvedValue(undefined),
      create: vi.fn().mockResolvedValue({ id: 'created-cred', type: 'public-key' }),
      preventSilentAccess: vi.fn().mockResolvedValue(undefined),
    };

    class MockPublicKeyCredential {
      static isConditionalMediationAvailable = vi.fn().mockResolvedValue(true);
    }

    vi.stubGlobal('navigator', {
      credentials: mockCredentials,
    });
    vi.stubGlobal('PublicKeyCredential', MockPublicKeyCredential);

    TestBed.configureTestingModule({
      providers: [CredentialManagementService, BrowserCapabilityService],
    });
    service = TestBed.inject(CredentialManagementService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should be created and verify support', () => {
    expect(service).toBeTruthy();
    expect(service.isSupported()).toBe(true);
    expect(service.isPublicKeySupported()).toBe(true);
  });

  it('should get credential', async () => {
    const cred = await service.get({ password: true });
    expect(cred).toEqual({ id: 'user@example.com', type: 'password' });
    expect(mockCredentials.get).toHaveBeenCalledWith({ password: true });
  });

  it('should store credential', async () => {
    const cred = { id: 'u1', type: 'password' } as Credential;
    await service.store(cred);
    expect(mockCredentials.store).toHaveBeenCalledWith(cred);
  });

  it('should create password credential', async () => {
    const cred = await service.createPasswordCredential({ id: 'u1', password: 'p1' });
    expect(cred).toBeDefined();
    expect(mockCredentials.create).toHaveBeenCalled();
  });

  it('should create public key credential', async () => {
    const cred = await service.createPublicKeyCredential({
      challenge: new Uint8Array([1, 2, 3]),
      rp: { name: 'Test RP' },
      user: { id: new Uint8Array([1]), name: 'test', displayName: 'Test User' },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
    });
    expect(cred).toBeDefined();
    expect(mockCredentials.create).toHaveBeenCalled();
  });

  it('should prevent silent access', async () => {
    await service.preventSilentAccess();
    expect(mockCredentials.preventSilentAccess).toHaveBeenCalled();
  });

  it('should check if conditional mediation is available', async () => {
    const isAvail = await service.isConditionalMediationAvailable();
    expect(isAvail).toBe(true);
  });

  it('should handle unsupported environment', async () => {
    vi.stubGlobal('navigator', {});
    delete (window as any).PublicKeyCredential;
    delete (globalThis as any).PublicKeyCredential;

    expect(service.isSupported()).toBe(false);
    expect(service.isPublicKeySupported()).toBe(false);
    await expect(service.get()).rejects.toThrow('Credential Management API not supported');
    await expect(service.store({} as Credential)).rejects.toThrow(
      'Credential Management API not supported',
    );
    await expect(service.createPasswordCredential({ id: 'u', password: 'p' })).rejects.toThrow(
      'Credential Management API not supported',
    );
    await expect(service.createPublicKeyCredential({} as any)).rejects.toThrow(
      'PublicKeyCredential API not supported',
    );
    expect(await service.isConditionalMediationAvailable()).toBe(false);
  });
});
