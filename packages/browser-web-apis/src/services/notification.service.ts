import { Injectable } from '@angular/core';
import { BrowserApiBaseService } from './base/browser-api-base.service';

@Injectable()
export class NotificationService extends BrowserApiBaseService {
  protected override getApiName(): string {
    return 'notifications';
  }

  async showNotification(title: string, options?: NotificationOptions): Promise<Notification> {
    if (!('Notification' in window)) {
      throw new Error('Notification API not supported in this browser');
    }

    const permissionStatus = await this.permissionsService.query({ name: 'notifications' });
    if (permissionStatus.state !== 'granted') {
      throw new Error(
        'Notification permission required. Please grant notification access and try again.',
      );
    }

    try {
      return new Notification(title, options);
    } catch (error) {
      console.error('[NotificationService] Error showing notification:', error);
      throw error;
    }
  }

  // Direct access to native notification API
}
