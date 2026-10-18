import { describe, expect, it } from 'vitest';
import { base64ToBytes, bufferToHex, bytesToBase64, hexToBytes, toArrayBuffer } from './binary';

describe('binary utils', () => {
  describe('toArrayBuffer', () => {
    it('converts a string to ArrayBuffer', () => {
      const buf = toArrayBuffer('hello');
      expect(buf).toBeInstanceOf(ArrayBuffer);
      expect(Array.from(new Uint8Array(buf))).toEqual([104, 101, 108, 108, 111]);
    });

    it('returns the same ArrayBuffer when passed an ArrayBuffer', () => {
      const buf = new ArrayBuffer(8);
      expect(toArrayBuffer(buf)).toBe(buf);
    });

    it('returns the underlying buffer directly for a full Uint8Array view', () => {
      const view = new Uint8Array([1, 2, 3, 4]);
      expect(toArrayBuffer(view)).toBe(view.buffer);
    });

    it('slices the underlying buffer for a Uint8Array subarray view', () => {
      const full = new Uint8Array([10, 20, 30, 40, 50]);
      const sub = full.subarray(1, 4);
      const buf = toArrayBuffer(sub);
      expect(Array.from(new Uint8Array(buf))).toEqual([20, 30, 40]);
    });
  });

  describe('bufferToHex & hexToBytes', () => {
    it('round-trips bytes through hex encoding', () => {
      const original = new Uint8Array([0, 1, 15, 16, 255, 128]);
      const hex = bufferToHex(original);
      expect(hex).toBe('00010f10ff80');
      expect(bufferToHex(original.buffer)).toBe('00010f10ff80');

      const decoded = hexToBytes(hex);
      expect(Array.from(decoded)).toEqual(Array.from(original));
    });

    it('throws on odd-length or invalid hex strings', () => {
      expect(() => hexToBytes('abc')).toThrow('Invalid hex string');
      expect(() => hexToBytes('zz')).toThrow('Invalid hex string');
    });
  });

  describe('bytesToBase64 & base64ToBytes', () => {
    it('round-trips ArrayBuffer and Uint8Array through Base64', () => {
      const original = new Uint8Array([72, 101, 108, 108, 111]);
      const b64FromView = bytesToBase64(original);
      const b64FromBuf = bytesToBase64(original.buffer);
      expect(b64FromView).toBe('SGVsbG8=');
      expect(b64FromBuf).toBe('SGVsbG8=');

      const decoded = base64ToBytes(b64FromView);
      expect(Array.from(decoded)).toEqual(Array.from(original));
    });

    it('handles payloads larger than 64 KB without call stack overflow', () => {
      const large = new Uint8Array(120_000);
      for (let i = 0; i < large.length; i++) {
        large[i] = i & 0xff;
      }

      const encoded = bytesToBase64(large);
      const decoded = base64ToBytes(encoded);
      expect(decoded.byteLength).toBe(large.byteLength);
      expect(decoded[0]).toBe(0);
      expect(decoded[255]).toBe(255);
      expect(decoded[119_999]).toBe(119_999 & 0xff);
    });
  });
});
