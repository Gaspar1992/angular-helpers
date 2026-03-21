import { Injectable, signal } from '@angular/core';
import { from, Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BrowserSupportUtil } from '../utils/browser-support.util';
import { BrowserApiBaseService } from './base/browser-api-base.service';

@Injectable()
export class ClipboardService extends BrowserApiBaseService {
  private clipboardContent = signal<string>('');

  readonly clipboardContent$ = this.clipboardContent.asReadonly();

  constructor() {
    super();
  }

  protected override getApiName(): string {
    return 'clipboard';
  }

  override isSupported(): boolean {
    return BrowserSupportUtil.isSupported('clipboard');
  }

  async writeText(text: string): Promise<void> {
    if (!this.isSupported() || !this.isBrowserEnvironment()) {
      throw new Error('Clipboard API not supported or not available in server environment');
    }

    try {
      await navigator.clipboard.writeText(text);
      this.clipboardContent.set(text);
    } catch (error) {
      this.logError('Error writing to clipboard:', error);
      throw error;
    }
  }

  async readText(): Promise<string> {
    if (!this.isSupported() || !this.isBrowserEnvironment()) {
      throw new Error('Clipboard API not supported or not available in server environment');
    }

    try {
      const text = await navigator.clipboard.readText();
      this.clipboardContent.set(text);
      return text;
    } catch (error) {
      this.logError('Error reading from clipboard:', error);
      throw error;
    }
  }

  async write(data: ClipboardItem[]): Promise<void> {
    if (!this.isSupported() || !this.isBrowserEnvironment()) {
      throw new Error('Clipboard API not supported or not available in server environment');
    }

    try {
      await navigator.clipboard.write(data);
    } catch (error) {
      this.logError('Error writing to clipboard:', error);
      throw error;
    }
  }

  async read(): Promise<ClipboardItem[]> {
    if (!this.isSupported() || !this.isBrowserEnvironment()) {
      throw new Error('Clipboard API not supported or not available in server environment');
    }

    try {
      return await navigator.clipboard.read();
    } catch (error) {
      this.logError('Error reading from clipboard:', error);
      throw error;
    }
  }

  async copyText(text: string): Promise<void> {
    return this.writeText(text);
  }

  async pasteText(): Promise<string> {
    return this.readText();
  }

  async copyImage(imageBlob: Blob): Promise<void> {
    if (this.isServerEnvironment()) {
      throw new Error('Clipboard API not available in server environment');
    }

    try {
      const item = new ClipboardItem({ [imageBlob.type]: imageBlob });
      await this.write([item]);
    } catch (error) {
      this.logError('Error copying image to clipboard:', error);
      throw error;
    }
  }

  async pasteImage(): Promise<Blob | null> {
    if (this.isServerEnvironment()) {
      return null;
    }

    try {
      const items = await this.read();
      for (const item of items) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type);
            return blob;
          }
        }
      }
      return null;
    } catch (error) {
      this.logError('Error pasting image from clipboard:', error);
      return null;
    }
  }

  async clear(): Promise<void> {
    try {
      await this.writeText('');
      this.clipboardContent.set('');
    } catch (error) {
      this.logError('Error clearing clipboard:', error);
      throw error;
    }
  }

  observeClipboard(): Observable<string> {
    return from(this.readText()).pipe(
      catchError(() => from(['']))
    );
  }

  hasReadPermission(): boolean {
    return BrowserSupportUtil.isSupported('clipboard-read');
  }

  hasWritePermission(): boolean {
    return BrowserSupportUtil.isSupported('clipboard-write');
  }

  override async requestPermission(permission?: string): Promise<boolean> {
    try {
      if (permission === 'clipboard-read') {
        await this.permissionsService.request({ name: 'clipboard-read' });
      } else if (permission === 'clipboard-write') {
        await this.permissionsService.request({ name: 'clipboard-write' });
      }
      return true;
    } catch (error) {
      this.logError('Error requesting clipboard permission:', error);
      return false;
    }
  }

  async requestReadPermission(): Promise<boolean> {
    return this.requestPermission('clipboard-read');
  }

  async requestWritePermission(): Promise<boolean> {
    return this.requestPermission('clipboard-write');
  }

  isClipboardSupported(): boolean {
    return this.isSupported();
  }
}
