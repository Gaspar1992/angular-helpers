import { DestroyRef, inject, PLATFORM_ID, signal, type Signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface ClipboardRef {
  /** Last text successfully read from the clipboard, or `null`. */
  readonly text: Signal<string | null>;
  /** Last error message from a read/write attempt, or `null`. */
  readonly error: Signal<string | null>;
  /** True when a read/write is in flight. */
  readonly busy: Signal<boolean>;
  /** True when the Clipboard API is available in the current environment. */
  readonly isSupported: Signal<boolean>;
  writeText(value: string): Promise<boolean>;
  readText(): Promise<string | null>;
}

export function injectClipboard(): ClipboardRef {
  const destroyRef = inject(DestroyRef);
  const platformId = inject(PLATFORM_ID);

  const isBrowser = isPlatformBrowser(platformId);
  const supported = signal<boolean>(
    isBrowser && typeof navigator !== 'undefined' && !!navigator.clipboard,
  );
  const text = signal<string | null>(null);
  const error = signal<string | null>(null);
  const busy = signal<boolean>(false);
  let disposed = false;

  destroyRef.onDestroy(() => {
    disposed = true;
  });

  const writeText = async (value: string): Promise<boolean> => {
    if (!supported() || disposed) {
      error.set('Clipboard API not supported');
      return false;
    }
    busy.set(true);
    try {
      await navigator.clipboard.writeText(value);
      if (!disposed) {
        text.set(value);
        error.set(null);
      }
      return true;
    } catch (err) {
      if (!disposed) error.set(err instanceof Error ? err.message : 'writeText failed');
      return false;
    } finally {
      if (!disposed) busy.set(false);
    }
  };

  const readText = async (): Promise<string | null> => {
    if (!supported() || disposed) {
      error.set('Clipboard API not supported');
      return null;
    }
    busy.set(true);
    try {
      const value = await navigator.clipboard.readText();
      if (!disposed) {
        text.set(value);
        error.set(null);
      }
      return value;
    } catch (err) {
      if (!disposed) error.set(err instanceof Error ? err.message : 'readText failed');
      return null;
    } finally {
      if (!disposed) busy.set(false);
    }
  };

  return {
    text: text.asReadonly(),
    error: error.asReadonly(),
    busy: busy.asReadonly(),
    isSupported: supported.asReadonly(),
    writeText,
    readText,
  };
}
