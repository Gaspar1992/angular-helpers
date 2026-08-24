import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { CameraService } from './camera.service';
import { BrowserCapabilityService } from './browser-capability.service';

describe('CameraService', () => {
  let service: CameraService;
  let mockTrack: any;
  let mockStream: any;
  let mockMediaDevices: any;

  beforeEach(() => {
    mockTrack = {
      stop: vi.fn(),
      getSettings: vi.fn().mockReturnValue({ deviceId: 'cam-1' }),
      getCapabilities: vi.fn().mockReturnValue({ width: { min: 640, max: 1920 } }),
    };

    mockStream = {
      getTracks: vi.fn().mockReturnValue([mockTrack]),
      getVideoTracks: vi.fn().mockReturnValue([mockTrack]),
    };

    mockMediaDevices = {
      getUserMedia: vi.fn().mockResolvedValue(mockStream),
      enumerateDevices: vi.fn().mockResolvedValue([
        { deviceId: 'cam-1', kind: 'videoinput', label: 'Front Camera' },
        { deviceId: 'mic-1', kind: 'audioinput', label: 'Microphone' },
      ]),
    };

    vi.stubGlobal('navigator', {
      mediaDevices: mockMediaDevices,
    });
    vi.stubGlobal('isSecureContext', true);

    TestBed.configureTestingModule({
      providers: [CameraService, BrowserCapabilityService],
    });
    service = TestBed.inject(CameraService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should be created and check capability support', () => {
    expect(service).toBeTruthy();
    expect(service.isSupported()).toBe(true);
  });

  it('should start camera and return stream', async () => {
    const stream = await service.startCamera();
    expect(stream).toBe(mockStream);
    expect(service.getCurrentStream()).toBe(mockStream);
    expect(service.isStreaming()).toBe(true);
  });

  it('should stop existing camera stream before starting a new one', async () => {
    await service.startCamera();
    const newMockTrack = { stop: vi.fn(), getSettings: vi.fn(), getCapabilities: vi.fn() };
    const newMockStream = {
      getTracks: vi.fn().mockReturnValue([newMockTrack]),
      getVideoTracks: vi.fn().mockReturnValue([newMockTrack]),
    };
    mockMediaDevices.getUserMedia.mockResolvedValueOnce(newMockStream);

    await service.startCamera();
    expect(mockTrack.stop).toHaveBeenCalled();
    expect(service.getCurrentStream()).toBe(newMockStream);
  });

  it('should stop camera correctly', async () => {
    await service.startCamera();
    service.stopCamera();
    expect(mockTrack.stop).toHaveBeenCalled();
    expect(service.getCurrentStream()).toBeNull();
    expect(service.isStreaming()).toBe(false);
  });

  it('should switch camera to a specific deviceId', async () => {
    await service.switchCamera('cam-2');
    expect(mockMediaDevices.getUserMedia).toHaveBeenCalledWith({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        deviceId: { exact: 'cam-2' },
      },
    });
  });

  it('should switch camera with custom constraints object', async () => {
    await service.switchCamera('cam-2', { video: { facingMode: 'environment' } });
    expect(mockMediaDevices.getUserMedia).toHaveBeenCalledWith({
      video: {
        facingMode: 'environment',
        deviceId: { exact: 'cam-2' },
      },
    });
  });

  it('should get camera capabilities from active stream', async () => {
    await service.startCamera();
    const caps = await service.getCameraCapabilities('cam-1');
    expect(caps).toEqual({ width: { min: 640, max: 1920 } });
  });

  it('should get camera capabilities by requesting a temporary stream when not currently active', async () => {
    const tempTrack = {
      stop: vi.fn(),
      getCapabilities: vi.fn().mockReturnValue({ frameRate: { max: 60 } }),
    };
    const tempStream = {
      getVideoTracks: vi.fn().mockReturnValue([tempTrack]),
      getTracks: vi.fn().mockReturnValue([tempTrack]),
    };
    mockMediaDevices.getUserMedia.mockResolvedValueOnce(tempStream);

    const caps = await service.getCameraCapabilities('cam-2');
    expect(caps).toEqual({ frameRate: { max: 60 } });
    expect(tempTrack.stop).toHaveBeenCalled();
  });

  it('should return null when getCameraCapabilities errors', async () => {
    mockMediaDevices.getUserMedia.mockRejectedValueOnce(new Error('Permission denied'));
    const caps = await service.getCameraCapabilities('cam-unknown');
    expect(caps).toBeNull();
  });

  it('should get video input devices', async () => {
    const devices = await service.getVideoInputDevices();
    expect(devices.length).toBe(1);
    expect(devices[0].deviceId).toBe('cam-1');
  });

  it('should throw error when video input enumeration fails', async () => {
    mockMediaDevices.enumerateDevices.mockRejectedValueOnce(new Error('Enum failed'));
    await expect(service.getVideoInputDevices()).rejects.toThrow(
      'Failed to enumerate video devices',
    );
  });

  it('should handle specific error types on startCamera', async () => {
    const errNotAllowed = new Error('NotAllowedError');
    errNotAllowed.name = 'NotAllowedError';
    mockMediaDevices.getUserMedia.mockRejectedValueOnce(errNotAllowed);
    await expect(service.startCamera()).rejects.toThrow(/permission denied/i);

    const errNotFound = new Error('NotFoundError');
    errNotFound.name = 'NotFoundError';
    mockMediaDevices.getUserMedia.mockRejectedValueOnce(errNotFound);
    await expect(service.startCamera()).rejects.toThrow(/No camera device found/i);

    const errNotReadable = new Error('NotReadableError');
    errNotReadable.name = 'NotReadableError';
    mockMediaDevices.getUserMedia.mockRejectedValueOnce(errNotReadable);
    await expect(service.startCamera()).rejects.toThrow(/already in use/i);

    const errOverconstrained = new Error('OverconstrainedError');
    errOverconstrained.name = 'OverconstrainedError';
    mockMediaDevices.getUserMedia.mockRejectedValueOnce(errOverconstrained);
    await expect(service.startCamera()).rejects.toThrow(/constraints cannot be satisfied/i);

    const genericErr = new Error('Random failure');
    mockMediaDevices.getUserMedia.mockRejectedValueOnce(genericErr);
    await expect(service.startCamera()).rejects.toThrow(/Camera error: Random failure/i);

    mockMediaDevices.getUserMedia.mockRejectedValueOnce('Non-error object');
    await expect(service.startCamera()).rejects.toThrow(/Camera error: Unknown error/i);
  });

  it('should return native media devices', () => {
    expect(service.getNativeMediaDevices()).toBe(mockMediaDevices);
  });

  it('should throw when getUserMedia is missing', async () => {
    vi.stubGlobal('navigator', { mediaDevices: {} });
    await expect(service.startCamera()).rejects.toThrow(/Camera API not supported/);
  });

  it('should throw when on server platform', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        CameraService,
        BrowserCapabilityService,
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });
    const serverService = TestBed.inject(CameraService);
    expect(serverService.isSupported()).toBe(false);
    await expect(serverService.startCamera()).rejects.toThrow(/server environment/);
  });
});
