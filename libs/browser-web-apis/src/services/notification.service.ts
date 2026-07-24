import { Injectable } from '@angular/core';
import { BrowserApiBaseService } from './base/browser-api-base.service';
import type { BrowserCapabilityId } from './browser-capability.service';

@Injectable()
export class NotificationService extends BrowserApiBaseService {
  protected override getApiName(): string {
    return 'notifications';
  }

  protected override getCapabilityId(): BrowserCapabilityId {
    return 'notification';
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
