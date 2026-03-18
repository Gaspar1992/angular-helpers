import { Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { BrowserApiBaseService } from './base/browser-api-base.service';

export interface ShareData {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
}

export interface ShareResult {
  shared: boolean;
  error?: string;
}

@Injectable()
export class WebShareService extends BrowserApiBaseService {
  private shareResult = signal<ShareResult>({ shared: false });

  constructor() {
    super();
    this.checkSupport();
  }

  protected override getApiName(): string {
    return 'web-share';
  }

  override isSupported(): boolean {
    return this.isBrowserEnvironment() && 'share' in navigator;
  }

  private checkSupport(): void {
    // Already handled by isSupported()
  }

  isShareSupported(): boolean {
    return this.isSupported();
  }

  async share(data: ShareData): Promise<ShareResult> {
    if (!this.isSupported() || this.isServerEnvironment()) {
      const error = 'Web Share API not supported or not available in server environment';
      this.shareResult.set({ shared: false, error });
      return { shared: false, error };
    }

    try {
      await navigator.share(data);
      this.shareResult.set({ shared: true });
      return { shared: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Share failed';
      this.logError('Error sharing:', error);
      this.shareResult.set({ shared: false, error: errorMessage });
      return { shared: false, error: errorMessage };
    }
  }

  async shareText(text: string, title?: string): Promise<ShareResult> {
    return this.share({ text, title });
  }

  async shareUrl(url: string, title?: string, text?: string): Promise<ShareResult> {
    return this.share({ url, title, text });
  }

  async shareFiles(files: File[], title?: string, text?: string): Promise<ShareResult> {
    return this.share({ files, title, text });
  }

  canShare(data: Partial<ShareData>): boolean {
    if (!this.isSupported() || this.isServerEnvironment()) {
      return false;
    }

    return navigator.canShare(data);
  }

  canShareText(): boolean {
    return this.canShare({ text: 'test' });
  }

  canShareUrl(): boolean {
    return this.canShare({ url: 'https://example.com' });
  }

  canShareFiles(): boolean {
    return this.canShare({ files: [new File([''], 'test.txt')] });
  }

  getShareResult(): Observable<ShareResult> {
    return toObservable(this.shareResult);
  }

  readonly getShareResultSignal = this.shareResult.asReadonly();

  getLastShareResult(): ShareResult {
    return this.shareResult();
  }

  resetShareResult(): void {
    this.shareResult.set({ shared: false });
  }

  // Helper methods for common sharing scenarios
  async shareCurrentPage(title?: string): Promise<ShareResult> {
    if (this.isServerEnvironment()) {
      const error = 'Web Share API not available in server environment';
      this.shareResult.set({ shared: false, error });
      return { shared: false, error };
    }

    const url = window.location.href;
    const pageTitle = title || document.title;
    return this.shareUrl(url, pageTitle);
  }

  async shareQuote(quote: string, source?: string): Promise<ShareResult> {
    const text = source ? `"${quote}" - ${source}` : quote;
    return this.shareText(text);
  }

  async shareImage(imageFile: File, title?: string): Promise<ShareResult> {
    return this.shareFiles([imageFile], title);
  }

  async shareLink(url: string, title?: string): Promise<ShareResult> {
    return this.shareUrl(url, title, url);
  }

  // Utility method to create share data from common sources
  createShareDataFromElement(element: HTMLElement): ShareData {
    const data: ShareData = {};

    // Extract title
    const titleElement = element.querySelector('h1, h2, h3, [title]');
    if (titleElement) {
      data.title = titleElement.textContent || titleElement.getAttribute('title') || undefined;
    }

    // Extract text content
    const textContent = element.textContent?.trim();
    if (textContent) {
      data.text = textContent.length > 200 ? textContent.substring(0, 197) + '...' : textContent;
    }

    // Extract URL from links
    const linkElement = element.querySelector('a[href]');
    if (linkElement) {
      data.url = linkElement.getAttribute('href') || undefined;
    }

    return data;
  }

  async shareElement(element: HTMLElement): Promise<ShareResult> {
    const data = this.createShareDataFromElement(element);
    return this.share(data);
  }
}
