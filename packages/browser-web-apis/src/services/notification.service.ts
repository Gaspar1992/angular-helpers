import { Injectable } from '@angular/core';
import { BrowserApiBaseService } from './base/browser-api-base.service';

@Injectable()
export class NotificationService extends BrowserApiBaseService {
  protected override getApiName(): string {
    return 'notifications';
  }

  protected override ensureSupported(): void {
    super.ensureSupported();
    if (!('Notification' in window)) {
      throw new Error('Notifications API not supported in this browser');
    }
  }

  get permission(): NotificationPermission {
    if (!this.isBrowserEnvironment() || !('Notification' in window)) {
      return 'default';
    }
    return Notification.permission;
  }

  async requestNotificationPermission(): Promise<NotificationPermission> {
    this.ensureSupported();
    return Notification.requestPermission();
  }

  async showNotification(title: string, options?: NotificationOptions): Promise<Notification> {
    this.ensureSupported();

    if (Notification.permission !== 'granted') {
      throw new Error(
        'Notification permission required. Please grant notification access and try again.',
      );
    }

    try {
      return new Notification(title, options);
    } catch (error) {
      this.logError('Error showing notification:', error);
      throw error;
    }
  }
}
