import { Injectable } from '@angular/core';
import { BrowserApiBaseService } from './base/browser-api-base.service';

export type CompressionFormat = 'gzip' | 'deflate' | 'deflate-raw';

interface CompressionStreamCtor {
  new (format: CompressionFormat): GenericTransformStream;
}

interface DecompressionStreamCtor {
  new (format: CompressionFormat): GenericTransformStream;
}

interface GlobalWithCompression {
  CompressionStream?: CompressionStreamCtor;
  DecompressionStream?: DecompressionStreamCtor;
}

/**
 * Service wrapping `CompressionStream` and `DecompressionStream`.
 *
 * ```ts
 * const cmp = inject(CompressionService);
 * const compressed = await cmp.compress(jsonBytes, 'gzip');
 * const original = await cmp.decompress(compressed, 'gzip');
 * ```
 */
@Injectable()
export class CompressionService extends BrowserApiBaseService {
  protected override getApiName(): string {
    return 'compression-streams';
  }

  override isSupported(): boolean {
    if (!this.isBrowserEnvironment()) return false;
    const g = globalThis as unknown as GlobalWithCompression;
    return typeof g.CompressionStream === 'function' && typeof g.DecompressionStream === 'function';
  }

  /** Compress a `Uint8Array`/`ArrayBuffer` using the given format. */
  async compress(
    data: Uint8Array | ArrayBuffer,
    format: CompressionFormat = 'gzip',
  ): Promise<Uint8Array> {
    this.ensureSupported();
    const g = globalThis as unknown as GlobalWithCompression;
    const stream = new g.CompressionStream!(format);
    return this.runStream(data, stream);
  }

  /** Decompress a `Uint8Array`/`ArrayBuffer` using the given format. */
  async decompress(
    data: Uint8Array | ArrayBuffer,
    format: CompressionFormat = 'gzip',
  ): Promise<Uint8Array> {
    this.ensureSupported();
    const g = globalThis as unknown as GlobalWithCompression;
    const stream = new g.DecompressionStream!(format);
    return this.runStream(data, stream);
  }

  /** Convenience: compress a UTF-8 string and return the compressed bytes. */
  async compressString(value: string, format: CompressionFormat = 'gzip'): Promise<Uint8Array> {
    return this.compress(new TextEncoder().encode(value), format);
  }

  /** Convenience: decompress bytes into a UTF-8 string. */
  async decompressString(
    data: Uint8Array | ArrayBuffer,
    format: CompressionFormat = 'gzip',
  ): Promise<string> {
    const bytes = await this.decompress(data, format);
    return new TextDecoder().decode(bytes);
  }

  protected override ensureSupported(): void {
    super.ensureSupported();
    if (!this.isSupported()) {
      throw new Error('Compression Streams API not supported in this browser');
    }
  }

  private async runStream(
    data: Uint8Array | ArrayBuffer,
    stream: GenericTransformStream,
  ): Promise<Uint8Array> {
    const writer = stream.writable.getWriter();
    const writePromise = writer.write(data instanceof Uint8Array ? data : new Uint8Array(data));
    const closePromise = writer.close();

    const reader = stream.readable.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = value as Uint8Array;
      chunks.push(chunk);
      total += chunk.byteLength;
    }
    await writePromise;
    await closePromise;

    const result = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return result;
  }
}
