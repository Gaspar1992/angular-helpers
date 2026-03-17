import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService();
    vi.clearAllMocks();
  });

  describe('isSupported', () => {
    it('should return true when Notification API is available', () => {
      Object.defineProperty(window, 'Notification', {
        value: { requestPermission: vi.fn() },
        writable: true
      });

      expect(service.isSupported()).toBe(true);
    });

    it('should return false when Notification API is not available', () => {
      Object.defineProperty(window, 'Notification', {
        value: undefined,
        writable: true
      });

      expect(service.isSupported()).toBe(false);
    });
  });

  describe('requestPermission', () => {
    it('should request notification permission successfully', async () => {
      const mockRequestPermission = vi.fn().mockResolvedValue('granted');
      
      Object.defineProperty(Notification, 'requestPermission', {
        value: mockRequestPermission,
        writable: true
      });

      const result = await service.requestPermission();

      expect(mockRequestPermission).toHaveBeenCalled();
      expect(result).toBe('granted');
    });

    it('should handle permission denial', async () => {
      const mockRequestPermission = vi.fn().mockResolvedValue('denied');
      
      Object.defineProperty(Notification, 'requestPermission', {
        value: mockRequestPermission,
        writable: true
      });

      const result = await service.requestPermission();

      expect(result).toBe('denied');
    });

    it('should throw error when Notification API is not supported', async () => {
      Object.defineProperty(Notification, 'requestPermission', {
        value: undefined,
        writable: true
      });

      await expect(service.requestPermission()).rejects.toThrow('Notification API not supported');
    });
  });

  describe('showNotification', () => {
    it('should show notification successfully', async () => {
      const mockRequestPermission = vi.fn().mockResolvedValue('granted');
      const mockNotification = vi.fn();
      
      Object.defineProperty(Notification, 'requestPermission', {
        value: mockRequestPermission,
        writable: true
      });
      
      Object.defineProperty(window, 'Notification', {
        value: mockNotification,
        writable: true
      });

      await service.showNotification({
        title: 'Test Notification',
        body: 'Test body'
      });

      expect(mockRequestPermission).toHaveBeenCalled();
      expect(mockNotification).toHaveBeenCalledWith('Test Notification', {
        body: 'Test body',
        icon: undefined,
        badge: undefined,
        dir: undefined,
        lang: undefined,
        requireInteraction: undefined,
        silent: undefined,
        tag: undefined,
        data: undefined
      });
    });

    it('should throw error when permission is not granted', async () => {
      const mockRequestPermission = vi.fn().mockResolvedValue('denied');
      
      Object.defineProperty(Notification, 'requestPermission', {
        value: mockRequestPermission,
        writable: true
      });

      await expect(service.showNotification({
        title: 'Test Notification',
        body: 'Test body'
      })).rejects.toThrow('Notification permission not granted');
    });

    it('should throw error when Notification API is not supported', async () => {
      Object.defineProperty(Notification, 'requestPermission', {
        value: undefined,
        writable: true
      });

      await expect(service.showNotification({
        title: 'Test Notification',
        body: 'Test body'
      })).rejects.toThrow('Notification API not supported');
    });
  });

  describe('hasPermission', () => {
    it('should return true when permission is granted', async () => {
      const mockRequestPermission = vi.fn().mockResolvedValue('granted');
      
      Object.defineProperty(Notification, 'requestPermission', {
        value: mockRequestPermission,
        writable: true
      });

      await service.requestPermission();

      expect(service.hasPermission()).toBe(true);
    });

    it('should return false when permission is not granted', async () => {
      const mockRequestPermission = vi.fn().mockResolvedValue('denied');
      
      Object.defineProperty(Notification, 'requestPermission', {
        value: mockRequestPermission,
        writable: true
      });

      await service.requestPermission();

      expect(service.hasPermission()).toBe(false);
    });
  });

  describe('isPermissionDenied', () => {
    it('should return true when permission is denied', async () => {
      const mockRequestPermission = vi.fn().mockResolvedValue('denied');
      
      Object.defineProperty(Notification, 'requestPermission', {
        value: mockRequestPermission,
        writable: true
      });

      await service.requestPermission();

      expect(service.isPermissionDenied()).toBe(true);
    });

    it('should return false when permission is not denied', async () => {
      const mockRequestPermission = vi.fn().mockResolvedValue('granted');
      
      Object.defineProperty(Notification, 'requestPermission', {
        value: mockRequestPermission,
        writable: true
      });

      await service.requestPermission();

      expect(service.isPermissionDenied()).toBe(false);
    });
  });

  describe('needsPermission', () => {
    it('should return true when permission is default', async () => {
      const mockRequestPermission = vi.fn().mockResolvedValue('default');
      
      Object.defineProperty(Notification, 'requestPermission', {
        value: mockRequestPermission,
        writable: true
      });

      await service.requestPermission();

      expect(service.needsPermission()).toBe(true);
    });

    it('should return false when permission is not default', async () => {
      const mockRequestPermission = vi.fn().mockResolvedValue('granted');
      
      Object.defineProperty(Notification, 'requestPermission', {
        value: mockRequestPermission,
        writable: true
      });

      await service.requestPermission();

      expect(service.needsPermission()).toBe(false);
    });
  });

  describe('closeNotification', () => {
    it('should close notification by ID', () => {
      const mockNotification = { close: vi.fn() };
      const mockNotifications = new Map([['test-id', mockNotification]]);
      
      service['notifications'].set(mockNotifications);

      service.closeNotification('test-id');

      expect(mockNotification.close).toHaveBeenCalled();
    });

    it('should not throw when notification ID does not exist', () => {
      expect(() => service.closeNotification('non-existent-id')).not.toThrow();
    });
  });

  describe('closeAllNotifications', () => {
    it('should close all notifications', () => {
      const mockNotification1 = { close: vi.fn() };
      const mockNotification2 = { close: vi.fn() };
      const mockNotifications = new Map([
        ['id1', mockNotification1],
        ['id2', mockNotification2]
      ]);
      
      service['notifications'].set(mockNotifications);

      service.closeAllNotifications();

      expect(mockNotification1.close).toHaveBeenCalled();
      expect(mockNotification2.close).toHaveBeenCalled();
      expect(service['notifications']().size).toBe(0);
    });
  });

  describe('getNotificationCount', () => {
    it('should return correct notification count', () => {
      const mockNotifications = new Map([
        ['id1', {}],
        ['id2', {}],
        ['id3', {}]
      ]);
      
      service['notifications'].set(mockNotifications);

      expect(service.getNotificationCount()).toBe(3);
    });

    it('should return 0 when no notifications', () => {
      expect(service.getNotificationCount()).toBe(0);
    });
  });

  describe('getNotifications', () => {
    it('should return array of notifications', () => {
      const mockNotification1 = { id: 'id1' };
      const mockNotification2 = { id: 'id2' };
      const mockNotifications = new Map([
        ['id1', mockNotification1],
        ['id2', mockNotification2]
      ]);
      
      service['notifications'].set(mockNotifications);

      const notifications = service.getNotifications();

      expect(notifications).toHaveLength(2);
      expect(notifications).toContain(mockNotification1);
      expect(notifications).toContain(mockNotification2);
    });

    it('should return empty array when no notifications', () => {
      const notifications = service.getNotifications();

      expect(notifications).toEqual([]);
    });
  });

  describe('observePermission', () => {
    it('should return observable for permission changes', async () => {
      const mockRequestPermission = vi.fn().mockResolvedValue('granted');
      
      Object.defineProperty(Notification, 'requestPermission', {
        value: mockRequestPermission,
        writable: true
      });

      const observable = service.observePermission();

      expect(observable).toBeDefined();
    });
  });

  describe('ngOnDestroy', () => {
    it('should close all notifications on destroy', () => {
      const mockNotification1 = { close: vi.fn() };
      const mockNotification2 = { close: vi.fn() };
      const mockNotifications = new Map([
        ['id1', mockNotification1],
        ['id2', mockNotification2]
      ]);
      
      service['notifications'].set(mockNotifications);

      service.ngOnDestroy();

      expect(mockNotification1.close).toHaveBeenCalled();
      expect(mockNotification2.close).toHaveBeenCalled();
    });
  });
});
