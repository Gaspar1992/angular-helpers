import { DestroyRef, DOCUMENT, inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Shared ARIA live region announcer for browser directives.
 * Creates at most one visually-hidden live region per document and cleans it up on destroy.
 */
@Injectable({ providedIn: 'root' })
export class LiveAnnouncerService {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly destroyRef = inject(DestroyRef);

  private liveRegion: HTMLDivElement | null = null;
  private announceTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.announceTimeout !== null) {
        clearTimeout(this.announceTimeout);
        this.announceTimeout = null;
      }
      this.liveRegion?.remove();
      this.liveRegion = null;
    });
  }

  announce(message: string, politeness: 'polite' | 'assertive' = 'polite'): void {
    if (!this.isBrowser || !message) return;

    const region = this.ensureLiveRegion(politeness);
    region.textContent = '';

    if (this.announceTimeout !== null) {
      clearTimeout(this.announceTimeout);
    }

    this.announceTimeout = setTimeout(() => {
      this.announceTimeout = null;
      if (this.liveRegion) {
        this.liveRegion.textContent = message;
      }
    }, 50);
  }

  private ensureLiveRegion(politeness: 'polite' | 'assertive'): HTMLDivElement {
    if (!this.liveRegion) {
      const el = this.document.createElement('div');
      el.setAttribute('aria-live', politeness);
      el.setAttribute('aria-atomic', 'true');
      el.style.position = 'absolute';
      el.style.width = '1px';
      el.style.height = '1px';
      el.style.overflow = 'hidden';
      el.style.clip = 'rect(1px, 1px, 1px, 1px)';
      el.style.whiteSpace = 'nowrap';
      this.document.body.appendChild(el);
      this.liveRegion = el;
    } else if (this.liveRegion.getAttribute('aria-live') !== politeness) {
      this.liveRegion.setAttribute('aria-live', politeness);
    }
    return this.liveRegion;
  }
}
