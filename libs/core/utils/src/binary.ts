/**
 * Pure, worker-safe binary encoding and conversion utilities.
 * Zero Angular runtime dependencies so they can be safely imported in Web Workers and main thread alike.
 */

const textEncoder = new TextEncoder();

/**
 * Converts a string, `Uint8Array`, or `ArrayBuffer` into an `ArrayBuffer`.
 * Safely handles `Uint8Array` subarray views with non-zero `byteOffset`.
 */
export function toArrayBuffer(data: string | ArrayBuffer | Uint8Array): ArrayBuffer {
  if (typeof data === 'string') {
    return textEncoder.encode(data).buffer as ArrayBuffer;
  }
  if (data instanceof Uint8Array) {
    if (data.byteOffset === 0 && data.byteLength === data.buffer.byteLength) {
      return data.buffer as ArrayBuffer;
    }
    return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
  }
  return data;
}

/**
 * Encodes an `ArrayBuffer` or `Uint8Array` into a lowercase hexadecimal string.
 */
export function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

/**
 * Decodes a hexadecimal string into a `Uint8Array`.
 * Throws an `Error('Invalid hex string')` if length is odd or contains non-hex characters.
 */
export function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  if (hex.length % 2 !== 0) {
    throw new Error('Invalid hex string');
  }
  const bytes = new Uint8Array(new ArrayBuffer(hex.length / 2));
  for (let i = 0; i < hex.length; i += 2) {
    const byte = parseInt(hex.substring(i, i + 2), 16);
    if (Number.isNaN(byte)) {
      throw new Error('Invalid hex string');
    }
    bytes[i / 2] = byte;
  }
  return bytes;
}

/**
 * Encodes an `ArrayBuffer` or `Uint8Array` into a Base64 string.
 * Processes bytes in chunks to avoid `RangeError: Maximum call stack size exceeded` on payloads > 64 KB.
 */
export function bytesToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    for (let j = 0; j < chunk.length; j++) {
      binary += String.fromCharCode(chunk[j]);
    }
  }
  return btoa(binary);
}

/**
 * Decodes a Base64 string into a `Uint8Array`.
 */
export function base64ToBytes(base64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
