import { Injectable, signal, inject, computed } from '@angular/core';
import { from, Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { BrowserSupportUtil } from '../utils/browser-support.util';
import { PermissionsService } from './permissions.service';

@Injectable()
export class ClipboardService {
  private clipboardContent = signal<string>('');
  private isSupported = signal<boolean>(false);

  readonly clipboardContent$ = this.clipboardContent.asReadonly();
  readonly isSupported$ = this.isSupported.asReadonly();

  private permissionsService = inject(PermissionsService);

  private checkSupport(): boolean {
    return BrowserSupportUtil.isSupported('clipboard');
  }

  async writeText(text: string): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Clipboard API not supported');
    }

    try {
      await navigator.clipboard.writeText(text);
      this.clipboardContent.set(text);
    } catch (error) {
      console.error('Error writing to clipboard:', error);
      throw error;
    }
  }

  async readText(): Promise<string> {
    if (!this.isSupported()) {
      throw new Error('Clipboard API not supported');
    }

    try {
      const text = await navigator.clipboard.readText();
      this.clipboardContent.set(text);
      return text;
    } catch (error) {
      console.error('Error reading from clipboard:', error);
      throw error;
    }
  }

  async write(data: ClipboardItem[]): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Clipboard API not supported');
    }

    try {
      await navigator.clipboard.write(data);
    } catch (error) {
      console.error('Error writing to clipboard:', error);
      throw error;
    }
  }

  async read(): Promise<ClipboardItem[]> {
    if (!this.isSupported()) {
      throw new Error('Clipboard API not supported');
    }

    try {
      return await navigator.clipboard.read();
    } catch (error) {
      console.error('Error reading from clipboard:', error);
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
    try {
      const item = new ClipboardItem({ [imageBlob.type]: imageBlob });
      await this.write([item]);
    } catch (error) {
      console.error('Error copying image to clipboard:', error);
      throw error;
    }
  }

  async pasteImage(): Promise<Blob | null> {
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
      console.error('Error pasting image from clipboard:', error);
      return null;
    }
  }

  async clear(): Promise<void> {
    try {
      await this.writeText('');
      this.clipboardContent.set('');
    } catch (error) {
      console.error('Error clearing clipboard:', error);
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

  async requestReadPermission(): Promise<boolean> {
    try {
      await this.permissionsService.request({ name: 'clipboard-read' });
      return true;
    } catch (error) {
      console.error('Error requesting clipboard read permission:', error);
      return false;
    }
  }

  async requestWritePermission(): Promise<boolean> {
    try {
      await this.permissionsService.request({ name: 'clipboard-write' });
      return true;
    } catch (error) {
      console.error('Error requesting clipboard write permission:', error);
      return false;
    }
  }

  isClipboardSupported(): boolean {
    return this.isSupported();
  }
}
