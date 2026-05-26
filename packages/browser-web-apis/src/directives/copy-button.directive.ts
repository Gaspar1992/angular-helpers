import {
  Directive,
  Input,
  HostListener,
  inject,
  OnDestroy,
  Renderer2,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ClipboardService } from '../services/clipboard.service';

@Directive({
  selector: '[copyButton]',
  standalone: true,
})
export class CopyButtonDirective implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly renderer = inject(Renderer2);
  private readonly clipboardService =
    inject(ClipboardService, { optional: true }) || new ClipboardService();

  @Input() copyText = '';
  @Input() copySuccessMessage = 'Copiado al portapapeles con éxito';

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

  @HostListener('click')
  async onClick(): Promise<void> {
    if (!this.isBrowser || !this.copyText) return;

    try {
      await this.clipboardService.writeText(this.copyText);
      this.announce(this.copySuccessMessage);
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
