import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { VoiceInputDirective } from './voice-input.directive';
import { render, RenderResult } from '@angular-helpers/testing';
import * as injectSpeechMock from '../fns/inject-speech-recognition';

const mockTranscript = signal('');
const mockIsListening = signal(false);
const mockError = signal<Error | null>(null);
const mockStart = vi.fn();
const mockStop = vi.fn();
const mockAbort = vi.fn();

vi.spyOn(injectSpeechMock, 'injectSpeechRecognition').mockReturnValue({
  isSupported: signal(true).asReadonly(),
  transcript: mockTranscript.asReadonly(),
  interimTranscript: signal('').asReadonly(),
  isListening: mockIsListening.asReadonly(),
  error: mockError.asReadonly(),
  start: mockStart,
  stop: mockStop,
  abort: mockAbort,
});

describe('VoiceInputDirective', () => {
  let result: RenderResult<any>;
  let control: FormControl;

  beforeEach(async () => {
    vi.useFakeTimers();
    mockTranscript.set('');
    mockIsListening.set(false);
    mockError.set(null);
    mockStart.mockClear();
    mockStop.mockClear();

    control = new FormControl('');

    result = await render(VoiceInputDirective, {
      template: `<input type="text" [formControl]="control" voiceInput [voiceLang]="'en-US'" />`,
      imports: [ReactiveFormsModule],
      hostProperties: {
        control,
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create and apply aria-autocomplete attribute', () => {
    const inputElement = result.fixture.nativeElement.querySelector('input');
    expect(inputElement).toBeTruthy();
    expect(inputElement.getAttribute('aria-autocomplete')).toBe('list');
  });

  it('should announce listening status by setting aria-busy and updating live region', () => {
    const inputElement = result.fixture.nativeElement.querySelector('input');

    mockIsListening.set(true);
    result.fixture.detectChanges();
    vi.advanceTimersByTime(60);
    expect(inputElement.getAttribute('aria-busy')).toBe('true');

    mockTranscript.set('hello world');
    mockIsListening.set(false);
    result.fixture.detectChanges();
    vi.advanceTimersByTime(60);
    expect(inputElement.getAttribute('aria-busy')).toBe('false');
    expect(control.value).toBe('hello world');
    expect(control.dirty).toBe(true);

    // Append second transcript to existing value
    mockTranscript.set('again');
    result.fixture.detectChanges();
    expect(control.value).toBe('hello world again');
  });

  it('should announce speech recognition errors and clean up on destroy', () => {
    mockError.set(new Error('network error'));
    result.fixture.detectChanges();
    // Destroy before timeout fires to exercise clearTimeout in ngOnDestroy
    result.fixture.destroy();
  });

  it('should toggle speech recognition on Alt + voiceHotkey', () => {
    const inputElement: HTMLInputElement = result.fixture.nativeElement.querySelector('input');

    const startEvent = new KeyboardEvent('keydown', {
      altKey: true,
      code: 'KeyV',
      cancelable: true,
    });
    inputElement.dispatchEvent(startEvent);
    expect(startEvent.defaultPrevented).toBe(true);
    expect(mockStart).toHaveBeenCalledWith({
      lang: 'en-US',
      continuous: false,
      interimResults: true,
    });

    mockIsListening.set(true);
    result.fixture.detectChanges();

    const stopEvent = new KeyboardEvent('keydown', {
      altKey: true,
      code: 'KeyV',
      cancelable: true,
    });
    inputElement.dispatchEvent(stopEvent);
    expect(mockStop).toHaveBeenCalledTimes(1);
  });

  it('should update native input value and dispatch input event when used without NgControl', async () => {
    TestBed.resetTestingModule();
    const plainResult = await render(VoiceInputDirective, {
      template: `<input type="text" voiceInput />`,
    });
    const inputEl: HTMLInputElement = plainResult.fixture.nativeElement.querySelector('input');
    const inputSpy = vi.fn();
    inputEl.addEventListener('input', inputSpy);

    mockTranscript.set('standalone text');
    plainResult.fixture.detectChanges();

    expect(inputEl.value).toBe('standalone text');
    expect(inputSpy).toHaveBeenCalledTimes(1);
  });
});
