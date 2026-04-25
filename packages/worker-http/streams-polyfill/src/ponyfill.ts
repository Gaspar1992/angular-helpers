/**
 * Ponyfill for Web Streams API that supports transfer to/from workers.
 *
 * Uses `web-streams-polyfill` internally but only loads it when needed.
 * This keeps bundle size small for non-Safari browsers.
 *
 * @see {@link needsPolyfill} for detection
 */

export interface StreamPonyfillExports {
  ReadableStream: typeof ReadableStream;
  TransformStream: typeof TransformStream;
  WritableStream: typeof WritableStream;
}

let cachedPonyfill: StreamPonyfillExports | null = null;

/**
 * Lazily loads the web-streams-polyfill ponyfill.
 *
 * @returns Ponyfilled streams or native if not needed
 */
export async function ponyfillStreams(): Promise<StreamPonyfillExports> {
  if (cachedPonyfill) {
    return cachedPonyfill;
  }

  // Dynamic import to avoid bundling polyfill for non-Safari users
  const { ReadableStream, TransformStream, WritableStream } =
    await import('web-streams-polyfill/ponyfill');

  cachedPonyfill = {
    ReadableStream,
    TransformStream,
    WritableStream,
  };

  return cachedPonyfill;
}
