import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { injectNetworkInformationResource } from './inject-network-information-resource';
import { vi } from 'vitest';

describe('injectNetworkInformationResource', () => {
  it('should create and return un-supported when not browser', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });
    TestBed.runInInjectionContext(() => {
      const net = injectNetworkInformationResource();
      expect(net.isSupported()).toBe(false);
    });
  });

  it('should create and return resource in browser context', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    TestBed.runInInjectionContext(() => {
      const net = injectNetworkInformationResource();
      expect(net.resource.status()).toBeDefined();
    });
  });
});
