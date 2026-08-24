import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Subject } from 'rxjs';
import { injectSpeechRecognition } from './inject-speech-recognition';
import { SpeechRecognitionService } from '../services/speech-recognition.service';

describe('injectSpeechRecognition', () => {
  let mockService: any;
  let eventSubject: Subject<any>;

  beforeEach(() => {
    eventSubject = new Subject();
    mockService = {
      isSupported: vi.fn().mockReturnValue(true),
      watch: vi.fn().mockReturnValue(eventSubject.asObservable()),
      stop: vi.fn(),
      abort: vi.fn(),
    };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should throw when called outside injection context', () => {
    expect(() => injectSpeechRecognition()).toThrow(/injectSpeechRecognition/);
  });

  it('should track speech recognition events', async () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: SpeechRecognitionService, useValue: mockService },
      ],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectSpeechRecognition();
      await new Promise((resolve) => queueMicrotask(resolve));

      expect(ref.isSupported()).toBe(true);

      ref.start();
      eventSubject.next({ type: 'start' });
      expect(ref.isListening()).toBe(true);

      eventSubject.next({
        type: 'result',
        results: [{ transcript: 'Hello world ', isFinal: true }],
      });
      expect(ref.transcript()).toBe('Hello world ');

      eventSubject.next({
        type: 'result',
        results: [{ transcript: 'interim', isFinal: false }],
      });
      expect(ref.interimTranscript()).toBe('interim');

      eventSubject.next({ type: 'end' });
      expect(ref.isListening()).toBe(false);

      ref.stop();
      expect(mockService.stop).toHaveBeenCalled();

      ref.abort();
      expect(mockService.abort).toHaveBeenCalled();
    });
  });

  it('should handle error when unsupported', async () => {
    mockService.isSupported.mockReturnValue(false);

    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: SpeechRecognitionService, useValue: mockService },
      ],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectSpeechRecognition();
      await new Promise((resolve) => queueMicrotask(resolve));

      expect(ref.isSupported()).toBe(false);
      ref.start();
      expect(ref.error()?.message).toContain('Speech Recognition API is not supported');
    });
  });
});
