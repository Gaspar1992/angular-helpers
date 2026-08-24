import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { TransformStream } from 'node:stream/web';
import { CompressionService } from './compression.service';
import { BrowserCapabilityService } from './browser-capability.service';

describe('CompressionService', () => {
  let service: CompressionService;

  beforeEach(() => {
    // Mock TransformStream-based CompressionStream / DecompressionStream
    class MockTransformStream {
      readable: any;
      writable: any;
      constructor() {
        const ts = new TransformStream({
          transform(chunk, controller) {
            controller.enqueue(chunk);
          },
        });
        this.readable = ts.readable;
        this.writable = ts.writable;
      }
    }

    vi.stubGlobal('CompressionStream', MockTransformStream);
    vi.stubGlobal('DecompressionStream', MockTransformStream);

    TestBed.configureTestingModule({
      providers: [CompressionService, BrowserCapabilityService],
    });
    service = TestBed.inject(CompressionService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should be created and verify support', () => {
    expect(service).toBeTruthy();
    expect(service.isSupported()).toBe(true);
  });

  it('should compress and decompress byte arrays', async () => {
    const input = new Uint8Array([1, 2, 3, 4, 5]);
    const compressed = await service.compress(input, 'gzip');
    expect(compressed).toBeInstanceOf(Uint8Array);
    expect(Array.from(compressed)).toEqual([1, 2, 3, 4, 5]);

    const decompressed = await service.decompress(compressed, 'gzip');
    expect(Array.from(decompressed)).toEqual([1, 2, 3, 4, 5]);
  });

  it('should compress and decompress strings', async () => {
    const text = 'Hello, compression streams!';
    const compressed = await service.compressString(text, 'deflate');
    expect(compressed).toBeInstanceOf(Uint8Array);

    const original = await service.decompressString(compressed, 'deflate');
    expect(original).toBe(text);
  });

  it('should throw when compression streams are not supported', async () => {
    delete (window as any).CompressionStream;
    delete (window as any).DecompressionStream;
    delete (globalThis as any).CompressionStream;
    delete (globalThis as any).DecompressionStream;

    expect(service.isSupported()).toBe(false);
    await expect(service.compressString('test')).rejects.toThrow(
      /Compression Streams API not supported/,
    );
  });

  it('should throw when on server platform', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        CompressionService,
        BrowserCapabilityService,
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });
    const serverService = TestBed.inject(CompressionService);
    expect(serverService.isSupported()).toBe(false);
    await expect(serverService.compressString('test')).rejects.toThrow(/server environment/);
  });
});
