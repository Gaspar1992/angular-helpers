/**
 * Type declarations for web-streams-polyfill
 * This module is an optional peer dependency.
 */

declare module 'web-streams-polyfill/ponyfill' {
  export const ReadableStream: typeof globalThis.ReadableStream;
  export const WritableStream: typeof globalThis.WritableStream;
  export const TransformStream: typeof globalThis.TransformStream;
}
