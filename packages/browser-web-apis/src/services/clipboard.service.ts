import { Injectable } from '@angular/core';
import { BrowserApiBaseService } from './base/browser-api-base.service';

@Injectable()
export class ClipboardService extends BrowserApiBaseService {
  protected override getApiName(): string {
    return 'clipboard';
  }

  protected override ensureSupported(): void {
    super.ensureSupported();
    if (!navigator.clipboard) {
      throw new Error('Clipboard API not supported \u2014 a secure context (HTTPS) is required');
    }
  }

  async writeText(text: string): Promise<void> {
    this.ensureSupported();
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      this.logError('Error writing to clipboard:', error);
      throw error;
    }
  }

  async readText(): Promise<string> {
    this.ensureSupported();
    try {
      return await navigator.clipboard.readText();
    } catch (error) {
      this.logError('Error reading from clipboard:', error);
      throw error;
    }
  }
}
