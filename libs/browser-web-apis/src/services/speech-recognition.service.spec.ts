import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { SpeechRecognitionService } from './speech-recognition.service';

class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  maxAlternatives = 1;
  lang = 'en-US';

  start = vi.fn();
  stop = vi.fn();
  abort = vi.fn();

  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((err: any) => void) | null = null;
  onresult: ((res: any) => void) | null = null;
}

describe('SpeechRecognitionService', () => {
  let service: SpeechRecognitionService;
  let mockInstance: MockSpeechRecognition | null = null;

  beforeEach(() => {
    mockInstance = null;
    vi.stubGlobal(
      'SpeechRecognition',
      class extends MockSpeechRecognition {
        constructor() {
          super();
          mockInstance = this;
        }
      },
    );

    TestBed.configureTestingModule({
      providers: [SpeechRecognitionService],
    });
    service = TestBed.inject(SpeechRecognitionService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should be created and report isSupported as true', () => {
    expect(service).toBeTruthy();
    expect(service.isSupported()).toBe(true);
  });

  it('should emit start, result, and end events and support stop/abort', () => {
    const events: any[] = [];
    let completed = false;

    const sub = service
      .watch({ lang: 'es-ES', continuous: true, interimResults: true, maxAlternatives: 2 })
      .subscribe({
        next: (val) => events.push(val),
        complete: () => {
          completed = true;
        },
      });

    expect(mockInstance!.lang).toBe('es-ES');
    expect(mockInstance!.continuous).toBe(true);
    expect(mockInstance!.interimResults).toBe(true);
    expect(mockInstance!.maxAlternatives).toBe(2);

    mockInstance!.onstart!();
    expect(events[0]).toEqual({ type: 'start' });

    // Trigger result event (including an empty resultList to cover branch)
    const resultRow = Object.assign([{ transcript: 'hola', confidence: 0.95 }], { isFinal: true });
    const emptyRow = Object.assign([], { isFinal: false });
    mockInstance!.onresult!({
      resultIndex: 0,
      results: [resultRow, emptyRow],
    });
    expect(events[1]).toEqual({
      type: 'result',
      results: [{ transcript: 'hola', isFinal: true, confidence: 0.95 }],
    });

    // Test stop() and abort() methods while active
    service.stop();
    expect(mockInstance!.stop).toHaveBeenCalledTimes(1);

    service.abort();
    expect(mockInstance!.abort).toHaveBeenCalledTimes(1);

    // Trigger end event
    mockInstance!.onend!();
    expect(events[2]).toEqual({ type: 'end' });
    expect(completed).toBe(true);

    sub.unsubscribe();
  });

  it('should emit error event and error the observable on onerror, and ignore abort error on teardown', () => {
    const events: any[] = [];
    let caughtError: Error | null = null;

    const sub = service.watch().subscribe({
      next: (val) => events.push(val),
      error: (err) => {
        caughtError = err;
      },
    });

    mockInstance!.abort.mockImplementation(() => {
      throw new Error('already stopped');
    });

    mockInstance!.onerror!({ error: 'no-speech' });

    expect(events[0].type).toBe('error');
    expect(caughtError?.message).toContain('no-speech');
    sub.unsubscribe();
  });

  it('should throw when watching in unsupported environment', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [SpeechRecognitionService, { provide: PLATFORM_ID, useValue: 'server' }],
    });
    const ssrService = TestBed.inject(SpeechRecognitionService);

    let caughtError: Error | null = null;
    ssrService.watch().subscribe({
      error: (err) => {
        caughtError = err;
      },
    });
    expect(caughtError?.message).toContain('speech-recognition');
  });
});
