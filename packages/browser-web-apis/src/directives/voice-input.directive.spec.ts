import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Component, signal } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, NgControl } from '@angular/forms';
import { VoiceInputDirective } from './voice-input.directive';
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

@Component({
  standalone: true,
  imports: [VoiceInputDirective, ReactiveFormsModule],
  template: `<input type="text" [formControl]="control" voiceInput />`,
})
class TestComponent {
  control = new FormControl('');
}

describe('VoiceInputDirective', () => {
  let fixture: ComponentFixture<TestComponent>;
  let inputElement: HTMLInputElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestComponent],
    });
    fixture = TestBed.createComponent(TestComponent);
    fixture.detectChanges();
    inputElement = fixture.nativeElement.querySelector('input');
  });

  it('should create and apply aria-autocomplete attribute', () => {
    expect(inputElement).toBeTruthy();
    expect(inputElement.getAttribute('aria-autocomplete')).toBe('list');
  });

  it('should announce listening status by setting aria-busy', () => {
    mockIsListening.set(true);
    fixture.detectChanges();
    expect(inputElement.getAttribute('aria-busy')).toBe('true');

    mockIsListening.set(false);
    fixture.detectChanges();
    expect(inputElement.getAttribute('aria-busy')).toBe('false');
  });
});
