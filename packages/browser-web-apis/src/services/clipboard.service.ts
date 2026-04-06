import { Injectable } from '@angular/core';
import { BrowserApiBaseService } from './base/browser-api-base.service';

@Injectable()
export class ClipboardService extends BrowserApiBaseService {
  protected override getApiName(): string {
    return 'clipboard';
  }

  private async ensureClipboardPermission(action: 'read' | 'write'): Promise<void> {
    if (!('clipboard' in navigator)) {
      throw new Error('Clipboard API not supported in this browser');
    }

    const permissionStatus = await this.permissionsService.query({
      name: `clipboard-${action}` as PermissionName,
    });
    if (permissionStatus.state !== 'granted') {
      throw new Error(
        `Clipboard ${action} permission required. Please grant clipboard access and try again.`,
      );
    }
  }

  async writeText(text: string): Promise<void> {
    await this.ensureClipboardPermission('write');

    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('[ClipboardService] Error writing to clipboard:', error);
      throw error;
    }
  }

  async readText(): Promise<string> {
    await this.ensureClipboardPermission('read');
    try {
      return await navigator.clipboard.readText();
    } catch (error) {
      console.error('[ClipboardService] Error reading from clipboard:', error);
      throw error;
    }
  }
}
