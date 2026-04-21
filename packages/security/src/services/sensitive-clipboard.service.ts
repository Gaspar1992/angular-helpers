import { DestroyRef, Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';

export class ClipboardUnsupportedError extends Error {
  constructor() {
    super('Clipboard API not available in this environment');
    this.name = 'ClipboardUnsupportedError';
  }
}

export interface SensitiveCopyOptions {
  /**
   * Milliseconds before the clipboard is automatically cleared.
   * Set to `0` to disable auto-clear. Default: `15000` (15 seconds).
   */
  clearAfterMs?: number;
}

export type CopyStatus = 'copied' | 'cleared' | 'read-denied' | 'error';

const DEFAULT_CLEAR_MS = 15_000;

/**
 * Copies sensitive strings to the clipboard with automatic, verified clearing.
 *
 * Mirrors the behaviour of password managers (1Password, Bitwarden): the clipboard is
 * cleared only when its current content still matches what we wrote, preventing clobbering
 * of unrelated user copies.
 *
 * Requires a secure context and `navigator.clipboard`. The auto-clear step additionally
 * requires `navigator.clipboard.readText()` permission; when denied, the clear is skipped
 * and the status emits `'read-denied'`.
 *
 * Any pending clear timer is cancelled automatically when the owning injector is destroyed.
 *
 * @example
 * await sensitiveClipboard.copy(password, { clearAfterMs: 15_000 });
 */
@Injectable()
export class SensitiveClipboardService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  private pendingTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => this.cancelPendingClear());
  }

  isSupported(): boolean {
    return (
      isPlatformBrowser(this.platformId) &&
      typeof navigator !== 'undefined' &&
      typeof navigator.clipboard?.writeText === 'function'
    );
  }

  /**
   * Writes `text` to the clipboard and schedules an auto-clear.
   *
   * @throws {ClipboardUnsupportedError} When the Clipboard API is unavailable.
   */
  async copy(text: string, options: SensitiveCopyOptions = {}): Promise<void> {
    if (!this.isSupported()) {
      throw new ClipboardUnsupportedError();
    }

    const clearAfterMs = options.clearAfterMs ?? DEFAULT_CLEAR_MS;

    await navigator.clipboard.writeText(text);

    this.cancelPendingClear();
    if (clearAfterMs <= 0) return;

    this.pendingTimer = setTimeout(() => {
      void this.safeClear(text);
    }, clearAfterMs);
  }

  /**
   * Reactive variant of {@link copy}. Emits `'copied'` immediately after writing, then
   * `'cleared'` | `'read-denied'` | `'error'` once the auto-clear completes (or is skipped).
   */
  copy$(text: string, options: SensitiveCopyOptions = {}): Observable<CopyStatus> {
    return new Observable<CopyStatus>((subscriber) => {
      if (!this.isSupported()) {
        subscriber.error(new ClipboardUnsupportedError());
        return;
      }

      const clearAfterMs = options.clearAfterMs ?? DEFAULT_CLEAR_MS;
      let cleared = false;
      let timer: ReturnType<typeof setTimeout> | null = null;

      navigator.clipboard
        .writeText(text)
        .then(() => {
          subscriber.next('copied');
          if (clearAfterMs <= 0) {
            subscriber.complete();
            return;
          }

          timer = setTimeout(async () => {
            const status = await this.safeClear(text);
            cleared = true;
            subscriber.next(status);
            subscriber.complete();
          }, clearAfterMs);
        })
        .catch(() => {
          subscriber.next('error');
          subscriber.complete();
        });

      return () => {
        if (!cleared && timer !== null) clearTimeout(timer);
      };
    });
  }

  /**
   * Cancels any pending auto-clear timer. The clipboard content is not modified.
   */
  cancelPendingClear(): void {
    if (this.pendingTimer !== null) {
      clearTimeout(this.pendingTimer);
      this.pendingTimer = null;
    }
  }

  private async safeClear(expected: string): Promise<CopyStatus> {
    try {
      const current = await navigator.clipboard.readText();
      if (current !== expected) return 'read-denied';
      await navigator.clipboard.writeText('');
      return 'cleared';
    } catch {
      return 'read-denied';
    }
  }
}
