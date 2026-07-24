import { TestBed } from '@angular/core/testing';
import { vi, describe, beforeEach, afterEach, it, expect } from 'vitest';
import {
  WebAuthnService,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from './web-authn.service';

describe('WebAuthnService', () => {
  let service: WebAuthnService;
  let originalCredentials: any;
  let originalPublicKeyCredential: any;

  beforeEach(() => {
    originalCredentials = navigator.credentials;
    originalPublicKeyCredential = (window as any).PublicKeyCredential;

    // Set up a mock PublicKeyCredential constructor/class
    const mockPublicKeyCredential = class {};
    (mockPublicKeyCredential as any).isUserVerifyingPlatformAuthenticatorAvailable = vi
      .fn()
      .mockResolvedValue(true);
    (window as any).PublicKeyCredential = mockPublicKeyCredential;

    // Set up mock navigator.credentials
    Object.defineProperty(navigator, 'credentials', {
      value: {
        create: vi.fn(),
        get: vi.fn(),
      },
      configurable: true,
      writable: true,
    });

    TestBed.configureTestingModule({
      providers: [WebAuthnService],
    });
    service = TestBed.inject(WebAuthnService);
  });

  afterEach(() => {
    if (originalCredentials) {
      Object.defineProperty(navigator, 'credentials', {
        value: originalCredentials,
        configurable: true,
        writable: true,
      });
    }
    if (originalPublicKeyCredential) {
      (window as any).PublicKeyCredential = originalPublicKeyCredential;
    } else {
      delete (window as any).PublicKeyCredential;
    }
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('base64url converters', () => {
    it('should convert ArrayBuffer to base64url string correctly', () => {
      const buffer = new Uint8Array([0, 1, 2, 3, 4, 255]).buffer;
      const base64url = service.bufferToBase64url(buffer);
      expect(base64url).toBe('AAECAwT_');
    });

    it('should convert base64url string to ArrayBuffer correctly', () => {
      const base64url = 'AAECAwT_';
      const buffer = service.base64urlToBuffer(base64url);
      const bytes = new Uint8Array(buffer);
      expect(Array.from(bytes)).toEqual([0, 1, 2, 3, 4, 255]);
    });

    it('should perform a successful roundtrip', () => {
      const originalText = 'Hello World WebAuthn! ~@#$%^&*()_+';
      const encoder = new TextEncoder();
      const originalBuffer = encoder.encode(originalText).buffer;

      const base64url = service.bufferToBase64url(originalBuffer);
      const decBuffer = service.base64urlToBuffer(base64url);
      const decoder = new TextDecoder();
      const decodedText = decoder.decode(decBuffer);

      expect(decodedText).toBe(originalText);
    });
  });

  describe('isSupported', () => {
    it('should return true if navigator.credentials and PublicKeyCredential exist', () => {
      expect(service.isSupported()).toBe(true);
    });

    it('should return false if PublicKeyCredential is not defined', () => {
      delete (window as any).PublicKeyCredential;
      expect(service.isSupported()).toBe(false);
    });
  });

  describe('isPlatformAuthenticatorAvailable', () => {
    it('should return the result of PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable', async () => {
      const result = await service.isPlatformAuthenticatorAvailable();
      expect(result).toBe(true);
      expect(PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable).toHaveBeenCalled();
    });

    it('should return false if not supported', async () => {
      delete (window as any).PublicKeyCredential;
      const result = await service.isPlatformAuthenticatorAvailable();
      expect(result).toBe(false);
    });
  });

  describe('register', () => {
    it('should call credentials.create with converted binary parameters and return JSON response', async () => {
      const mockChallengeBase64 = 'Y2hhbGxlbmdl'; // "challenge" in base64url
      const mockUserIdBase64 = 'dXNlcmlk'; // "userid" in base64url
      const mockRawId = new Uint8Array([9, 8, 7]).buffer;
      const mockClientData = new Uint8Array([1, 2, 3]).buffer;
      const mockAttestation = new Uint8Array([4, 5, 6]).buffer;

      const options: PublicKeyCredentialCreationOptionsJSON = {
        challenge: mockChallengeBase64,
        rp: { name: 'Test RP', id: 'test.com' },
        user: {
          id: mockUserIdBase64,
          name: 'testuser',
          displayName: 'Test User',
        },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
        excludeCredentials: [{ id: 'ZXhjbHVkZQ', type: 'public-key' }], // "exclude" in base64url
      };

      const mockCredential = {
        id: 'credId123',
        rawId: mockRawId,
        type: 'public-key',
        response: {
          clientDataJSON: mockClientData,
          attestationObject: mockAttestation,
          getTransports: () => ['internal' as AuthenticatorTransport],
        },
        getClientExtensionResults: () => ({}),
        authenticatorAttachment: 'platform' as AuthenticatorAttachment,
      };

      (navigator.credentials.create as any).mockResolvedValue(mockCredential);

      const result = await service.register(options);

      expect(navigator.credentials.create).toHaveBeenCalled();
      const callArgs = (navigator.credentials.create as any).mock.calls[0][0].publicKey;

      expect(callArgs.challenge).toBeInstanceOf(ArrayBuffer);
      expect(new Uint8Array(callArgs.challenge)).toEqual(
        new Uint8Array([99, 104, 97, 108, 108, 101, 110, 103, 101]),
      ); // "challenge"

      expect(callArgs.user.id).toBeInstanceOf(ArrayBuffer);
      expect(new Uint8Array(callArgs.user.id)).toEqual(
        new Uint8Array([117, 115, 101, 114, 105, 100]),
      ); // "userid"

      expect(callArgs.excludeCredentials[0].id).toBeInstanceOf(ArrayBuffer);
      expect(new Uint8Array(callArgs.excludeCredentials[0].id)).toEqual(
        new Uint8Array([101, 120, 99, 108, 117, 100, 101]),
      ); // "exclude"

      expect(result.id).toBe('credId123');
      expect(result.rawId).toBe(service.bufferToBase64url(mockRawId));
      expect(result.response.clientDataJSON).toBe(service.bufferToBase64url(mockClientData));
      expect(result.response.attestationObject).toBe(service.bufferToBase64url(mockAttestation));
      expect(result.response.transports).toEqual(['internal']);
      expect(result.authenticatorAttachment).toBe('platform');
    });

    it('should throw an error if credential creation returns null', async () => {
      (navigator.credentials.create as any).mockResolvedValue(null);

      const options: PublicKeyCredentialCreationOptionsJSON = {
        challenge: 'Y2hhbGxlbmdl',
        rp: { name: 'Test RP', id: 'test.com' },
        user: { id: 'dXNlcmlk', name: 'testuser', displayName: 'Test User' },
        pubKeyCredParams: [],
      };

      await expect(service.register(options)).rejects.toThrow(
        'Credential creation failed or was cancelled.',
      );
    });
  });

  describe('authenticate', () => {
    it('should call credentials.get with converted binary parameters and return JSON response', async () => {
      const mockChallengeBase64 = 'Y2hhbGxlbmdl';
      const mockRawId = new Uint8Array([9, 8, 7]).buffer;
      const mockClientData = new Uint8Array([1, 2, 3]).buffer;
      const mockAuthData = new Uint8Array([10, 11, 12]).buffer;
      const mockSignature = new Uint8Array([20, 21, 22]).buffer;
      const mockUserHandle = new Uint8Array([30, 31, 32]).buffer;

      const options: PublicKeyCredentialRequestOptionsJSON = {
        challenge: mockChallengeBase64,
        allowCredentials: [{ id: 'YWxsb3c', type: 'public-key' }], // "allow" in base64url
      };

      const mockCredential = {
        id: 'credId123',
        rawId: mockRawId,
        type: 'public-key',
        response: {
          clientDataJSON: mockClientData,
          authenticatorData: mockAuthData,
          signature: mockSignature,
          userHandle: mockUserHandle,
        },
        getClientExtensionResults: () => ({}),
        authenticatorAttachment: 'cross-platform' as AuthenticatorAttachment,
      };

      (navigator.credentials.get as any).mockResolvedValue(mockCredential);

      const result = await service.authenticate(options);

      expect(navigator.credentials.get).toHaveBeenCalled();
      const callArgs = (navigator.credentials.get as any).mock.calls[0][0].publicKey;

      expect(callArgs.challenge).toBeInstanceOf(ArrayBuffer);
      expect(new Uint8Array(callArgs.challenge)).toEqual(
        new Uint8Array([99, 104, 97, 108, 108, 101, 110, 103, 101]),
      );

      expect(callArgs.allowCredentials[0].id).toBeInstanceOf(ArrayBuffer);
      expect(new Uint8Array(callArgs.allowCredentials[0].id)).toEqual(
        new Uint8Array([97, 108, 108, 111, 119]),
      );

      expect(result.id).toBe('credId123');
      expect(result.rawId).toBe(service.bufferToBase64url(mockRawId));
      expect(result.response.clientDataJSON).toBe(service.bufferToBase64url(mockClientData));
      expect(result.response.authenticatorData).toBe(service.bufferToBase64url(mockAuthData));
      expect(result.response.signature).toBe(service.bufferToBase64url(mockSignature));
      expect(result.response.userHandle).toBe(service.bufferToBase64url(mockUserHandle));
      expect(result.authenticatorAttachment).toBe('cross-platform');
    });

    it('should throw an error if credential assertion returns null', async () => {
      (navigator.credentials.get as any).mockResolvedValue(null);

      const options: PublicKeyCredentialRequestOptionsJSON = {
        challenge: 'Y2hhbGxlbmdl',
      };

      await expect(service.authenticate(options)).rejects.toThrow(
        'Credential assertion failed or was cancelled.',
      );
    });
  });
});
