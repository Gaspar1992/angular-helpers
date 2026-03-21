import { Injectable, signal, OnDestroy } from '@angular/core';
import { from, Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { BrowserSupportUtil } from '../utils/browser-support.util';
import { BrowserApiBaseService } from './base/browser-api-base.service';

export interface NotificationOptions {
  title: string;
  body?: string;
  icon?: string;
  badge?: string;
  dir?: 'auto' | 'ltr' | 'rtl';
  lang?: string;
  renotify?: boolean;
  requireInteraction?: boolean;
  silent?: boolean;
  tag?: string;
  data?: any;
  actions?: NotificationAction[];
  vibrate?: number[];
  timestamp?: number;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

type NotificationPermission = 'default' | 'granted' | 'denied';

@Injectable()
export class NotificationService extends BrowserApiBaseService implements OnDestroy {
  private permission = signal<NotificationPermission>('default');
  private notifications = signal<Map<string, Notification>>(new Map());
  
  constructor() {
    super();
    this.initializeNotifications();
  }

  protected override getApiName(): string {
    return 'notifications';
  }

  private async initializeNotifications(): Promise<void> {
    if (!this.isSupported() || this.isServerEnvironment()) {
      this.logWarning('Notification API not supported in this browser or server environment');
      return;
    }

    if ('Notification' in window) {
      this.permission.set((window as any).Notification.permission);
    }
  }

  readonly notifications$ = this.notifications.asReadonly();
  readonly permission$ = this.permission.asReadonly();

  override async requestPermission(): Promise<boolean> {
    if (!this.isSupported() || this.isServerEnvironment()) {
      throw new Error('Notification API not supported or not available in server environment');
    }

    if (!('Notification' in window)) {
      throw new Error('Notification API not available');
    }

    try {
      const permissionResult = await (window as any).Notification.requestPermission();
      this.permission.set(permissionResult);
      return permissionResult === 'granted';
    } catch (error) {
      this.logError('Error requesting notification permission:', error);
      throw error;
    }
  }

  async showNotification(options: NotificationOptions): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Notification API not supported');
    }

    if (!('Notification' in window)) {
      throw new Error('Notification API not available');
    }

    const permission = await this.ensurePermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    try {
      const notification = new (window as any).Notification(options.title, {
        body: options.body,
        icon: options.icon,
        badge: options.badge,
        dir: options.dir,
        lang: options.lang,
        requireInteraction: options.requireInteraction,
        silent: options.silent,
        tag: options.tag,
        data: options.data
      });

      this.addNotification(notification);
      this.setupNotificationListeners(notification);
    } catch (error) {
      console.error('Error showing notification:', error);
      throw error;
    }
  }

  closeNotification(notificationId: string): void {
    const notification = this.notifications().get(notificationId);
    if (notification) {
      notification.close();
      this.removeNotification(notificationId);
    }
  }

  closeAllNotifications(): void {
    const notifications = this.notifications();
    notifications.forEach((notification) => {
      notification.close();
    });
    this.notifications.set(new Map());
  }

  getNotificationCount(): number {
    return this.notifications().size;
  }

  getNotifications(): Notification[] {
    return Array.from(this.notifications().values());
  }

  override isSupported(): boolean {
    return BrowserSupportUtil.isSupported('notifications');
  }

  hasPermission(): boolean {
    return this.permission() === 'granted';
  }

  isPermissionDenied(): boolean {
    return this.permission() === 'denied';
  }

  needsPermission(): boolean {
    return this.permission() === 'default';
  }

  observePermission(): Observable<NotificationPermission> {
    return from(this.requestPermission()).pipe(
      catchError(() => from(['denied' as NotificationPermission])),
      map(result => result ? 'granted' as NotificationPermission : 'denied' as NotificationPermission)
    );
  }

  private async ensurePermission(): Promise<NotificationPermission> {
    let permission = this.permission();
    
    if (permission === 'default') {
      const granted = await this.requestPermission();
      permission = granted ? 'granted' : 'denied';
    }
    
    return permission;
  }

  private addNotification(notification: Notification): void {
    const notificationId = this.generateNotificationId(notification);
    this.notifications.update(map => map.set(notificationId, notification));
  }

  private removeNotification(notificationId: string): void {
    this.notifications.update(map => {
      map.delete(notificationId);
      return map;
    });
  }

  private generateNotificationId(notification: Notification): string {
    return `${notification.title}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupNotificationListeners(notification: Notification): void {
    notification.addEventListener('click', () => {
      console.log('Notification clicked:', notification);
      this.handleNotificationClick(notification);
    });

    notification.addEventListener('close', () => {
      console.log('Notification closed:', notification);
      this.removeNotification(this.generateNotificationId(notification));
    });

    notification.addEventListener('error', (event) => {
      console.error('Notification error:', event);
    });

    notification.addEventListener('show', () => {
      console.log('Notification shown:', notification);
    });
  }

  private handleNotificationClick(notification: Notification): void {
    if (!document.hasFocus()) {
      window.focus();
    }

    if (notification.data?.url) {
      window.open(notification.data.url);
    }
  }

  ngOnDestroy(): void {
    this.closeAllNotifications();
    // No manual cleanup needed with takeUntilDestroyed
  }
}
