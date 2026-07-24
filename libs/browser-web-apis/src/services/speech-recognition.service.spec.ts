import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
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

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SpeechRecognitionService],
    });
    service = TestBed.inject(SpeechRecognitionService);

    vi.stubGlobal('SpeechRecognition', MockSpeechRecognition);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return isSupported as true when SpeechRecognition exists', () => {
    expect(service.isSupported()).toBe(true);
  });

  it('should emit start event when watch starts', async () => {
    const events: any[] = [];

    let mockInstance: MockSpeechRecognition | null = null;
    vi.stubGlobal(
      'SpeechRecognition',
      class extends MockSpeechRecognition {
        constructor() {
          super();
          mockInstance = this;
        }
      },
    );

    const sub = service.watch().subscribe({
      next: (val) => events.push(val),
    });

    // Simulate start callback
    mockInstance!.onstart!();

    expect(events[0]).toEqual({ type: 'start' });
    sub.unsubscribe();
  });
});
