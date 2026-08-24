import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MediaRecorderService } from './media-recorder.service';
import { BrowserCapabilityService } from './browser-capability.service';

describe('MediaRecorderService', () => {
  let service: MediaRecorderService;
  let mockRecorderInstance: any;

  beforeEach(() => {
    mockRecorderInstance = {
      state: 'inactive',
      mimeType: 'video/webm',
      start: vi.fn(function (this: any) {
        this.state = 'recording';
        this.onstart?.();
      }),
      stop: vi.fn(function (this: any) {
        this.state = 'inactive';
        this.onstop?.();
      }),
      pause: vi.fn(function (this: any) {
        this.state = 'paused';
        this.onpause?.();
      }),
      resume: vi.fn(function (this: any) {
        this.state = 'recording';
        this.onresume?.();
      }),
      ondataavailable: null as any,
      onstart: null as any,
      onpause: null as any,
      onresume: null as any,
      onstop: null as any,
    };

    const MockMediaRecorder = vi.fn(function (this: any) {
      Object.assign(this, mockRecorderInstance);
      mockRecorderInstance = this;
      return this;
    }) as any;
    MockMediaRecorder.isTypeSupported = vi.fn().mockReturnValue(true);

    vi.stubGlobal('MediaRecorder', MockMediaRecorder);
    vi.stubGlobal('isSecureContext', true);
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn().mockReturnValue('blob:http://localhost/mock-uuid'),
      revokeObjectURL: vi.fn(),
    });

    TestBed.configureTestingModule({
      providers: [MediaRecorderService, BrowserCapabilityService],
    });
    service = TestBed.inject(MediaRecorderService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should be created and verify support', () => {
    expect(service).toBeTruthy();
    expect(service.isSupported()).toBe(true);
    expect(MediaRecorderService.isTypeSupported('video/webm')).toBe(true);
  });

  it('should start recording and emit state', async () => {
    const states: string[] = [];
    service.watchState().subscribe((s) => states.push(s));

    const mockStream = {} as MediaStream;
    await service.start(mockStream, { timeslice: 1000 });

    expect(mockRecorderInstance.start).toHaveBeenCalledWith(1000);
    expect(states).toContain('recording');
    expect(service.state).toBe('recording');
  });

  it('should emit data when chunks are available', async () => {
    const emittedBlobs: Blob[] = [];
    service.watchData().subscribe((b) => emittedBlobs.push(b));

    const mockStream = {} as MediaStream;
    await service.start(mockStream);

    const chunk = new Blob(['data'], { type: 'video/webm' });
    mockRecorderInstance.ondataavailable({ data: chunk });

    expect(emittedBlobs.length).toBe(1);
    expect(emittedBlobs[0]).toBe(chunk);
  });

  it('should pause and resume recording', async () => {
    const states: string[] = [];
    service.watchState().subscribe((s) => states.push(s));

    const mockStream = {} as MediaStream;
    await service.start(mockStream);

    service.pause();
    expect(mockRecorderInstance.pause).toHaveBeenCalled();
    expect(states).toContain('paused');

    service.resume();
    expect(mockRecorderInstance.resume).toHaveBeenCalled();
  });

  it('should stop recording and return recording result', async () => {
    const mockStream = {} as MediaStream;
    await service.start(mockStream);

    const chunk = new Blob(['sample-video-bytes'], { type: 'video/webm' });
    mockRecorderInstance.ondataavailable({ data: chunk });

    const result = service.stop();
    expect(result).not.toBeNull();
    expect(result?.url).toBe('blob:http://localhost/mock-uuid');
    expect(result?.mimeType).toBe('video/webm');
    expect(result?.duration).toBeGreaterThanOrEqual(0);
    expect(service.state).toBe('inactive');
  });

  it('should return null on stop if recorder is inactive or null', () => {
    expect(service.stop()).toBeNull();
  });

  it('should get current result without stopping if chunks exist', async () => {
    expect(service.getResult()).toBeNull();

    const mockStream = {} as MediaStream;
    await service.start(mockStream);
    const chunk = new Blob(['chunk1'], { type: 'video/webm' });
    mockRecorderInstance.ondataavailable({ data: chunk });

    const intermediate = service.getResult();
    expect(intermediate).not.toBeNull();
    expect(intermediate?.url).toBe('blob:http://localhost/mock-uuid');
  });

  it('should throw error when not in secure context', async () => {
    vi.stubGlobal('isSecureContext', false);
    const mockStream = {} as MediaStream;
    await expect(service.start(mockStream)).rejects.toThrow(/secure context/);
  });

  it('should throw error when unsupported', async () => {
    delete (window as any).MediaRecorder;
    delete (globalThis as any).MediaRecorder;
    const mockStream = {} as MediaStream;
    await expect(service.start(mockStream)).rejects.toThrow(/not supported in this browser/);
  });
});
