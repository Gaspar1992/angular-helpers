import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PermissionsService } from './permissions.service';

describe('PermissionsService', () => {
  let service: PermissionsService;

  beforeEach(() => {
    service = new PermissionsService();
    vi.clearAllMocks();
  });

  describe('isSupported', () => {
    it('should return true when permissions API is available', () => {
      Object.defineProperty(navigator, 'permissions', {
        value: { query: vi.fn() },
        writable: true
      });

      expect(service.isSupported()).toBe(true);
    });

    it('should return false when permissions API is not available', () => {
      Object.defineProperty(navigator, 'permissions', {
        value: undefined,
        writable: true
      });

      expect(service.isSupported()).toBe(false);
    });
  });

  describe('query', () => {
    it('should query permission status successfully', async () => {
      const mockStatus = { state: 'granted' };
      const mockQuery = vi.fn().mockResolvedValue(mockStatus);
      
      Object.defineProperty(navigator, 'permissions', {
        value: { query: mockQuery },
        writable: true
      });

      const result = await service.query({ name: 'camera' as PermissionName });

      expect(mockQuery).toHaveBeenCalledWith({ name: 'camera' });
      expect(result).toBe(mockStatus);
    });

    it('should throw error when permissions API is not supported', async () => {
      Object.defineProperty(navigator, 'permissions', {
        value: undefined,
        writable: true
      });

      await expect(service.query({ name: 'camera' as PermissionName }))
        .rejects.toThrow('Permissions API not supported');
    });
  });

  describe('request', () => {
    it('should request camera permission successfully', async () => {
      const mockStream = { getTracks: () => [{ stop: vi.fn() }] };
      const mockGetUserMedia = vi.fn().mockResolvedValue(mockStream);
      
      Object.defineProperty(navigator, 'mediaDevices', {
        value: { getUserMedia: mockGetUserMedia },
        writable: true
      });

      const result = await service.request({ name: 'camera' as PermissionName });

      expect(mockGetUserMedia).toHaveBeenCalledWith({ video: true });
      expect(result.state).toBe('granted');
    });

    it('should request microphone permission successfully', async () => {
      const mockStream = { getTracks: () => [{ stop: vi.fn() }] };
      const mockGetUserMedia = vi.fn().mockResolvedValue(mockStream);
      
      Object.defineProperty(navigator, 'mediaDevices', {
        value: { getUserMedia: mockGetUserMedia },
        writable: true
      });

      const result = await service.request({ name: 'microphone' as PermissionName });

      expect(mockGetUserMedia).toHaveBeenCalledWith({ audio: true });
      expect(result.state).toBe('granted');
    });

    it('should request notification permission successfully', async () => {
      const mockRequestPermission = vi.fn().mockResolvedValue('granted');
      
      Object.defineProperty(Notification, 'requestPermission', {
        value: mockRequestPermission,
        writable: true
      });

      const result = await service.request({ name: 'notifications' as PermissionName });

      expect(mockRequestPermission).toHaveBeenCalled();
      expect(result.state).toBe('granted');
    });

    it('should handle geolocation permission request', async () => {
      const mockGetCurrentPosition = vi.fn((success) => {
        success({
          coords: { latitude: 40.7128, longitude: -74.0060 },
          timestamp: Date.now()
        });
      });
      
      Object.defineProperty(navigator, 'geolocation', {
        value: { getCurrentPosition: mockGetCurrentPosition },
        writable: true
      });

      const result = await service.request({ name: 'geolocation' as PermissionName });

      expect(mockGetCurrentPosition).toHaveBeenCalled();
      expect(result.state).toBe('granted');
    });

    it('should handle unsupported permissions', async () => {
      const result = await service.request({ name: 'unknown-permission' as PermissionName });

      expect(result.state).toBe('unsupported');
    });

    it('should handle permission denial for camera', async () => {
      const mockGetUserMedia = vi.fn().mockRejectedValue(new Error('Permission denied'));
      
      Object.defineProperty(navigator, 'mediaDevices', {
        value: { getUserMedia: mockGetUserMedia },
        writable: true
      });

      const result = await service.request({ name: 'camera' as PermissionName });

      expect(result.state).toBe('denied');
    });
  });

  describe('isGranted', () => {
    it('should return true when permission is granted', () => {
      const mockStatus = { state: 'granted' };
      const mockQuery = vi.fn().mockResolvedValue(mockStatus);
      
      Object.defineProperty(navigator, 'permissions', {
        value: { query: mockQuery },
        writable: true
      });

      expect(service.isGranted('camera')).toBe(true);
      expect(mockQuery).toHaveBeenCalledWith({ name: 'camera' });
    });

    it('should return false when permission is not granted', () => {
      const mockStatus = { state: 'denied' };
      const mockQuery = vi.fn().mockResolvedValue(mockStatus);
      
      Object.defineProperty(navigator, 'permissions', {
        value: { query: mockQuery },
        writable: true
      });

      expect(service.isGranted('camera')).toBe(false);
    });

    it('should return false when permissions API is not supported', () => {
      Object.defineProperty(navigator, 'permissions', {
        value: undefined,
        writable: true
      });

      expect(service.isGranted('camera')).toBe(false);
    });
  });

  describe('isDenied', () => {
    it('should return true when permission is denied', () => {
      const mockStatus = { state: 'denied' };
      const mockQuery = vi.fn().mockResolvedValue(mockStatus);
      
      Object.defineProperty(navigator, 'permissions', {
        value: { query: mockQuery },
        writable: true
      });

      expect(service.isDenied('camera')).toBe(true);
    });

    it('should return false when permission is not denied', () => {
      const mockStatus = { state: 'granted' };
      const mockQuery = vi.fn().mockResolvedValue(mockStatus);
      
      Object.defineProperty(navigator, 'permissions', {
        value: { query: mockQuery },
        writable: true
      });

      expect(service.isDenied('camera')).toBe(false);
    });
  });

  describe('observePermission', () => {
    it('should observe permission changes', async () => {
      const mockStatus = { state: 'granted', addEventListener: vi.fn() };
      const mockQuery = vi.fn().mockResolvedValue(mockStatus);
      
      Object.defineProperty(navigator, 'permissions', {
        value: { query: mockQuery },
        writable: true
      });

      const callback = vi.fn();
      const observable = service.observePermission('camera');
      
      observable.subscribe(callback);
      
      expect(mockQuery).toHaveBeenCalledWith({ name: 'camera' });
    });
  });
});
