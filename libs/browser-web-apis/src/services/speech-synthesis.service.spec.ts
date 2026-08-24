import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SpeechSynthesisService } from './speech-synthesis.service';
import { BrowserCapabilityService } from './browser-capability.service';

describe('SpeechSynthesisService', () => {
  let service: SpeechSynthesisService;
  let mockSpeechSynthesis: any;
  let mockVoices: any[];
  let voicesListeners: Set<() => void>;

  beforeEach(() => {
    mockVoices = [
      { name: 'Alex', lang: 'en-US', default: true },
      { name: 'Victoria', lang: 'en-US', default: false },
    ];
    voicesListeners = new Set();

    mockSpeechSynthesis = {
      speaking: false,
      paused: false,
      pending: false,
      getVoices: vi.fn().mockReturnValue(mockVoices),
      speak: vi.fn((utterance: any) => {
        // Mock default speak behavior
        setTimeout(() => utterance.onstart?.(), 0);
        setTimeout(() => utterance.onend?.(), 20);
      }),
      pause: vi.fn(() => {
        mockSpeechSynthesis.paused = true;
      }),
      resume: vi.fn(() => {
        mockSpeechSynthesis.paused = false;
      }),
      cancel: vi.fn(),
      addEventListener: vi.fn((event: string, cb: () => void) => {
        if (event === 'voiceschanged') voicesListeners.add(cb);
      }),
      removeEventListener: vi.fn((event: string, cb: () => void) => {
        if (event === 'voiceschanged') voicesListeners.delete(cb);
      }),
    };

    vi.stubGlobal('speechSynthesis', mockSpeechSynthesis);
    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      class MockUtterance {
        text: string;
        lang = '';
        voice = null;
        volume = 1;
        rate = 1;
        pitch = 1;
        onstart: any = null;
        onpause: any = null;
        onresume: any = null;
        onend: any = null;
        onerror: any = null;
        constructor(text: string) {
          this.text = text;
        }
      },
    );

    TestBed.configureTestingModule({
      providers: [SpeechSynthesisService, BrowserCapabilityService],
    });
    service = TestBed.inject(SpeechSynthesisService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should be created and verify support', () => {
    expect(service).toBeTruthy();
    expect(service.isSupported()).toBe(true);
  });

  it('should report state accurately', () => {
    expect(service.state).toBe('idle');
    expect(service.isPending).toBe(false);

    mockSpeechSynthesis.speaking = true;
    expect(service.state).toBe('speaking');

    mockSpeechSynthesis.paused = true;
    expect(service.state).toBe('paused');
  });

  it('should get voices and watch voices changes', async () => {
    expect(service.getVoices()).toEqual(mockVoices);

    const emitted: any[] = [];
    const sub = service.watchVoices().subscribe((v) => emitted.push(v));

    expect(emitted.length).toBe(1);

    // Trigger voiceschanged
    mockVoices.push({ name: 'Diego', lang: 'es-ES', default: false });
    voicesListeners.forEach((cb) => cb());

    expect(emitted.length).toBe(2);
    expect(emitted[1].length).toBe(3);

    sub.unsubscribe();
    expect(mockSpeechSynthesis.removeEventListener).toHaveBeenCalledWith(
      'voiceschanged',
      expect.any(Function),
    );
  });

  it('should speak text with options and emit lifecycle states', async () => {
    const states: string[] = [];
    const obs$ = service.speak('Hello world', {
      lang: 'en-US',
      pitch: 1.2,
      rate: 1.0,
      volume: 0.8,
    });

    await new Promise<void>((resolve, reject) => {
      obs$.subscribe({
        next: (state) => states.push(state),
        complete: () => resolve(),
        error: (err) => reject(err),
      });
    });

    expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    expect(states).toContain('speaking');
    expect(states).toContain('idle');
  });

  it('should handle pause, resume, and cancel calls', () => {
    service.pause();
    expect(mockSpeechSynthesis.pause).toHaveBeenCalled();

    service.resume();
    expect(mockSpeechSynthesis.resume).toHaveBeenCalled();

    service.cancel();
    expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
  });

  it('should handle error during speak', async () => {
    mockSpeechSynthesis.speak = vi.fn((utterance: any) => {
      setTimeout(() => utterance.onerror?.({ error: 'audio-busy' }), 0);
    });

    const errorPromise = new Promise<Error>((resolve) => {
      service.speak('Hello').subscribe({
        error: (err) => resolve(err),
      });
    });

    const err = await errorPromise;
    expect(err.message).toContain('Speech synthesis error: audio-busy');
  });

  it('should handle server platform gracefully', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        SpeechSynthesisService,
        BrowserCapabilityService,
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });
    const serverService = TestBed.inject(SpeechSynthesisService);
    expect(serverService.isSupported()).toBe(false);
    expect(serverService.getVoices()).toEqual([]);
    expect(serverService.state).toBe('idle');
    expect(serverService.isPending).toBe(false);

    const voices = await firstValueFrom(serverService.watchVoices());
    expect(voices).toEqual([]);
  });
});
