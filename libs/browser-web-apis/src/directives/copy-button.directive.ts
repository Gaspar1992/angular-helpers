import { Directive, input, inject, type OnDestroy, Renderer2, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ClipboardService } from '../services/clipboard.service';

@Directive({
  selector: '[copyButton]',
  host: {
    '(click)': 'onClick()',
  },
})
export class CopyButtonDirective implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly renderer = inject(Renderer2);
  private readonly clipboardService = inject(ClipboardService);

  readonly copyText = input<string>('');
  readonly copySuccessMessage = input<string>('Copiado al portapapeles con éxito');

  private liveRegion: HTMLDivElement | null = null;
  private isBrowser = false;
  private announceTimeout: any = null;

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      this.createLiveRegion();
    }
  }

  ngOnDestroy(): void {
    if (this.announceTimeout) {
      clearTimeout(this.announceTimeout);
    }
    if (this.liveRegion) {
      this.liveRegion.remove();
    }
  }

  async onClick(): Promise<void> {
    const text = this.copyText();
    if (!this.isBrowser || !text) return;

    try {
      await this.clipboardService.writeText(text);
      this.announce(this.copySuccessMessage());
    } catch {
      this.announce('Error al copiar al portapapeles');
    }
  }

  private createLiveRegion(): void {
    this.liveRegion = this.renderer.createElement('div');
    if (this.liveRegion) {
      this.renderer.setAttribute(this.liveRegion, 'aria-live', 'polite');
      this.renderer.setAttribute(this.liveRegion, 'aria-atomic', 'true');
      this.renderer.setStyle(this.liveRegion, 'position', 'absolute');
      this.renderer.setStyle(this.liveRegion, 'width', '1px');
      this.renderer.setStyle(this.liveRegion, 'height', '1px');
      this.renderer.setStyle(this.liveRegion, 'overflow', 'hidden');
      this.renderer.setStyle(this.liveRegion, 'clip', 'rect(1px, 1px, 1px, 1px)');

      this.renderer.appendChild(document.body, this.liveRegion);
    }
  }

  private announce(message: string): void {
    if (this.liveRegion) {
      this.renderer.setProperty(this.liveRegion, 'textContent', '');
      if (this.announceTimeout) {
        clearTimeout(this.announceTimeout);
      }
      this.announceTimeout = setTimeout(() => {
        if (this.liveRegion) {
          this.renderer.setProperty(this.liveRegion, 'textContent', message);
        }
      }, 50);
    }
  }
}
