import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MediaDevicesService } from './media-devices.service';
import { BrowserCapabilityService } from './browser-capability.service';

describe('MediaDevicesService', () => {
  let service: MediaDevicesService;
  let mockMediaDevices: any;
  let mockStream: any;
  let deviceListeners: Set<() => void>;

  beforeEach(() => {
    mockStream = { getTracks: vi.fn().mockReturnValue([]) };
    deviceListeners = new Set();

    mockMediaDevices = {
      enumerateDevices: vi.fn().mockResolvedValue([
        { deviceId: 'video-1', kind: 'videoinput', label: 'Webcam' },
        { deviceId: 'audio-in-1', kind: 'audioinput', label: 'Mic' },
        { deviceId: 'audio-out-1', kind: 'audiooutput', label: 'Speaker' },
      ]),
      getUserMedia: vi.fn().mockResolvedValue(mockStream),
      getDisplayMedia: vi.fn().mockResolvedValue(mockStream),
      addEventListener: vi.fn((event: string, cb: () => void) => {
        if (event === 'devicechange') deviceListeners.add(cb);
      }),
      removeEventListener: vi.fn((event: string, cb: () => void) => {
        if (event === 'devicechange') deviceListeners.delete(cb);
      }),
    };

    vi.stubGlobal('navigator', {
      mediaDevices: mockMediaDevices,
    });
    vi.stubGlobal('isSecureContext', true);

    TestBed.configureTestingModule({
      providers: [MediaDevicesService, BrowserCapabilityService],
    });
    service = TestBed.inject(MediaDevicesService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should be created and verify support', () => {
    expect(service).toBeTruthy();
    expect(service.isSupported()).toBe(true);
  });

  it('should enumerate devices', async () => {
    const devices = await service.getDevices();
    expect(devices.length).toBe(3);
  });

  it('should throw when enumerateDevices fails', async () => {
    mockMediaDevices.enumerateDevices.mockRejectedValueOnce(new Error('Enumerate error'));
    await expect(service.getDevices()).rejects.toThrow('Failed to enumerate media devices');
  });

  it('should filter devices by kind', async () => {
    const videoDevices = await service.getVideoInputDevices();
    expect(videoDevices.length).toBe(1);
    expect(videoDevices[0].kind).toBe('videoinput');

    const audioInputs = await service.getAudioInputDevices();
    expect(audioInputs.length).toBe(1);
    expect(audioInputs[0].kind).toBe('audioinput');

    const audioOutputs = await service.getAudioOutputDevices();
    expect(audioOutputs.length).toBe(1);
    expect(audioOutputs[0].kind).toBe('audiooutput');
  });

  it('should get user media with default and custom constraints', async () => {
    const stream = await service.getUserMedia();
    expect(stream).toBe(mockStream);
    expect(mockMediaDevices.getUserMedia).toHaveBeenCalledWith({ video: true, audio: true });

    await service.getUserMedia({ video: false, audio: true });
    expect(mockMediaDevices.getUserMedia).toHaveBeenCalledWith({ video: false, audio: true });
  });

  it('should handle get user media errors with descriptive messages', async () => {
    const testCases: [string, string, RegExp][] = [
      ['NotAllowedError', 'NotAllowedError', /Permission denied by user/],
      ['NotFoundError', 'NotFoundError', /No media device found/],
      ['NotReadableError', 'NotReadableError', /Media device is already in use/],
      ['OverconstrainedError', 'OverconstrainedError', /Media constraints cannot be satisfied/],
      ['TypeError', 'TypeError', /Invalid media constraints provided/],
      ['OtherError', 'OtherError', /Media error: OtherError/],
    ];

    for (const [name, msg, regex] of testCases) {
      const err = new Error(msg);
      err.name = name;
      mockMediaDevices.getUserMedia.mockRejectedValueOnce(err);
      await expect(service.getUserMedia()).rejects.toThrow(regex);
    }

    mockMediaDevices.getUserMedia.mockRejectedValueOnce('string error');
    await expect(service.getUserMedia()).rejects.toThrow(/Unknown media error occurred/);
  });

  it('should get display media', async () => {
    const stream = await service.getDisplayMedia();
    expect(stream).toBe(mockStream);
    expect(mockMediaDevices.getDisplayMedia).toHaveBeenCalledWith({ video: true, audio: false });
  });

  it('should throw if getDisplayMedia is not present on mediaDevices', async () => {
    delete mockMediaDevices.getDisplayMedia;
    await expect(service.getDisplayMedia()).rejects.toThrow(/Display media API not supported/);
  });

  it('should handle display media errors', async () => {
    mockMediaDevices.getDisplayMedia.mockRejectedValueOnce(
      new Error('User cancelled screen share'),
    );
    await expect(service.getDisplayMedia()).rejects.toThrow('Failed to get display media');
  });

  it('should watch device changes and emit updates', async () => {
    const emitted: MediaDeviceInfo[][] = [];
    const sub = service.watchDeviceChanges().subscribe((devs) => emitted.push(devs));

    // Wait microtask for initial load
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(emitted.length).toBe(1);

    // Trigger devicechange event
    deviceListeners.forEach((cb) => cb());
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(emitted.length).toBe(2);

    sub.unsubscribe();
    expect(mockMediaDevices.removeEventListener).toHaveBeenCalledWith(
      'devicechange',
      expect.any(Function),
    );
  });

  it('should get native media devices', () => {
    expect(service.getNativeMediaDevices()).toBe(mockMediaDevices);
  });

  it('should throw when on server platform', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        MediaDevicesService,
        BrowserCapabilityService,
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });
    const serverService = TestBed.inject(MediaDevicesService);
    expect(serverService.isSupported()).toBe(false);
    await expect(serverService.getDevices()).rejects.toThrow(/server environment/);
  });
});
