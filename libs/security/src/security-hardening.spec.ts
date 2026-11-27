import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  provideSecurity,
  withWebCrypto,
  withRateLimiter,
  withSessionIdle,
  injectRateLimiter,
  injectSessionIdle,
  WebCryptoService,
  JwtService,
  SessionIdleService,
} from './index';

describe('Security DX Hardening (T1)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });

  it('provideSecurity(with*()) registers only selected features for tree-shaking', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideSecurity(withWebCrypto(), withRateLimiter(), withSessionIdle()),
      ],
    });

    expect(TestBed.inject(WebCryptoService)).toBeTruthy();
    expect(TestBed.inject(SessionIdleService)).toBeTruthy();
    expect(TestBed.inject(JwtService, null, { optional: true })).toBeNull();
  });

  it('injectRateLimiter configures defaults and updates remaining signal', async () => {
    @Component({
      template: '',
    })
    class TestCmp {
      limiter = injectRateLimiter({
        defaults: {
          login: { type: 'sliding-window', max: 2, windowMs: 60_000 },
        },
      });
    }

    TestBed.configureTestingModule({
      imports: [TestCmp],
      providers: [provideZonelessChangeDetection(), provideSecurity(withRateLimiter())],
    });

    const fixture = TestBed.createComponent(TestCmp);
    const cmp = fixture.componentInstance;

    expect(cmp.limiter.remaining('login')()).toBe(2);
    expect(await cmp.limiter.tryConsume('login')).toBe(true);
    expect(cmp.limiter.remaining('login')()).toBe(1);
    expect(await cmp.limiter.tryConsume('login')).toBe(true);
    expect(cmp.limiter.remaining('login')()).toBe(0);
    expect(await cmp.limiter.tryConsume('login')).toBe(false);

    await cmp.limiter.reset('login');
    expect(cmp.limiter.remaining('login')()).toBe(2);
  });

  it('injectSessionIdle works zoneless and cleans up on component destroy', () => {
    @Component({
      template: '',
    })
    class IdleCmp {
      idle = injectSessionIdle({ timeoutMs: 3000, warningThresholdMs: 1500 });
    }

    TestBed.configureTestingModule({
      imports: [IdleCmp],
      providers: [provideZonelessChangeDetection(), provideSecurity(withSessionIdle())],
    });

    const fixture = TestBed.createComponent(IdleCmp);
    const cmp = fixture.componentInstance;
    const service = TestBed.inject(SessionIdleService);
    const stopSpy = vi.spyOn(service, 'stop');

    expect(cmp.idle.isIdle()).toBe(false);
    expect(cmp.idle.isWarning()).toBe(false);

    vi.advanceTimersByTime(2000);
    expect(cmp.idle.isWarning()).toBe(true);

    cmp.idle.reset();
    expect(cmp.idle.isWarning()).toBe(false);

    vi.advanceTimersByTime(3000);
    expect(cmp.idle.isIdle()).toBe(true);

    fixture.destroy();
    expect(stopSpy).toHaveBeenCalled();
  });
});
