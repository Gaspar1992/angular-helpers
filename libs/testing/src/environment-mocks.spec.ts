import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  MockResizeObserver,
  MockIntersectionObserver,
  mockWebCrypto,
  mockResizeObserver,
  mockIntersectionObserver,
  mockBroadcastChannel,
  mockIndexedDB,
  setupHeadlessBrowserMocks,
} from './environment-mocks';

describe('Headless Environment Mocks', () => {
  describe('MockResizeObserver', () => {
    let cleanup: () => void;

    beforeEach(() => {
      cleanup = mockResizeObserver();
    });

    afterEach(() => {
      cleanup();
    });

    it('should observe, unobserve, and trigger callbacks', () => {
      const callback = vi.fn();
      const observer = new ResizeObserver(callback);
      const element = document.createElement('div');

      observer.observe(element);
      expect((observer as unknown as MockResizeObserver).elements.has(element)).toBe(true);

      (observer as unknown as MockResizeObserver).trigger([{ target: element }]);
      expect(callback).toHaveBeenCalledWith([{ target: element }], observer);

      observer.unobserve(element);
      expect((observer as unknown as MockResizeObserver).elements.has(element)).toBe(false);

      observer.disconnect();
    });

    it('triggerAll should invoke all active observers', () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      new ResizeObserver(cb1);
      new ResizeObserver(cb2);

      MockResizeObserver.triggerAll([]);
      expect(cb1).toHaveBeenCalled();
      expect(cb2).toHaveBeenCalled();
    });
  });

  describe('MockIntersectionObserver', () => {
    let cleanup: () => void;

    beforeEach(() => {
      cleanup = mockIntersectionObserver();
    });

    afterEach(() => {
      cleanup();
    });

    it('should observe, takeRecords and trigger callbacks', () => {
      const callback = vi.fn();
      const observer = new IntersectionObserver(callback, { threshold: [0.5] });
      const element = document.createElement('div');

      observer.observe(element);
      expect((observer as unknown as MockIntersectionObserver).elements.has(element)).toBe(true);
      expect(observer.takeRecords()).toEqual([]);

      (observer as unknown as MockIntersectionObserver).trigger([{ isIntersecting: true }]);
      expect(callback).toHaveBeenCalledWith([{ isIntersecting: true }], observer);

      observer.unobserve(element);
      expect((observer as unknown as MockIntersectionObserver).elements.has(element)).toBe(false);

      observer.disconnect();
    });
  });

  describe('MockBroadcastChannel', () => {
    let cleanup: () => void;

    beforeEach(() => {
      cleanup = mockBroadcastChannel();
    });

    afterEach(() => {
      cleanup();
    });

    it('should transmit messages between sibling channels with the same name', () => {
      const ch1 = new BroadcastChannel('test-room');
      const ch2 = new BroadcastChannel('test-room');
      const received: unknown[] = [];

      ch2.onmessage = (event) => {
        received.push(event.data);
      };

      ch1.postMessage({ hello: 'world' });
      expect(received).toEqual([{ hello: 'world' }]);

      ch1.close();
      ch2.close();
    });

    it('should not cross messages across different channel names', () => {
      const ch1 = new BroadcastChannel('room-a');
      const ch2 = new BroadcastChannel('room-b');
      const received: unknown[] = [];

      ch2.onmessage = (event) => {
        received.push(event.data);
      };

      ch1.postMessage({ hello: 'world' });
      expect(received).toEqual([]);

      ch1.close();
      ch2.close();
    });
  });

  describe('mockWebCrypto', () => {
    it('ensures subtle crypto is available', () => {
      mockWebCrypto();
      expect(globalThis.crypto).toBeDefined();
      expect(globalThis.crypto.subtle).toBeDefined();
    });
  });

  describe('mockIndexedDB', () => {
    it('installs safe IDBFactory and restores on cleanup', () => {
      const cleanup = mockIndexedDB();
      expect(globalThis.indexedDB).toBeDefined();
      const req = globalThis.indexedDB.open('test-db');
      expect(req).toBeDefined();
      expect(globalThis.indexedDB.cmp(1, 2)).toBe(-1);
      cleanup();
    });
  });

  describe('setupHeadlessBrowserMocks', () => {
    it('installs all mocks and returns cleanup function', () => {
      const cleanup = setupHeadlessBrowserMocks();
      expect(globalThis.ResizeObserver).toBeDefined();
      expect(globalThis.IntersectionObserver).toBeDefined();
      expect(globalThis.BroadcastChannel).toBeDefined();
      expect(globalThis.crypto.subtle).toBeDefined();
      cleanup();
    });
  });
});
