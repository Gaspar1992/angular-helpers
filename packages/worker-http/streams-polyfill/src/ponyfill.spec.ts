import { describe, expect, it, vi } from 'vitest';
import { ponyfillStreams } from './ponyfill';

describe('ponyfillStreams', () => {
  it('returns cached result on subsequent calls', async () => {
    const first = await ponyfillStreams();
    const second = await ponyfillStreams();
    expect(first).toBe(second);
  });

  it('exports ReadableStream, TransformStream, WritableStream', async () => {
    const streams = await ponyfillStreams();
    expect(typeof streams.ReadableStream).toBe('function');
    expect(typeof streams.TransformStream).toBe('function');
    expect(typeof streams.WritableStream).toBe('function');
  });
});
