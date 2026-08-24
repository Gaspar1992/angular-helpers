import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { NotificationService } from './notification.service';
import { BrowserCapabilityService } from './browser-capability.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let MockNotification: any;

  beforeEach(() => {
    MockNotification = vi.fn(function (this: any, title: string, options?: any) {
      this.title = title;
      this.options = options;
      return this;
    });
    MockNotification.permission = 'granted';
    MockNotification.requestPermission = vi.fn().mockResolvedValue('granted');

    vi.stubGlobal('Notification', MockNotification);

    TestBed.configureTestingModule({
      providers: [NotificationService, BrowserCapabilityService],
    });
    service = TestBed.inject(NotificationService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should be created and verify support', () => {
    expect(service).toBeTruthy();
    expect(service.isSupported()).toBe(true);
    expect(service.permission).toBe('granted');
  });

  it('should request notification permission', async () => {
    const result = await service.requestNotificationPermission();
    expect(result).toBe('granted');
    expect(MockNotification.requestPermission).toHaveBeenCalled();
  });

  it('should show notification when permission is granted', async () => {
    const notif = await service.showNotification('New Message', { body: 'Hello!' });
    expect(notif).toBeDefined();
    expect(MockNotification).toHaveBeenCalledWith('New Message', { body: 'Hello!' });
  });

  it('should throw error when permission is not granted', async () => {
    MockNotification.permission = 'denied';
    await expect(service.showNotification('Test')).rejects.toThrow(
      /Notification permission required/,
    );
  });

  it('should throw error and log when notification constructor throws', async () => {
    vi.stubGlobal(
      'Notification',
      class ThrowingNotification {
        static permission = 'granted';
        constructor() {
          throw new Error('OS Notification Error');
        }
      },
    );

    await expect(service.showNotification('Test')).rejects.toThrow('OS Notification Error');
  });

  it('should return default permission on server platform', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        BrowserCapabilityService,
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });
    const serverService = TestBed.inject(NotificationService);
    expect(serverService.isSupported()).toBe(false);
    expect(serverService.permission).toBe('default');
  });
});
