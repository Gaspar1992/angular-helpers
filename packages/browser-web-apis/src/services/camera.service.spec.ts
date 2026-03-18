import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { CameraService } from './camera.service';
import { CameraPermissionHelperService } from './camera-permission-helper.service';
import { MediaDevice, MediaStreamConstraints } from '../interfaces/media.interface';

// Mock dependencies
vi.mock('../utils/ssr-safe.util', () => ({
    getNavigator: vi.fn(() => ({
      mediaDevices: {
        getUserMedia: vi.fn(),
        enumerateDevices: vi.fn()
      }
    }))
  }
}));

describe('CameraService', () => {
  let service: CameraService;
  let mockPermissionHelper: any;
  let mockDomSanitizer: any;
  let mockNavigator: any;
  let mockMediaDevices: any;

  beforeEach(() => {
    mockMediaDevices = {
      getUserMedia: vi.fn(),
      enumerateDevices: vi.fn()
    };

    mockNavigator = {
      mediaDevices: mockMediaDevices
    };

    mockPermissionHelper = {
      checkAndRequestPermission: vi.fn(),
      hasPermission: vi.fn()
    };

    mockDomSanitizer = {
      bypassSecurityTrustUrl: vi.fn()
    };

    service = TestBed.inject(CameraService);
  });

  describe('startCamera', () => {
    it('should start camera successfully with permission', async () => {
      const constraints: MediaStreamConstraints = {
        video: { width: 640, height: 480 }
      };
      const mockStream = new MediaStream();
      
      mockPermissionHelper.checkAndRequestPermission.mockResolvedValue(true);
      mockMediaDevices.getUserMedia.mockResolvedValue(mockStream);

      const result = await service.startCamera(constraints);

      expect(result).toBe(mockStream);
      expect(mockPermissionHelper.checkAndRequestPermission).toHaveBeenCalled();
      expect(mockMediaDevices.getUserMedia).toHaveBeenCalledWith(constraints);
      expect(service.isStreaming$()).toBe(true);
      expect(service.currentStream$()).toBe(mockStream);
    });

    it('should throw error when permission is denied', async () => {
      mockPermissionHelper.checkAndRequestPermission.mockResolvedValue(false);

      await expect(service.startCamera()).rejects.toThrow(
        'Camera permission is required to use the camera. Please allow camera access in your browser settings.'
      );
    });

    it('should throw error in server environment', async () => {

    it('should handle getUserMedia error', async () => {
      const error = new Error('Device not found');
      mockPermissionHelper.checkAndRequestPermission.mockResolvedValue(true);
      mockMediaDevices.getUserMedia.mockRejectedValue(error);

      await expect(service.startCamera()).rejects.toThrow('Device not found');
    });
  });

  describe('stopCamera', () => {
    it('should stop camera and clear stream', () => {
      const mockStream = {
        getTracks: vi.fn(() => [
          { stop: vi.fn() },
          { stop: vi.fn() }
        ])
      };

      // Manually set stream for testing
      (service as any).currentStream.set(mockStream);
      (service as any).isStreaming.set(true);

      service.stopCamera();

      expect(mockStream.getTracks).toHaveBeenCalled();
      expect(mockStream.getTracks()[0].stop).toHaveBeenCalled();
      expect(mockStream.getTracks()[1].stop).toHaveBeenCalled();
      expect(service.isStreaming$()).toBe(false);
      expect(service.currentStream$()).toBe(null);
    });

    it('should handle null stream gracefully', () => {
      expect(() => service.stopCamera()).not.toThrow();
      expect(service.isStreaming$()).toBe(false);
    });
  });

  describe('switchCamera', () => {
    it('should switch to different camera device', async () => {
      const devices: MediaDevice[] = [
        {
          deviceId: 'camera1',
          label: 'Front Camera',
          kind: 'videoinput',
          groupId: 'group1'
        },
        {
          deviceId: 'camera2',
          label: 'Back Camera',
          kind: 'videoinput',
          groupId: 'group2'
        }
      ];

      const mockStream = new MediaStream();
      
      mockPermissionHelper.checkAndRequestPermission.mockResolvedValue(true);
      mockMediaDevices.getUserMedia.mockResolvedValue(mockStream);
      mockMediaDevices.enumerateDevices.mockResolvedValue(devices);

      // Start with first camera
      await service.startCamera({ video: { deviceId: 'camera1' } });
      
      // Switch to second camera
      await service.switchCamera('camera2');

      expect(mockMediaDevices.getUserMedia).toHaveBeenCalledWith({
        video: { deviceId: 'camera2' }
      });
      expect(service.currentStream$()).toBe(mockStream);
    });

    it('should throw error when device not found', async () => {
      const devices: MediaDevice[] = [
        {
          deviceId: 'camera1',
          label: 'Front Camera',
          kind: 'videoinput',
          groupId: 'group1'
        }
      ];

      mockMediaDevices.enumerateDevices.mockResolvedValue(devices);

      await expect(service.switchCamera('nonexistent')).rejects.toThrow(
        'Camera device with ID nonexistent not found'
      );
    });
  });

  describe('videoInputs signal', () => {
    it('should return available video input devices', async () => {
      const devices: MediaDevice[] = [
        {
          deviceId: 'camera1',
          label: 'Front Camera',
          kind: 'videoinput',
          groupId: 'group1'
        },
        {
          deviceId: 'mic1',
          label: 'Microphone',
          kind: 'audioinput',
          groupId: 'group2'
        },
        {
          deviceId: 'camera2',
          label: 'Back Camera',
          kind: 'videoinput',
          groupId: 'group3'
        }
      ];

      mockMediaDevices.enumerateDevices.mockResolvedValue(devices);

      // Trigger device enumeration
      await service['refreshDevices']();

      const result = service.videoInputs$();

      expect(result).toHaveLength(2);
      expect(result[0].deviceId).toBe('camera1');
      expect(result[1].deviceId).toBe('camera2');
      expect(mockMediaDevices.enumerateDevices).toHaveBeenCalled();
    });
  });

  describe('isSupported', () => {
    it('should return true when mediaDevices is available', () => {
      expect(service.isSupported()).toBe(true);
    });

    it('should return false when mediaDevices is not available', () => {

    it('should return false when getUserMedia is not available', () => {

    it('should return false in server environment', () => {
  });

  describe('signals', () => {
    it('should expose readonly signals', () => {
      expect(service.currentStream$).toBeDefined();
      expect(service.isStreaming$).toBeDefined();
      expect(service.videoInputs$).toBeDefined();
    });

    it('should update signals when stream changes', async () => {
      const mockStream = new MediaStream();
      
      mockPermissionHelper.checkAndRequestPermission.mockResolvedValue(true);
      mockMediaDevices.getUserMedia.mockResolvedValue(mockStream);

      await service.startCamera();

      expect(service.isStreaming$()).toBe(true);
      expect(service.currentStream$()).toBe(mockStream);
    });
  });

  describe('error handling', () => {
    it('should handle permission helper error', async () => {
      const error = new Error('Permission check failed');
      mockPermissionHelper.checkAndRequestPermission.mockRejectedValue(error);

      await expect(service.startCamera()).rejects.toThrow('Permission check failed');
    });

    it('should handle device not found error', async () => {
      const error = new Error('Requested device not found');
      mockPermissionHelper.checkAndRequestPermission.mockResolvedValue(true);
      mockMediaDevices.getUserMedia.mockRejectedValue(error);

      await expect(service.startCamera()).rejects.toThrow('Requested device not found');
    });

    it('should handle constraint not satisfied error', async () => {
      const error = new Error('Constraint not satisfied');
      mockPermissionHelper.checkAndRequestPermission.mockResolvedValue(true);
      mockMediaDevices.getUserMedia.mockRejectedValue(error);

      await expect(service.startCamera()).rejects.toThrow('Constraint not satisfied');
    });
  });
});
