import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { VoiceInputDirective } from './voice-input.directive';
import { render, RenderResult } from '@angular-helpers/testing';
import * as injectSpeechMock from '../fns/inject-speech-recognition';

// Mock injectSpeechRecognition to avoid real SpeechRecognition dependency
const mockTranscript = signal('');
const mockIsListening = signal(false);
const mockError = signal<Error | null>(null);

vi.spyOn(injectSpeechMock, 'injectSpeechRecognition').mockReturnValue({
  isSupported: signal(true).asReadonly(),
  transcript: mockTranscript.asReadonly(),
  interimTranscript: signal('').asReadonly(),
  isListening: mockIsListening.asReadonly(),
  error: mockError.asReadonly(),
  start: vi.fn(),
  stop: vi.fn(),
  abort: vi.fn(),
});

describe('VoiceInputDirective', () => {
  let result: RenderResult<any>;
  let control: FormControl;

  beforeEach(async () => {
    control = new FormControl('');

    result = await render(VoiceInputDirective, {
      template: `<input type="text" [formControl]="control" voiceInput />`,
      imports: [ReactiveFormsModule],
      hostProperties: {
        control,
      },
    });
  });

  it('should create and apply aria-autocomplete attribute', () => {
    const inputElement = result.fixture.nativeElement.querySelector('input');
    expect(inputElement).toBeTruthy();
    expect(inputElement.getAttribute('aria-autocomplete')).toBe('list');
  });

  it('should announce listening status by setting aria-busy', () => {
    const inputElement = result.fixture.nativeElement.querySelector('input');

    mockIsListening.set(true);
    result.fixture.detectChanges();
    expect(inputElement.getAttribute('aria-busy')).toBe('true');

    mockIsListening.set(false);
    result.fixture.detectChanges();
    expect(inputElement.getAttribute('aria-busy')).toBe('false');
  });
});
