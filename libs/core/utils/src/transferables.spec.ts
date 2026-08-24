import { describe, it, expect, vi } from 'vitest';
import { isTransferable } from './transferables';

describe('isTransferable', () => {
  describe('primitives, null, undefined, and functions', () => {
    it('should return false for null and undefined', () => {
      expect(isTransferable(null)).toBe(false);
      expect(isTransferable(undefined)).toBe(false);
    });

    it('should return false for primitive types', () => {
      expect(isTransferable('string')).toBe(false);
      expect(isTransferable('')).toBe(false);
      expect(isTransferable(123)).toBe(false);
      expect(isTransferable(0)).toBe(false);
      expect(isTransferable(NaN)).toBe(false);
      expect(isTransferable(Infinity)).toBe(false);
      expect(isTransferable(true)).toBe(false);
      expect(isTransferable(false)).toBe(false);
      expect(isTransferable(Symbol('test'))).toBe(false);
      expect(isTransferable(BigInt(42))).toBe(false);
    });

    it('should return false for functions', () => {
      expect(isTransferable(() => {})).toBe(false);
      expect(isTransferable(function named() {})).toBe(false);
      expect(isTransferable(async () => {})).toBe(false);
      expect(isTransferable(class TestClass {})).toBe(false);
    });
  });

  describe('plain objects, arrays, and standard built-ins', () => {
    it('should return false for plain objects and arrays', () => {
      expect(isTransferable({})).toBe(false);
      expect(isTransferable({ foo: 'bar' })).toBe(false);
      expect(isTransferable([])).toBe(false);
      expect(isTransferable([1, 2, 3])).toBe(false);
      expect(isTransferable({ buffer: new ArrayBuffer(8) })).toBe(false);
    });

    it('should return false for common standard non-transferable objects', () => {
      expect(isTransferable(new Date())).toBe(false);
      expect(isTransferable(/regex/)).toBe(false);
      expect(isTransferable(new Map())).toBe(false);
      expect(isTransferable(new Set())).toBe(false);
      expect(isTransferable(new WeakMap())).toBe(false);
      expect(isTransferable(new WeakSet())).toBe(false);
      expect(isTransferable(new Error('test'))).toBe(false);
      expect(isTransferable(Promise.resolve())).toBe(false);
    });
  });

  describe('TypedArrays and DataView', () => {
    it('should return false for TypedArrays (only their .buffer is transferable)', () => {
      expect(isTransferable(new Uint8Array(8))).toBe(false);
      expect(isTransferable(new Uint8ClampedArray(8))).toBe(false);
      expect(isTransferable(new Int8Array(8))).toBe(false);
      expect(isTransferable(new Uint16Array(8))).toBe(false);
      expect(isTransferable(new Int16Array(8))).toBe(false);
      expect(isTransferable(new Uint32Array(8))).toBe(false);
      expect(isTransferable(new Int32Array(8))).toBe(false);
      expect(isTransferable(new Float32Array(8))).toBe(false);
      expect(isTransferable(new Float64Array(8))).toBe(false);
      expect(isTransferable(new BigInt64Array(8))).toBe(false);
      expect(isTransferable(new BigUint64Array(8))).toBe(false);
      expect(isTransferable(new DataView(new ArrayBuffer(8)))).toBe(false);
    });

    it('should return true for the underlying buffer of a TypedArray', () => {
      const uint8 = new Uint8Array(16);
      expect(isTransferable(uint8.buffer)).toBe(true);

      const float64 = new Float64Array(4);
      expect(isTransferable(float64.buffer)).toBe(true);
    });
  });

  describe('Transferable types', () => {
    it('should return true for ArrayBuffer', () => {
      expect(isTransferable(new ArrayBuffer(16))).toBe(true);
      expect(isTransferable(new ArrayBuffer(0))).toBe(true);
    });

    it('should return true for MessagePort', () => {
      if (typeof MessageChannel !== 'undefined') {
        const channel = new MessageChannel();
        expect(isTransferable(channel.port1)).toBe(true);
        expect(isTransferable(channel.port2)).toBe(true);
        channel.port1.close();
        channel.port2.close();
      } else {
        class MockMessagePort {}
        vi.stubGlobal('MessagePort', MockMessagePort);
        try {
          expect(isTransferable(new MockMessagePort())).toBe(true);
        } finally {
          vi.unstubAllGlobals();
        }
      }
    });

    it('should return true for ImageBitmap', () => {
      class MockImageBitmap {}
      vi.stubGlobal('ImageBitmap', MockImageBitmap);
      try {
        expect(isTransferable(new MockImageBitmap())).toBe(true);
      } finally {
        vi.unstubAllGlobals();
      }
    });

    it('should return true for OffscreenCanvas', () => {
      class MockOffscreenCanvas {}
      vi.stubGlobal('OffscreenCanvas', MockOffscreenCanvas);
      try {
        expect(isTransferable(new MockOffscreenCanvas())).toBe(true);
      } finally {
        vi.unstubAllGlobals();
      }
    });

    it('should return true for Web Streams (ReadableStream, WritableStream, TransformStream)', () => {
      if (typeof ReadableStream !== 'undefined') {
        expect(isTransferable(new ReadableStream())).toBe(true);
      } else {
        class MockReadableStream {}
        vi.stubGlobal('ReadableStream', MockReadableStream);
        expect(isTransferable(new MockReadableStream())).toBe(true);
        vi.unstubAllGlobals();
      }

      if (typeof WritableStream !== 'undefined') {
        expect(isTransferable(new WritableStream())).toBe(true);
      } else {
        class MockWritableStream {}
        vi.stubGlobal('WritableStream', MockWritableStream);
        expect(isTransferable(new MockWritableStream())).toBe(true);
        vi.unstubAllGlobals();
      }

      if (typeof TransformStream !== 'undefined') {
        expect(isTransferable(new TransformStream())).toBe(true);
      } else {
        class MockTransformStream {}
        vi.stubGlobal('TransformStream', MockTransformStream);
        expect(isTransferable(new MockTransformStream())).toBe(true);
        vi.unstubAllGlobals();
      }
    });
  });

  describe('SSR / Missing Globals Simulation', () => {
    it('should safely return false without throwing when Transferable globals are undefined in SSR', () => {
      const originalArrayBuffer = globalThis.ArrayBuffer;
      const originalMessagePort = globalThis.MessagePort;
      const originalImageBitmap = (globalThis as any).ImageBitmap;
      const originalOffscreenCanvas = (globalThis as any).OffscreenCanvas;
      const originalReadableStream = globalThis.ReadableStream;
      const originalWritableStream = globalThis.WritableStream;
      const originalTransformStream = globalThis.TransformStream;

      try {
        delete (globalThis as any).ArrayBuffer;
        delete (globalThis as any).MessagePort;
        delete (globalThis as any).ImageBitmap;
        delete (globalThis as any).OffscreenCanvas;
        delete (globalThis as any).ReadableStream;
        delete (globalThis as any).WritableStream;
        delete (globalThis as any).TransformStream;

        expect(isTransferable({})).toBe(false);
        expect(isTransferable({ foo: 'bar' })).toBe(false);
        expect(isTransferable([])).toBe(false);
      } finally {
        if (originalArrayBuffer) globalThis.ArrayBuffer = originalArrayBuffer;
        if (originalMessagePort) globalThis.MessagePort = originalMessagePort;
        if (originalImageBitmap) (globalThis as any).ImageBitmap = originalImageBitmap;
        if (originalOffscreenCanvas) (globalThis as any).OffscreenCanvas = originalOffscreenCanvas;
        if (originalReadableStream) globalThis.ReadableStream = originalReadableStream;
        if (originalWritableStream) globalThis.WritableStream = originalWritableStream;
        if (originalTransformStream) globalThis.TransformStream = originalTransformStream;
      }
    });
  });
});
