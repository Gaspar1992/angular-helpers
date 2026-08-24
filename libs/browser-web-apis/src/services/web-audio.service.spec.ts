import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { firstValueFrom, take } from 'rxjs';
import { WebAudioService } from './web-audio.service';
import { BrowserCapabilityService } from './browser-capability.service';

describe('WebAudioService', () => {
  let service: WebAudioService;
  let mockContextInstance: any;

  beforeEach(() => {
    mockContextInstance = {
      state: 'running',
      destination: {},
      resume: vi.fn().mockResolvedValue(undefined),
      close: vi.fn(function (this: any) {
        this.state = 'closed';
        return Promise.resolve();
      }),
      createOscillator: vi.fn().mockReturnValue({
        type: 'sine',
        frequency: { value: 440 },
      }),
      createGain: vi.fn().mockReturnValue({
        gain: { value: 1 },
      }),
      createAnalyser: vi.fn().mockReturnValue({
        fftSize: 2048,
        frequencyBinCount: 1024,
        getByteFrequencyData: vi.fn(),
        getByteTimeDomainData: vi.fn(),
      }),
      createBufferSource: vi.fn().mockReturnValue({
        buffer: null,
        loop: false,
        connect: vi.fn(),
        start: vi.fn(),
      }),
      decodeAudioData: vi.fn().mockResolvedValue({ duration: 5, numberOfChannels: 2 }),
    };

    const MockAudioContext = vi.fn(function (this: any) {
      Object.assign(this, mockContextInstance);
      mockContextInstance = this;
      return this;
    });

    vi.stubGlobal('AudioContext', MockAudioContext);
    vi.stubGlobal('isSecureContext', true);

    TestBed.configureTestingModule({
      providers: [WebAudioService, BrowserCapabilityService],
    });
    service = TestBed.inject(WebAudioService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should be created and verify support', () => {
    expect(service).toBeTruthy();
    expect(service.isSupported()).toBe(true);
  });

  it('should initialize and return AudioContext', () => {
    const ctx = service.getContext();
    expect(ctx).toBeDefined();
    expect(service.getState()).toBe('running');
  });

  it('should resume suspended context', async () => {
    const ctx = service.getContext();
    ctx.state = 'suspended';
    await service.resume();
    expect(mockContextInstance.resume).toHaveBeenCalled();
  });

  it('should close AudioContext and reset state', async () => {
    service.getContext();
    expect(service.getState()).toBe('running');

    await service.close();
    expect(mockContextInstance.close).toHaveBeenCalled();
    expect(service.getState()).toBe('closed');
  });

  it('should create oscillator with parameters', () => {
    const osc = service.createOscillator('triangle', 880);
    expect(osc.type).toBe('triangle');
    expect(osc.frequency.value).toBe(880);
  });

  it('should create gain node with parameters', () => {
    const gain = service.createGain(0.5);
    expect(gain.gain.value).toBe(0.5);
  });

  it('should create analyser node with parameters', () => {
    const analyser = service.createAnalyser(1024);
    expect(analyser.fftSize).toBe(1024);
  });

  it('should watch analyser data', async () => {
    const analyser = service.createAnalyser();
    const data$ = service.watchAnalyser(analyser, 10);
    const result = await firstValueFrom(data$.pipe(take(1)));

    expect(result.frequencyData).toBeInstanceOf(Uint8Array);
    expect(result.timeDomainData).toBeInstanceOf(Uint8Array);
  });

  it('should decode audio data', async () => {
    const buffer = new ArrayBuffer(8);
    const audioBuf = await service.decodeAudioData(buffer);
    expect(audioBuf.duration).toBe(5);
  });

  it('should play buffer via buffer source node', () => {
    const mockAudioBuf = { duration: 5 } as AudioBuffer;
    const source = service.playBuffer(mockAudioBuf, true);
    expect(source.buffer).toBe(mockAudioBuf);
    expect(source.loop).toBe(true);
    expect(source.connect).toHaveBeenCalled();
    expect(source.start).toHaveBeenCalledWith(0);
  });

  it('should throw when Web Audio is unsupported', () => {
    delete (window as any).AudioContext;
    delete (window as any).webkitAudioContext;
    delete (globalThis as any).AudioContext;
    delete (globalThis as any).webkitAudioContext;
    expect(service.isSupported()).toBe(false);
    expect(() => service.getContext()).toThrow('Web Audio API not supported');
  });
});
