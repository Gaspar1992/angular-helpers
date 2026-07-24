import '@angular/compiler';

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { SessionIdleService } from './session-idle.service';
import { SecureStorageService } from './secure-storage.service';
import { SensitiveClipboardService } from './sensitive-clipboard.service';
import { DOCUMENT } from '@angular/common';

describe('SessionIdleService', () => {
  let service: SessionIdleService;
  let secureStorageSpy: any;
  let clipboardSpy: any;
  let mockDocument: any;

  beforeEach(() => {
    vi.useFakeTimers();
    secureStorageSpy = { clear: vi.fn() };
    clipboardSpy = { clear: vi.fn() };
    mockDocument = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        SessionIdleService,
        { provide: SecureStorageService, useValue: secureStorageSpy },
        { provide: SensitiveClipboardService, useValue: clipboardSpy },
        { provide: DOCUMENT, useValue: mockDocument },
      ],
    });
    service = TestBed.inject(SessionIdleService);
  });

  afterEach(() => {
    service.stop();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with null state', () => {
    expect(service.isIdle()).toBe(false);
    expect(service.isWarning()).toBe(false);
    expect(service.timeRemaining()).toBeNull();
  });

  it('should set timeRemaining when started', () => {
    service.start({ timeoutMs: 10000 });
    expect(service.timeRemaining()).toBe(10000);
    expect(service.isIdle()).toBe(false);

    vi.advanceTimersByTime(2000);
    expect(service.timeRemaining()).toBe(8000);
  });

  it('should trigger warning when threshold is reached', () => {
    service.start({ timeoutMs: 10000, warningThresholdMs: 3000 });
    expect(service.isWarning()).toBe(false);

    vi.advanceTimersByTime(7000); // 3 seconds remaining
    expect(service.isWarning()).toBe(true);
  });

  it('should trigger timeout and idle state when time runs out', () => {
    let timeoutFired = false;
    service.onTimeout.subscribe(() => (timeoutFired = true));

    service.start({ timeoutMs: 5000 });

    vi.advanceTimersByTime(5000);
    expect(service.isIdle()).toBe(true);
    expect(service.timeRemaining()).toBe(0);
    expect(timeoutFired).toBe(true);
  });

  it('should reset timers on DOM event', () => {
    service.start({ timeoutMs: 5000 });

    vi.advanceTimersByTime(3000);
    expect(service.timeRemaining()).toBe(2000);

    // Simulate DOM event
    const addEventListenerCall = mockDocument.addEventListener.mock.calls.find(
      (c: any) => c[0] === 'mousemove',
    );
    const handler = addEventListenerCall?.[1];
    expect(handler).toBeTruthy();

    handler({ type: 'mousemove' } as any);

    // Check if reset
    vi.advanceTimersByTime(1000);
    expect(service.timeRemaining()).toBeGreaterThan(3800); // 5000 - 1000 = 4000
  });

  it('should manually reset when reset() is called', () => {
    service.start({ timeoutMs: 5000, warningThresholdMs: 2000 });

    vi.advanceTimersByTime(4000); // 1000ms left -> Warning state
    expect(service.isWarning()).toBe(true);

    service.reset();
    expect(service.timeRemaining()).toBe(5000);
    expect(service.isWarning()).toBe(false);
  });

  it('should clear secure storage if autoClearStorage is true', () => {
    service.start({ timeoutMs: 1000, autoClearStorage: true });

    vi.advanceTimersByTime(1000);
    expect(secureStorageSpy.clear).toHaveBeenCalled();
  });

  it('should not clear secure storage if autoClearStorage is false', () => {
    service.start({ timeoutMs: 1000, autoClearStorage: false });

    vi.advanceTimersByTime(1000);
    expect(secureStorageSpy.clear).not.toHaveBeenCalled();
  });
});
