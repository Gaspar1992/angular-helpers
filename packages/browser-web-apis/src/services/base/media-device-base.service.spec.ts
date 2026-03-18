import { describe, it, expect, beforeEach, vi } from 'vitest';
import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { MediaDeviceBaseService } from './media-device-base.service';
import { BrowserApiBaseService } from './browser-api-base.service';
import { MediaDevice, MediaDeviceKind } from '../../interfaces/media.interface';
import { BrowserSupportUtil } from '../../utils/browser-support.util';

// Test implementation of MediaDeviceBaseService
class TestMediaDeviceService extends MediaDeviceBaseService {
  protected override getApiName(): string {
    return 'test-media-device';
  }

  protected override getMediaConstraintType(): 'video' | 'audio' {
    return 'video';
  }

  // Expose protected methods for testing
  public testGetMediaConstraintType(): 'video' | 'audio' {
    return this.getMediaConstraintType();
  }

  public async testRefreshDevices(): Promise<void> {
    return this.refreshDevices();
  }

  public async testGetUserMedia(constraints: any): Promise<MediaStream> {
    return this.getUserMedia(constraints);
  }

  public testAddActiveStream(stream: MediaStream): void {
    this.addActiveStream(stream);
  }

  public testStopStream(streamId: string): void {
    this.stopStream(streamId);
  }

  public testStopAllStreams(): void {
    this.stopAllStreams();
  }

  public testGetActiveStreams(): Map<string, MediaStream> {
    return this['activeStreams']();
  }

  public testGetDevices(): MediaDevice[] {
    return this['devices']();
  }

  public testGetVideoInputs(): MediaDevice[] {
    return this.videoInputs();
  }

  public testGetAudioInputs(): MediaDevice[] {
    return this.audioInputs();
  }

  public testGetAudioOutputs(): MediaDevice[] {
    return this.audioOutputs();
  }

  public testGetError(): string {
    return this['error']();
  }
}

// Mock dependencies
vi.mock('../../utils/browser-support.util', () => ({
  BrowserSupportUtil: {
    isSupported: vi.fn()
  }
}));

vi.mock('../../utils/ssr-safe.util', () => ({
}));

describe('MediaDeviceBaseService', () => {
  let service: TestMediaDeviceService;
  let mockNavigator: any;
  let mockMediaDevices: any;
  let mockDestroyRef: any;

  beforeEach(() => {
    mockMediaDevices = {
      enumerateDevices: vi.fn(),
      getUserMedia: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    };

    mockNavigator = {
      mediaDevices: mockMediaDevices
    };

    mockDestroyRef = {
      destroyed: false,
      onDestroy: vi.fn()
    };


    TestBed.configureTestingModule({
      providers: [
        TestMediaDeviceService,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });
    service = TestBed.inject(TestMediaDeviceService);
  });

  describe('getMediaConstraintType', () => {
    it('should return the media constraint type', () => {
      const result = service.testGetMediaConstraintType();

      expect(result).toBe('video');
    });
  });

  describe('refreshDevices', () => {
    it('should refresh devices successfully', async () => {
      const mockDevices: MediaDevice[] = [
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
        }
      ];

      mockMediaDevices.enumerateDevices.mockResolvedValue(mockDevices);

      await service.testRefreshDevices();

      expect(mockMediaDevices.enumerateDevices).toHaveBeenCalled();
      expect(service.testGetDevices()).toEqual(mockDevices);
    });

    it('should handle refreshDevices error', async () => {
      const error = new Error('Device enumeration failed');
      mockMediaDevices.enumerateDevices.mockRejectedValue(error);

      await expect(service.testRefreshDevices()).rejects.toThrow('Device enumeration failed');
    });

    it('should update device filters after refresh', async () => {
      const mockDevices: MediaDevice[] = [
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
          deviceId: 'speaker1',
          label: 'Speaker',
          kind: 'audiooutput',
          groupId: 'group3'
        }
      ];

      mockMediaDevices.enumerateDevices.mockResolvedValue(mockDevices);

      await service.testRefreshDevices();

      expect(service.testGetVideoInputs()).toHaveLength(1);
      expect(service.testGetAudioInputs()).toHaveLength(1);
      expect(service.testGetAudioOutputs()).toHaveLength(1);
    });
  });

  describe('getUserMedia', () => {
    it('should get user media successfully', async () => {
      const constraints = { video: true };
      const mockStream = new MediaStream();

      mockMediaDevices.getUserMedia.mockResolvedValue(mockStream);

      const result = await service.testGetUserMedia(constraints);

      expect(result).toBe(mockStream);
      expect(mockMediaDevices.getUserMedia).toHaveBeenCalledWith(constraints);
      expect(service.testGetActiveStreams().has(mockStream.id || 'default')).toBe(true);
    });

    it('should handle getUserMedia error', async () => {
      const constraints = { video: true };
      const error = new Error('Permission denied');

      mockMediaDevices.getUserMedia.mockRejectedValue(error);

      await expect(service.testGetUserMedia(constraints)).rejects.toThrow('Permission denied');
    });

    it('should add stream to active streams', async () => {
      const constraints = { video: true };
      const mockStream = new MediaStream();

      mockMediaDevices.getUserMedia.mockResolvedValue(mockStream);

      await service.testGetUserMedia(constraints);

      const activeStreams = service.testGetActiveStreams();
      expect(activeStreams.size).toBe(1);
    });
  });

  describe('active streams management', () => {
    it('should add active stream', () => {
      const mockStream = new MediaStream();

      service.testAddActiveStream(mockStream);

      const activeStreams = service.testGetActiveStreams();
      expect(activeStreams.has(mockStream.id || 'default')).toBe(true);
    });

    it('should stop active stream', () => {
      const mockStream = {
        id: 'stream1',
        getTracks: vi.fn(() => [{ stop: vi.fn() }])
      };

      service.testAddActiveStream(mockStream as any);
      service.testStopStream('stream1');

      expect(mockStream.getTracks).toHaveBeenCalled();
      expect(mockStream.getTracks()[0].stop).toHaveBeenCalled();
      expect(service.testGetActiveStreams().has('stream1')).toBe(false);
    });

    it('should stop all active streams', () => {
      const mockStream1 = {
        id: 'stream1',
        getTracks: vi.fn(() => [{ stop: vi.fn() }])
      };
      const mockStream2 = {
        id: 'stream2',
        getTracks: vi.fn(() => [{ stop: vi.fn() }])
      };

      service.testAddActiveStream(mockStream1 as any);
      service.testAddActiveStream(mockStream2 as any);
      service.testStopAllStreams();

      expect(mockStream1.getTracks).toHaveBeenCalled();
      expect(mockStream1.getTracks()[0].stop).toHaveBeenCalled();
      expect(mockStream2.getTracks).toHaveBeenCalled();
      expect(mockStream2.getTracks()[0].stop).toHaveBeenCalled();
      expect(service.testGetActiveStreams().size).toBe(0);
    });

    it('should handle stopping non-existent stream', () => {
      expect(() => service.testStopStream('nonexistent')).not.toThrow();
    });

    it('should handle stopping stream with no tracks', () => {
      const mockStream = {
        id: 'stream1',
        getTracks: vi.fn(() => [])
      };

      service.testAddActiveStream(mockStream as any);
      service.testStopStream('stream1');

      expect(mockStream.getTracks).toHaveBeenCalled();
      expect(service.testGetActiveStreams().has('stream1')).toBe(false);
    });
  });

  describe('device filtering', () => {
    beforeEach(async () => {
      const mockDevices: MediaDevice[] = [
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
        },
        {
          deviceId: 'speaker1',
          label: 'Speaker',
          kind: 'audiooutput',
          groupId: 'group4'
        }
      ];

      mockMediaDevices.enumerateDevices.mockResolvedValue(mockDevices);
      await service.testRefreshDevices();
    });

    it('should filter video input devices', () => {
      const videoDevices = service.testGetVideoInputs();

      expect(videoDevices).toHaveLength(2);
      expect(videoDevices.every(device => device.kind === 'videoinput')).toBe(true);
    });

    it('should filter audio input devices', () => {
      const audioDevices = service.testGetAudioInputs();

      expect(audioDevices).toHaveLength(1);
      expect(audioDevices[0].kind).toBe('audioinput');
    });

    it('should filter audio output devices', () => {
      const outputDevices = service.testGetAudioOutputs();

      expect(outputDevices).toHaveLength(1);
      expect(outputDevices[0].kind).toBe('audiooutput');
    });
  });

  describe('device change events', () => {
    it('should setup device change listener', async () => {
      await service.testRefreshDevices();

      expect(mockMediaDevices.addEventListener).toHaveBeenCalledWith(
        'devicechange',
        expect.any(Function)
      );
    });

    it('should refresh devices on device change', async () => {
      const mockDevices: MediaDevice[] = [
        {
          deviceId: 'camera1',
          label: 'Front Camera',
          kind: 'videoinput',
          groupId: 'group1'
        }
      ];

      mockMediaDevices.enumerateDevices.mockResolvedValue(mockDevices);

      await service.testRefreshDevices();

      // Get the device change callback
      const devicechangeCallback = mockMediaDevices.addEventListener.mock.calls
        .find((call: any) => call[0] === 'devicechange')?.[1];

      if (devicechangeCallback) {
        devicechangeCallback();
      }

      // Should call enumerateDevices again
      expect(mockMediaDevices.enumerateDevices).toHaveBeenCalledTimes(2);
    });
  });

  describe('error handling', () => {
    it('should set error on device refresh failure', async () => {
      const error = new Error('Device enumeration failed');
      mockMediaDevices.enumerateDevices.mockRejectedValue(error);

      await expect(service.testRefreshDevices()).rejects.toThrow('Device enumeration failed');
      expect(service.testGetError()).toBe('Failed to initialize media devices');
    });

    it('should set error on getUserMedia failure', async () => {
      const error = new Error('Permission denied');
      mockMediaDevices.getUserMedia.mockRejectedValue(error);

      await expect(service.testGetUserMedia({ video: true })).rejects.toThrow('Permission denied');
    });
  });

  describe('signals', () => {
    it('should expose readonly signals', () => {
      expect(service['devices']).toBeDefined();
      expect(service['activeStreams']).toBeDefined();
      expect(service['error']).toBeDefined();
    });

    it('should update devices signal on refresh', async () => {
      const mockDevices: MediaDevice[] = [
        {
          deviceId: 'camera1',
          label: 'Front Camera',
          kind: 'videoinput',
          groupId: 'group1'
        }
      ];

      mockMediaDevices.enumerateDevices.mockResolvedValue(mockDevices);

      await service.testRefreshDevices();

      expect(service.testGetDevices()).toEqual(mockDevices);
    });

    it('should update error signal', async () => {
      const error = new Error('Device enumeration failed');
      mockMediaDevices.enumerateDevices.mockRejectedValue(error);

      try {
        await service.testRefreshDevices();
      } catch (e) {
        // Expected to throw
      }

      expect(service.testGetError()).toBe('Failed to initialize media devices');
    });
  });

  describe('initialization', () => {
    it('should initialize on construction', async () => {
      const mockDevices: MediaDevice[] = [
        {
          deviceId: 'camera1',
          label: 'Front Camera',
          kind: 'videoinput',
          groupId: 'group1'
        }
      ];

      mockMediaDevices.enumerateDevices.mockResolvedValue(mockDevices);

      // Create new service instance
      const newService = new TestMediaDeviceService();

      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockMediaDevices.enumerateDevices).toHaveBeenCalled();
    });

    it('should handle initialization errors gracefully', async () => {
      mockMediaDevices.enumerateDevices.mockRejectedValue(new Error('Init error'));

      // Should not throw during construction
      expect(() => new TestMediaDeviceService()).not.toThrow();
    });
  });

  describe('cleanup', () => {
    it('should cleanup on destroy', () => {
      const mockStream1 = {
        id: 'stream1',
        getTracks: vi.fn(() => [{ stop: vi.fn() }])
      };

      service.testAddActiveStream(mockStream1 as any);

      service.ngOnDestroy();

      expect(mockStream1.getTracks).toHaveBeenCalled();
      expect(mockStream1.getTracks()[0].stop).toHaveBeenCalled();
      expect(service.testGetActiveStreams().size).toBe(0);
    });

    it('should remove device change listener on destroy', async () => {
      await service.testRefreshDevices();

      service.ngOnDestroy();

      expect(mockMediaDevices.removeEventListener).toHaveBeenCalledWith(
        'devicechange',
        expect.any(Function)
      );
    });
  });

  describe('inheritance', () => {
    it('should extend BrowserApiBaseService', () => {
      expect(service).toBeInstanceOf(BrowserApiBaseService);
    });

    it('should implement required abstract methods', () => {
      expect(() => service.testGetMediaConstraintType()).not.toThrow();
      expect(() => service['getApiName']()).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle devices without labels', async () => {
      const mockDevices: MediaDevice[] = [
        {
          deviceId: 'camera1',
          label: '',
          kind: 'videoinput',
          groupId: 'group1'
        }
      ];

      mockMediaDevices.enumerateDevices.mockResolvedValue(mockDevices);

      await service.testRefreshDevices();

      expect(service.testGetDevices()).toEqual(mockDevices);
    });

    it('should handle empty device list', async () => {
      mockMediaDevices.enumerateDevices.mockResolvedValue([]);

      await service.testRefreshDevices();

      expect(service.testGetDevices()).toHaveLength(0);
      expect(service.testGetVideoInputs()).toHaveLength(0);
      expect(service.testGetAudioInputs()).toHaveLength(0);
      expect(service.testGetAudioOutputs()).toHaveLength(0);
    });

    it('should handle stream without ID', () => {
      const mockStream = { getTracks: vi.fn(() => []) } as any;

      service.testAddActiveStream(mockStream);

      const activeStreams = service.testGetActiveStreams();
      expect(activeStreams.has('default')).toBe(true);
    });
  });
});
