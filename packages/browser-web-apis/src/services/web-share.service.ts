import { Injectable } from '@angular/core';
import { BrowserApiBaseService } from './base/browser-api-base.service';

interface ShareResult {
  shared: boolean;
  error?: string;
}

@Injectable()
export class WebShareService extends BrowserApiBaseService {
  protected override getApiName(): string {
    return 'web-share';
  }

  private ensureWebShareSupport(): void {
    if (!('share' in navigator)) {
      throw new Error('Web Share API not supported in this browser');
    }
  }

  async share(data: ShareData): Promise<ShareResult> {
    this.ensureWebShareSupport();

    try {
      await navigator.share(data);
      return { shared: true };
    } catch (error: unknown) {
      console.error('[WebShareService] Error sharing:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Share failed';
      return { shared: false, error: errorMessage };
    }
  }

  canShare(): boolean {
    return 'share' in navigator;
  }

  canShareFiles(): boolean {
    if (!('share' in navigator)) return false;
    
    // Check if the browser supports file sharing
    const testFiles = [new File([''], 'test.txt', { type: 'text/plain' })];
    return navigator.canShare?.({ files: testFiles }) ?? false;
  }

  // Direct access to native share API
  getNativeShare(): typeof navigator.share {
    this.ensureWebShareSupport();
    return navigator.share;
  }
}
