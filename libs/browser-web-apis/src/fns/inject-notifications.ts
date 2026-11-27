import { PLATFORM_ID, assertInInjectionContext, inject, signal, type Signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface NotificationsRef {
  readonly permission: Signal<NotificationPermission>;
  readonly isSupported: Signal<boolean>;
  requestPermission: () => Promise<NotificationPermission>;
  show: (title: string, options?: NotificationOptions) => Promise<Notification>;
}

/**
 * Signal-first injection primitive for the Web Notifications API.
 * SSR-safe: returns `isSupported() === false` and `'default'` permission on the server.
 */
export function injectNotifications(): NotificationsRef {
  assertInInjectionContext(injectNotifications);
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);
  const supported = isBrowser && typeof Notification !== 'undefined';

  const isSupported = signal(supported);
  const permission = signal<NotificationPermission>(
    supported ? Notification.permission : 'default',
  );

  const requestPermission = async (): Promise<NotificationPermission> => {
    if (!supported) {
      throw new Error('Notifications API not supported in this environment');
    }
    const result = await Notification.requestPermission();
    permission.set(result);
    return result;
  };

  const show = async (title: string, options?: NotificationOptions): Promise<Notification> => {
    if (!supported) {
      throw new Error('Notifications API not supported in this environment');
    }
    if (Notification.permission !== 'granted') {
      throw new Error(
        'Notification permission required. Please grant notification access and try again.',
      );
    }
    return new Notification(title, options);
  };

  return {
    permission: permission.asReadonly(),
    isSupported: isSupported.asReadonly(),
    requestPermission,
    show,
  };
}
