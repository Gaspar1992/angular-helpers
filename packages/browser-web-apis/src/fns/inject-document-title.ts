import {
  assertInInjectionContext,
  DestroyRef,
  effect,
  inject,
  PLATFORM_ID,
  signal,
  type WritableSignal,
} from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';

export interface DocumentTitleOptions {
  restoreOnDestroy?: boolean;
}

export interface DocumentTitleRef {
  readonly title: WritableSignal<string>;
}

/**
 * Syncs the document title reactively using a WritableSignal.
 * Optionally restores the original title when the component/context is destroyed.
 * SSR-safe: returns a safe signal and does not mutate the document title on the server.
 */
export function injectDocumentTitle(
  initialTitle?: string,
  options?: DocumentTitleOptions,
): DocumentTitleRef {
  assertInInjectionContext(injectDocumentTitle);
  const platformId = inject(PLATFORM_ID);
  const doc = inject(DOCUMENT);
  const isBrowser = isPlatformBrowser(platformId);

  const initialVal = initialTitle ?? (isBrowser ? doc.title : '');
  const titleSig = signal<string>(initialVal);

  if (isBrowser) {
    const originalTitle = doc.title;

    effect(() => {
      const currentTitle = titleSig();
      doc.title = currentTitle;
    });

    if (options?.restoreOnDestroy) {
      const destroyRef = inject(DestroyRef);
      destroyRef.onDestroy(() => {
        doc.title = originalTitle;
      });
    }
  }

  return {
    title: titleSig,
  };
}
