import { Injectable } from '@angular/core';
import { BrowserApiBaseService } from './base/browser-api-base.service';

@Injectable()
export class NotificationService extends BrowserApiBaseService {
  protected override getApiName(): string {
    return 'notifications';
  }

  get permission(): NotificationPermission {
    return Notification.permission;
  }

  isSupported(): boolean {
    return this.isBrowserEnvironment() && 'Notification' in window;
  }

  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error('Notification API not supported in this browser');
    }
    return Notification.requestPermission();
  }

  async showNotification(title: string, options?: NotificationOptions): Promise<Notification> {
    if (!this.isSupported()) {
      throw new Error('Notification API not supported in this browser');
    }

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
