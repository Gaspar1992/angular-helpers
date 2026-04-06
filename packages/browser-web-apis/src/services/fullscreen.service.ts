import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BrowserApiBaseService } from './base/browser-api-base.service';

@Injectable()
export class FullscreenService extends BrowserApiBaseService {
  protected override getApiName(): string {
    return 'fullscreen';
  }

  isSupported(): boolean {
    if (!this.isBrowserEnvironment()) return false;
    return !!(
      document.fullscreenEnabled ??
      (document as Document & { webkitFullscreenEnabled?: boolean }).webkitFullscreenEnabled
    );
  }

  get isFullscreen(): boolean {
    if (!this.isBrowserEnvironment()) return false;
    return !!(
      document.fullscreenElement ??
      (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement
    );
  }

  get fullscreenElement(): Element | null {
    if (!this.isBrowserEnvironment()) return null;
    return (
      document.fullscreenElement ??
      (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement ??
      null
    );
  }

  async request(element: Element = document.documentElement): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Fullscreen API not supported in this browser');
    }

    try {
      const el = element as Element & { webkitRequestFullscreen?: () => Promise<void> };
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        await el.webkitRequestFullscreen();
      }
    } catch (error) {
      this.logError('Failed to enter fullscreen:', error);
      throw error;
    }
  }

  async exit(): Promise<void> {
    if (!this.isFullscreen) return;
    try {
      const doc = document as Document & { webkitExitFullscreen?: () => Promise<void> };
      if (doc.exitFullscreen) {
        await doc.exitFullscreen();
      } else if (doc.webkitExitFullscreen) {
        await doc.webkitExitFullscreen();
      }
    } catch (error) {
      this.logError('Failed to exit fullscreen:', error);
      throw error;
    }
  }

  async toggle(element: Element = document.documentElement): Promise<void> {
    if (this.isFullscreen) {
      await this.exit();
    } else {
      await this.request(element);
    }
  }

  watch(): Observable<boolean> {
    return new Observable<boolean>((observer) => {
      if (!this.isBrowserEnvironment()) {
        observer.next(false);
        observer.complete();
        return undefined;
      }

      const handler = () => observer.next(this.isFullscreen);
      document.addEventListener('fullscreenchange', handler);
      document.addEventListener('webkitfullscreenchange', handler);
      observer.next(this.isFullscreen);

      const cleanup = () => {
        document.removeEventListener('fullscreenchange', handler);
        document.removeEventListener('webkitfullscreenchange', handler);
      };

      this.destroyRef.onDestroy(cleanup);

      return cleanup;
    });
  }
}
