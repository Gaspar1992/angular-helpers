import '@angular/compiler';
import { setupTestBed } from '@analogjs/vitest-angular/setup-testbed';
setupTestBed();

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { SecureMessageService, SecureMessageConfig, SecureMessage } from './secure-message.service';
import { WebCryptoService } from './web-crypto.service';

// Mock window with addEventListener/removeEventListener/postMessage + crypto.randomUUID
function makeMockDocument() {
  const mockWin = {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    postMessage: vi.fn(),
    crypto: { randomUUID: vi.fn().mockReturnValue('test-nonce-uuid') },
  };
  return {
    defaultView: mockWin,
    _win: mockWin,
  };
}

describe('SecureMessageService', () => {
  let service: SecureMessageService;
  let cryptoSpy: {
    generateHmacKey: ReturnType<typeof vi.fn>;
    sign: ReturnType<typeof vi.fn>;
    verify: ReturnType<typeof vi.fn>;
  };
  let mockDoc: ReturnType<typeof makeMockDocument>;
  let fakeKey: CryptoKey;

  beforeEach(async () => {
    fakeKey = await crypto.subtle.generateKey({ name: 'HMAC', hash: 'SHA-256' }, true, [
      'sign',
      'verify',
    ]);

    cryptoSpy = {
      generateHmacKey: vi.fn().mockResolvedValue(fakeKey),
      sign: vi.fn().mockResolvedValue('mock-signature'),
      verify: vi.fn().mockResolvedValue(true),
    };

    mockDoc = makeMockDocument();

    TestBed.configureTestingModule({
      providers: [
        SecureMessageService,
        { provide: WebCryptoService, useValue: cryptoSpy },
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: DOCUMENT, useValue: mockDoc },
      ],
    });

    service = TestBed.inject(SecureMessageService);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  // ─── 4.1 configure ────────────────────────────────────────────────────────
  it('should register window listener after configure()', () => {
    const config: SecureMessageConfig = {
      allowedOrigins: ['https://trusted.com'],
      signingKey: fakeKey,
    };
    service.configure(config);
    expect(mockDoc._win.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
  });

  // ─── 4.2 generateChannelKey ───────────────────────────────────────────────
  it('should return a CryptoKey from generateChannelKey()', async () => {
    const key = await service.generateChannelKey();
    expect(key).toBe(fakeKey);
    expect(cryptoSpy.generateHmacKey).toHaveBeenCalledWith('HMAC-SHA-256');
  });

  // ─── 4.3 send — builds signed envelope ───────────────────────────────────
  it('should call postMessage with a signed envelope on send()', async () => {
    const config: SecureMessageConfig = {
      allowedOrigins: ['https://trusted.com'],
      signingKey: fakeKey,
    };
    service.configure(config);

    const targetWindow = { postMessage: vi.fn() } as unknown as Window;
    await service.send(targetWindow, { msg: 'hello' }, 'https://trusted.com');

    expect(cryptoSpy.sign).toHaveBeenCalled();
    expect(targetWindow.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        __signed: true,
        payload: { msg: 'hello' },
        signature: 'mock-signature',
      }),
      'https://trusted.com',
    );
  });

  // ─── 4.4 send with '*' origin rejects ────────────────────────────────────
  it('should throw and NOT call postMessage when targetOrigin is "*"', async () => {
    const config: SecureMessageConfig = {
      allowedOrigins: ['https://trusted.com'],
      signingKey: fakeKey,
    };
    service.configure(config);

    const targetWindow = { postMessage: vi.fn() } as unknown as Window;
    await expect(service.send(targetWindow, {}, '*')).rejects.toThrow();
    expect(targetWindow.postMessage).not.toHaveBeenCalled();
  });

  // ─── 4.5 valid message emits + updates lastMessage ────────────────────────
  it('should emit on messages$() and update lastMessage() for a valid message', async () => {
    const config: SecureMessageConfig = {
      allowedOrigins: ['https://trusted.com'],
      signingKey: fakeKey,
    };
    service.configure(config);

    const handler = (
      mockDoc._win.addEventListener.mock.calls.find((c: string[]) => c[0] === 'message') as any
    )?.[1];
    expect(handler).toBeTruthy();

    let received: SecureMessage | undefined;
    service.messages$<{ text: string }>().subscribe((m) => (received = m));

    await handler({
      origin: 'https://trusted.com',
      data: {
        __signed: true,
        payload: { text: 'ok' },
        timestamp: Date.now(),
        nonce: 'abc',
        signature: 'mock-signature',
      },
    } as MessageEvent);

    expect(received).toMatchObject({ data: { text: 'ok' }, origin: 'https://trusted.com' });
    expect(service.lastMessage()()).toMatchObject({ data: { text: 'ok' } });
  });

  // ─── 4.6 non-whitelisted origin discarded ────────────────────────────────
  it('should discard messages from non-whitelisted origins', async () => {
    const config: SecureMessageConfig = {
      allowedOrigins: ['https://trusted.com'],
      signingKey: fakeKey,
    };
    service.configure(config);

    const handler = (
      mockDoc._win.addEventListener.mock.calls.find((c: string[]) => c[0] === 'message') as any
    )?.[1];
    await handler({ origin: 'https://evil.com', data: { __signed: true } } as MessageEvent);

    expect(service.lastMessage()()).toBeNull();
    expect(cryptoSpy.verify).not.toHaveBeenCalled();
  });

  // ─── 4.7 invalid signature discarded ─────────────────────────────────────
  it('should discard messages with invalid signature', async () => {
    cryptoSpy.verify.mockResolvedValue(false);
    const config: SecureMessageConfig = {
      allowedOrigins: ['https://trusted.com'],
      signingKey: fakeKey,
    };
    service.configure(config);

    const handler = (
      mockDoc._win.addEventListener.mock.calls.find((c: string[]) => c[0] === 'message') as any
    )?.[1];
    await handler({
      origin: 'https://trusted.com',
      data: { __signed: true, payload: {}, timestamp: Date.now(), nonce: 'x', signature: 'bad' },
    } as MessageEvent);

    expect(service.lastMessage()()).toBeNull();
  });

  // ─── 4.8 replay attack (timestamp > 30s) discarded ───────────────────────
  it('should discard messages with timestamp older than 30 seconds', async () => {
    const config: SecureMessageConfig = {
      allowedOrigins: ['https://trusted.com'],
      signingKey: fakeKey,
    };
    service.configure(config);

    const handler = (
      mockDoc._win.addEventListener.mock.calls.find((c: string[]) => c[0] === 'message') as any
    )?.[1];
    const staleTimestamp = Date.now() - 31_000;
    await handler({
      origin: 'https://trusted.com',
      data: {
        __signed: true,
        payload: {},
        timestamp: staleTimestamp,
        nonce: 'x',
        signature: 'mock-signature',
      },
    } as MessageEvent);

    expect(service.lastMessage()()).toBeNull();
    expect(cryptoSpy.verify).not.toHaveBeenCalled();
  });

  // ─── 4.9 SSR safety ───────────────────────────────────────────────────────
  it('should not register any listener when running in SSR (server platform)', () => {
    TestBed.resetTestingModule();
    const ssrDoc = makeMockDocument();
    TestBed.configureTestingModule({
      providers: [
        SecureMessageService,
        { provide: WebCryptoService, useValue: cryptoSpy },
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: DOCUMENT, useValue: ssrDoc },
      ],
    });
    const ssrService = TestBed.inject(SecureMessageService);
    ssrService.configure({ allowedOrigins: ['https://trusted.com'], signingKey: fakeKey });

    expect(ssrDoc._win.addEventListener).not.toHaveBeenCalled();
  });
});
