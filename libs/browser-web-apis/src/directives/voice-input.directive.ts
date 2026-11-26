import {
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  type OnInit,
  PLATFORM_ID,
  Renderer2,
  untracked,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NgControl } from '@angular/forms';
import { injectSpeechRecognition } from '../fns/inject-speech-recognition';
import { LiveAnnouncerService } from '../services/live-announcer.service';

@Directive({
  selector: '[voiceInput]',
  host: {
    '(keydown)': 'handleKeyDown($event)',
  },
})
export class VoiceInputDirective implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly elementRef = inject(ElementRef);
  private readonly ngControl = inject(NgControl, { optional: true });
  private readonly renderer = inject(Renderer2);
  private readonly liveAnnouncer = inject(LiveAnnouncerService);

  readonly voiceLang = input<string>('en-US');
  readonly voiceHotkey = input<string>('KeyV'); // Default is 'KeyV' triggered with Alt

  private readonly speech = injectSpeechRecognition();
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  constructor() {
    if (this.isBrowser) {
      effect(() => {
        const text = this.speech.transcript();
        if (text) {
          this.updateValue(text);
        }
      });

      effect(() => {
        const listening = this.speech.isListening();
        this.renderer.setAttribute(
          this.elementRef.nativeElement,
          'aria-busy',
          listening ? 'true' : 'false',
        );

        if (listening) {
          this.liveAnnouncer.announce('Listening... Speak now.');
        } else {
          const text = untracked(() => this.speech.transcript());
          if (text) {
            this.liveAnnouncer.announce(`Listening stopped. Text inserted: ${text}`);
          }
        }
      });

      effect(() => {
        const err = this.speech.error();
        if (err) {
          this.liveAnnouncer.announce(`Speech recognition error: ${err.message}`);
        }
      });
    }
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.renderer.setAttribute(this.elementRef.nativeElement, 'aria-autocomplete', 'list');
    }
  }

  handleKeyDown(event: KeyboardEvent): void {
    // Listen for Alt + hotkey combination
    if (event.altKey && event.code === this.voiceHotkey()) {
      event.preventDefault();
      this.toggleSpeech();
    }
  }

  private toggleSpeech(): void {
    if (this.speech.isListening()) {
      this.speech.stop();
    } else {
      this.speech.start({
        lang: this.voiceLang(),
        continuous: false,
        interimResults: true,
      });
    }
  }

  private updateValue(value: string): void {
    const inputEl = this.elementRef.nativeElement;

    // Support standard inputs/textareas
    const currentValue = inputEl.value || '';
    const newValue = currentValue ? `${currentValue.trim()} ${value}` : value;

    if (this.ngControl && this.ngControl.control) {
      this.ngControl.control.setValue(newValue);
      this.ngControl.control.markAsDirty();
    } else {
      inputEl.value = newValue;
      // Dispatch input event for external integrations
      const event = new Event('input', { bubbles: true });
      inputEl.dispatchEvent(event);
    }
  }
}
