import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { injectNetworkInformationResource } from './inject-network-information-resource';

describe('injectNetworkInformationResource', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should throw when called outside injection context', () => {
    expect(() => injectNetworkInformationResource()).toThrow(/injectNetworkInformationResource/);
  });

  it('should create and emit fallback online state when not browser', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });
    const net = TestBed.runInInjectionContext(() => injectNetworkInformationResource());
    expect(net.isSupported()).toBe(false);

    TestBed.tick();
    await new Promise((r) => setTimeout(r, 0));
    TestBed.tick();

    expect(net.snapshot()).toEqual({ online: true });
    expect(net.online()).toBe(true);
    expect(net.effectiveType()).toBeUndefined();
    expect(net.downlink()).toBeUndefined();
    expect(net.rtt()).toBeUndefined();
    expect(net.type()).toBeUndefined();
    expect(net.saveData()).toBeUndefined();
  });

  it('should create and expose computed signals in browser context', async () => {
    vi.stubGlobal('navigator', {
      onLine: true,
      connection: {
        effectiveType: '4g',
        downlink: 10,
        rtt: 50,
        type: 'wifi',
        saveData: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    });

    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    const net = TestBed.runInInjectionContext(() => injectNetworkInformationResource());
    expect(net.isSupported()).toBe(true);

    TestBed.tick();
    await new Promise((r) => setTimeout(r, 0));
    TestBed.tick();

    expect(net.resource.status()).toBeDefined();
    expect(net.online()).toBe(true);
    expect(net.effectiveType()).toBe('4g');
    expect(net.downlink()).toBe(10);
    expect(net.rtt()).toBe(50);
    expect(net.type()).toBe('wifi');
    expect(net.saveData()).toBe(false);
  });
});
