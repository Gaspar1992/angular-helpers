import {
  Directive,
  ElementRef,
  inject,
  type OnDestroy,
  type OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FullscreenService } from '../services/fullscreen.service';
import { Subscription } from 'rxjs';

@Directive({
  selector: '[fullscreenFocus]',
  host: {
    '(click)': 'onClick()',
    '(keydown)': 'handleKeyDown($event)',
  },
})
export class FullscreenFocusDirective implements OnInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly elementRef = inject(ElementRef);
  private readonly fullscreenService = inject(FullscreenService);

  private isBrowser = false;
  private watchSub: Subscription | null = null;
  private isFullscreenActive = false;

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.watchSub = this.fullscreenService.watch().subscribe((isFullscreen) => {
        this.isFullscreenActive =
          isFullscreen &&
          this.fullscreenService.fullscreenElement === this.elementRef.nativeElement;
      });
    }
  }

  ngOnDestroy(): void {
    if (this.watchSub) {
      this.watchSub.unsubscribe();
    }
  }

  async onClick(): Promise<void> {
    if (this.isBrowser) {
      try {
        await this.fullscreenService.toggle(this.elementRef.nativeElement);
      } catch {
        // Fullscreen could be blocked or rejected by the browser
      }
    }
  }

  handleKeyDown(event: KeyboardEvent): void {
    if (!this.isFullscreenActive) return;

    if (event.key === 'Tab') {
      const focusables = this.getFocusableElements();
      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (event.shiftKey) {
        // Shift + Tab (backward focus transition)
        if (active === first || !this.elementRef.nativeElement.contains(active)) {
          last.focus();
          event.preventDefault();
        }
      } else {
        // Tab (forward focus transition)
        if (active === last || !this.elementRef.nativeElement.contains(active)) {
          first.focus();
          event.preventDefault();
        }
      }
    }
  }

  private getFocusableElements(): HTMLElement[] {
    const selectors = [
      'a[href]',
      'area[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'button:not([disabled])',
      'iframe',
      'object',
      'embed',
      '[contenteditable]',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    const list = Array.from(
      this.elementRef.nativeElement.querySelectorAll(selectors),
    ) as HTMLElement[];
    return list.filter((el) => el.offsetWidth > 0 && el.offsetHeight > 0);
  }
}
