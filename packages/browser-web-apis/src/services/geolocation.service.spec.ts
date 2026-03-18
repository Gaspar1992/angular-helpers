import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { GeolocationService } from './geolocation.service';
import { PermissionsService } from './permissions.service';
import { 
  GeolocationPosition, 
  GeolocationOptions, 
  GeolocationError 
} from '../interfaces/geolocation.interface';

describe('GeolocationService', () => {
  let service: GeolocationService;
  let mockGeolocation: any;
  let mockNavigator: any;
  let mockPermissionsService: any;

  beforeEach(() => {
    mockGeolocation = {
      getCurrentPosition: vi.fn(),
      watchPosition: vi.fn(),
      clearWatch: vi.fn()
    };

    mockNavigator = {
      geolocation: mockGeolocation
    };

    mockPermissionsService = {
      isGranted: vi.fn(),
      request: vi.fn()
    };

    // Mock global browser objects
    global.navigator = mockNavigator;
    global.window = {} as any;

    TestBed.configureTestingModule({
      providers: [
        GeolocationService,
        { provide: PermissionsService, useValue: mockPermissionsService },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });
    service = TestBed.inject(GeolocationService);
  });

  describe('getCurrentPosition', () => {
    it('should get current position successfully', async () => {
      const mockPosition: GeolocationPosition = {
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
          altitude: null,
          accuracy: 10,
          altitudeAccuracy: null,
          heading: null,
          speed: null
        },
        timestamp: Date.now()
      };

      const options: GeolocationOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      };

      mockPermissionsService.isGranted.mockResolvedValue(true);
      mockGeolocation.getCurrentPosition.mockImplementation(
        (success: any) => success(mockPosition)
      );

      const result = await service.getCurrentPosition(options);

      expect(result).toEqual(mockPosition);
      expect(mockPermissionsService.isGranted).toHaveBeenCalledWith('geolocation');
      expect(mockPermissionsService.request).not.toHaveBeenCalled();
      expect(service.currentPosition$()).toEqual(mockPosition);
    });

    it('should request permission when not granted', async () => {
      const mockPosition: GeolocationPosition = {
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
          altitude: null,
          accuracy: 10,
          altitudeAccuracy: null,
          heading: null,
          speed: null
        },
        timestamp: Date.now()
      };

      mockPermissionsService.isGranted.mockResolvedValue(false);
      mockPermissionsService.request.mockResolvedValue({ state: 'granted' });
      mockGeolocation.getCurrentPosition.mockImplementation(
        (success: any) => success(mockPosition)
      );

      const result = await service.getCurrentPosition();

      expect(result).toEqual(mockPosition);
      expect(mockPermissionsService.isGranted).toHaveBeenCalledWith('geolocation');
      expect(mockPermissionsService.request).toHaveBeenCalledWith({ name: 'geolocation' });
    });

    it('should handle geolocation error', async () => {
      const mockError: GeolocationError = {
        code: 1,
        message: 'User denied Geolocation',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3
      };

      mockPermissionsService.isGranted.mockResolvedValue(true);
      mockGeolocation.getCurrentPosition.mockImplementation(
        (success: any, error: any) => error(mockError)
      );

      await expect(service.getCurrentPosition()).rejects.toThrow('User denied Geolocation');
    });

    it('should throw error in server environment', async () => {
      // Mock server environment
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          GeolocationService,
          { provide: PermissionsService, useValue: mockPermissionsService },
          { provide: PLATFORM_ID, useValue: 'server' }
        ]
      });
      const serverService = TestBed.inject(GeolocationService);

      await expect(service.getCurrentPosition()).rejects.toThrow(
        'Geolocation API not supported or not available in server environment'
      );
    });

    it('should throw error when geolocation is not supported', async () => {
      global.navigator = null as any;

      await expect(service.getCurrentPosition()).rejects.toThrow(
        'Geolocation API not supported or not available in server environment'
      );
    });
  });

  describe('watchPosition', () => {
    it('should start watching position with callbacks', () => {
      const mockPosition: GeolocationPosition = {
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
          altitude: null,
          accuracy: 10,
          altitudeAccuracy: null,
          heading: null,
          speed: null
        },
        timestamp: Date.now()
      };

      const successCallback = vi.fn();
      const errorCallback = vi.fn();
      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      };

      let actualSuccessCallback: any;
      let actualErrorCallback: any;
      mockGeolocation.watchPosition.mockImplementation(
        (success: any, error: any, opts: any) => {
          actualSuccessCallback = success;
          actualErrorCallback = error;
          return 12345; // watchId
        }
      );

      const watchId = service.watchPosition(successCallback, errorCallback, options);

      expect(watchId).toBe(12345);
      expect(mockGeolocation.watchPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        options
      );

      // Simulate position update
      actualSuccessCallback(mockPosition);

      expect(successCallback).toHaveBeenCalledWith(mockPosition);
      expect(service.watchPositions$().get(12345)).toEqual(mockPosition);

      // Simulate error
      const mockError: GeolocationError = {
        code: 3,
        message: 'Timeout expired',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3
      };

      actualErrorCallback(mockError);

      expect(errorCallback).toHaveBeenCalledWith(mockError);
      expect(service.watchErrors$().get(12345)).toEqual(mockError);
    });

    it('should handle missing error callback', () => {
      const mockPosition: GeolocationPosition = {
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
          altitude: null,
          accuracy: 10,
          altitudeAccuracy: null,
          heading: null,
          speed: null
        },
        timestamp: Date.now()
      };

      const successCallback = vi.fn();

      let actualErrorCallback: any;
      mockGeolocation.watchPosition.mockImplementation(
        (success: any, error: any) => {
          actualErrorCallback = error;
          return 12345;
        }
      );

      service.watchPosition(successCallback);

      // Simulate error without callback
      const mockError: GeolocationError = {
        code: 3,
        message: 'Timeout expired',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3
      };

      expect(() => actualErrorCallback(mockError)).not.toThrow();
      expect(service.watchErrors$().get(12345)).toEqual(mockError);
    });

    it('should throw error when geolocation is not supported', () => {
      global.navigator = null as any;

      expect(() => service.watchPosition(vi.fn())).toThrow(
        'Geolocation API not supported or not available in server environment'
      );
    });
  });

  describe('clearWatch', () => {
    it('should clear watch', () => {
      const watchId = 12345;
      
      mockGeolocation.clearWatch.mockImplementation(() => {});

      service.clearWatch(watchId);

      expect(mockGeolocation.clearWatch).toHaveBeenCalledWith(watchId);
    });

    it('should handle clearing when not supported', () => {
      // Mock server environment
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          GeolocationService,
          { provide: PermissionsService, useValue: mockPermissionsService },
          { provide: PLATFORM_ID, useValue: 'server' }
        ]
      });
      const serverService = TestBed.inject(GeolocationService);

      expect(() => service.clearWatch(12345)).not.toThrow();
    });
  });

  describe('isSupported', () => {
    it('should return true when geolocation is available', () => {
      expect(service.isSupported()).toBe(true);
    });

    it('should return false when geolocation is not available', () => {
      vi.mocked().mockReturnValue({
        geolocation: undefined
      } as any);

      expect(service.isSupported()).toBe(false);
    });

    it('should return false when navigator is not available', () => {
      global.navigator = null as any;

      expect(service.isSupported()).toBe(false);
    });

    it('should return false in server environment', () => {
      // Mock server environment
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          GeolocationService,
          { provide: PermissionsService, useValue: mockPermissionsService },
          { provide: PLATFORM_ID, useValue: 'server' }
        ]
      });
      const serverService = TestBed.inject(GeolocationService);

      expect(service.isSupported()).toBe(false);
    });
  });

  describe('signals', () => {
    it('should expose readonly signals', () => {
      expect(service.currentPosition$).toBeDefined();
      expect(service.watchPositions$).toBeDefined();
      expect(service.watchErrors$).toBeDefined();
    });

    it('should update position signal on getCurrentPosition', async () => {
      const mockPosition: GeolocationPosition = {
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
          altitude: null,
          accuracy: 10,
          altitudeAccuracy: null,
          heading: null,
          speed: null
        },
        timestamp: Date.now()
      };

      mockPermissionsService.isGranted.mockResolvedValue(true);
      mockGeolocation.getCurrentPosition.mockImplementation(
        (success: any) => success(mockPosition)
      );

      await service.getCurrentPosition();

      expect(service.currentPosition$()).toEqual(mockPosition);
    });
  });

  describe('error handling', () => {
    it('should handle permission denied error', async () => {
      const mockError: GeolocationError = {
        code: 1,
        message: 'User denied Geolocation',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3
      };

      mockPermissionsService.isGranted.mockResolvedValue(true);
      mockGeolocation.getCurrentPosition.mockImplementation(
        (success: any, error: any) => error(mockError)
      );

      await expect(service.getCurrentPosition()).rejects.toThrow('User denied Geolocation');
    });

    it('should handle position unavailable error', async () => {
      const mockError: GeolocationError = {
        code: 2,
        message: 'Position unavailable',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3
      };

      mockPermissionsService.isGranted.mockResolvedValue(true);
      mockGeolocation.getCurrentPosition.mockImplementation(
        (success: any, error: any) => error(mockError)
      );

      await expect(service.getCurrentPosition()).rejects.toThrow('Position unavailable');
    });

    it('should handle timeout error', async () => {
      const mockError: GeolocationError = {
        code: 3,
        message: 'Timeout expired',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3
      };

      mockPermissionsService.isGranted.mockResolvedValue(true);
      mockGeolocation.getCurrentPosition.mockImplementation(
        (success: any, error: any) => error(mockError)
      );

      await expect(service.getCurrentPosition()).rejects.toThrow('Timeout expired');
    });
  });
});
