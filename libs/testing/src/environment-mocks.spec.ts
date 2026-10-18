import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  MockResizeObserver,
  MockIntersectionObserver,
  MockBroadcastChannel,
  mockWebCrypto,
  mockResizeObserver,
  mockIntersectionObserver,
  mockBroadcastChannel,
  mockCanvas2D,
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

      (observer as unknown as MockResizeObserver).trigger();
      expect(callback).toHaveBeenCalledWith([], observer);

      observer.unobserve(element);
      expect((observer as unknown as MockResizeObserver).elements.has(element)).toBe(false);

      observer.disconnect();
    });

    it('triggerAll should invoke all active observers with default or custom entries', () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      new ResizeObserver(cb1);
      new ResizeObserver(cb2);

      MockResizeObserver.triggerAll();
      expect(cb1).toHaveBeenCalledWith([], expect.any(MockResizeObserver));
      expect(cb2).toHaveBeenCalledWith([], expect.any(MockResizeObserver));
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

    it('should observe, takeRecords and trigger callbacks with array and single threshold options', () => {
      const callback = vi.fn();
      const rootEl = document.createElement('section');
      const observer = new IntersectionObserver(callback, {
        root: rootEl,
        rootMargin: '10px',
        threshold: [0.5],
      });
      const singleThresholdObserver = new IntersectionObserver(vi.fn(), {
        threshold: 0.25,
      });
      expect(observer.root).toBe(rootEl);
      expect(observer.rootMargin).toBe('10px');
      expect(observer.thresholds).toEqual([0.5]);
      expect(singleThresholdObserver.thresholds).toEqual([0.25]);

      const element = document.createElement('div');

      observer.observe(element);
      expect((observer as unknown as MockIntersectionObserver).elements.has(element)).toBe(true);
      expect(observer.takeRecords()).toEqual([]);

      (observer as unknown as MockIntersectionObserver).trigger([{ isIntersecting: true }]);
      expect(callback).toHaveBeenCalledWith([{ isIntersecting: true }], observer);

      (observer as unknown as MockIntersectionObserver).trigger();
      expect(callback).toHaveBeenCalledWith([], observer);

      MockIntersectionObserver.triggerAll();
      expect(callback).toHaveBeenCalledTimes(3);

      observer.unobserve(element);
      expect((observer as unknown as MockIntersectionObserver).elements.has(element)).toBe(false);

      observer.disconnect();
      singleThresholdObserver.disconnect();
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

    it('should support addEventListener, removeEventListener, dispatchEvent, and close errors', () => {
      const ch1 = new BroadcastChannel('events-room');
      const ch2 = new BroadcastChannel('events-room');
      const ch3 = new BroadcastChannel('events-room');
      ch3.close();

      const fnListener = vi.fn();
      const objListener = { handleEvent: vi.fn() };

      ch2.addEventListener('message', null);
      ch2.removeEventListener('message', null);
      ch2.removeEventListener('nonexistent', fnListener);

      ch2.addEventListener('message', fnListener);
      ch2.addEventListener('message', objListener);

      ch1.postMessage('ping');
      expect(fnListener).toHaveBeenCalledTimes(1);
      expect(objListener.handleEvent).toHaveBeenCalledTimes(1);

      ch2.removeEventListener('message', fnListener);
      ch1.postMessage('pong');
      expect(fnListener).toHaveBeenCalledTimes(1);
      expect(objListener.handleEvent).toHaveBeenCalledTimes(2);

      expect(ch2.dispatchEvent(new Event('unregistered'))).toBe(true);

      MockBroadcastChannel.clearChannels();
      ch1.postMessage('no-siblings');

      ch1.close();
      expect(() => ch1.postMessage('after-close')).toThrow(/Cannot post message on a closed/);
    });
  });

  describe('mockWebCrypto', () => {
    it('ensures subtle crypto is available and handles missing crypto or subtle', () => {
      mockWebCrypto();
      expect(globalThis.crypto).toBeDefined();
      expect(globalThis.crypto.subtle).toBeDefined();

      const originalCrypto = globalThis.crypto;
      try {
        Object.defineProperty(globalThis, 'crypto', {
          value: {},
          configurable: true,
          writable: true,
        });
        mockWebCrypto();
        expect(globalThis.crypto.subtle).toBeDefined();

        Object.defineProperty(globalThis, 'crypto', {
          value: undefined,
          configurable: true,
          writable: true,
        });
        mockWebCrypto();
        expect(globalThis.crypto).toBeDefined();
      } finally {
        Object.defineProperty(globalThis, 'crypto', {
          value: originalCrypto,
          configurable: true,
          writable: true,
        });
      }
    });
  });

  describe('mockCanvas2D', () => {
    it('mocks HTMLCanvasElement.prototype.getContext with 2D context methods', () => {
      mockCanvas2D();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      expect(ctx).toBeDefined();

      ctx.createLinearGradient(0, 0, 10, 10).addColorStop(0, 'red');
      ctx.createRadialGradient(0, 0, 1, 0, 0, 10).addColorStop(1, 'blue');
      ctx.fillRect(0, 0, 10, 10);
      ctx.clearRect(0, 0, 10, 10);
      expect(ctx.getImageData(0, 0, 1, 1).data).toBeInstanceOf(Uint8ClampedArray);
      ctx.putImageData({ data: new Uint8ClampedArray(4) } as ImageData, 0, 0);
      expect(ctx.createImageData(1, 1).data).toBeInstanceOf(Uint8ClampedArray);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(canvas, 0, 0);
      ctx.save();
      ctx.fillText('hello', 0, 0);
      ctx.restore();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(10, 10);
      ctx.closePath();
      ctx.stroke();
      ctx.translate(1, 1);
      ctx.scale(1, 1);
      ctx.rotate(0);
      ctx.arc(0, 0, 5, 0, Math.PI);
      ctx.fill();
      expect(ctx.measureText('test')).toEqual({ width: 0 });
      ctx.transform(1, 0, 0, 1, 0, 0);
      ctx.rect(0, 0, 10, 10);
      ctx.clip();
    });
  });

  describe('mockIndexedDB', () => {
    it('installs safe IDBFactory when undefined and restores on cleanup', () => {
      const savedIDB = globalThis.indexedDB;
      // @ts-expect-error Temporarily delete indexedDB to test fallback installation
      delete globalThis.indexedDB;

      const cleanup = mockIndexedDB();
      expect(globalThis.indexedDB).toBeDefined();

      const req = globalThis.indexedDB.open('test-db');
      expect(req).toBeDefined();
      req.addEventListener('success', () => {});
      req.removeEventListener('success', () => {});
      expect(req.dispatchEvent(new Event('success'))).toBe(true);

      const delReq = globalThis.indexedDB.deleteDatabase('test-db');
      expect(delReq.readyState).toBe('done');

      expect(globalThis.indexedDB.cmp(1, 1)).toBe(0);
      expect(globalThis.indexedDB.cmp(2, 1)).toBe(1);
      expect(globalThis.indexedDB.cmp(1, 2)).toBe(-1);

      cleanup();
      expect(globalThis.indexedDB).toBeUndefined();

      // Also test when indexedDB is already defined
      Object.defineProperty(globalThis, 'indexedDB', {
        value: savedIDB ?? ({ custom: true } as unknown as IDBFactory),
        configurable: true,
        writable: true,
      });
      const cleanupExisting = mockIndexedDB();
      cleanupExisting();

      if (savedIDB === undefined) {
        // @ts-expect-error Restore undefined state
        delete globalThis.indexedDB;
      }
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

    it('respects disabled options in setupHeadlessBrowserMocks', () => {
      const cleanup = setupHeadlessBrowserMocks({
        webCrypto: false,
        resizeObserver: false,
        intersectionObserver: false,
        broadcastChannel: false,
        canvas2D: false,
        indexedDB: false,
      });
      cleanup();
    });
  });
});
