import {
  Directive,
  ElementRef,
  input,
  OnInit,
  OnDestroy,
  inject,
  PLATFORM_ID,
  NgZone,
  Renderer2,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NgControl } from '@angular/forms';
import { injectSpeechRecognition } from '../fns/inject-speech-recognition';
import { effect } from '@angular/core';

@Directive({
  selector: '[voiceInput]',
  standalone: true,
  host: {
    '(keydown)': 'handleKeyDown($event)',
  },
})
export class VoiceInputDirective implements OnInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly elementRef = inject(ElementRef);
  private readonly ngControl = inject(NgControl, { optional: true });
  private readonly ngZone = inject(NgZone);
  private readonly renderer = inject(Renderer2);

  readonly voiceLang = input<string>('es-ES');
  readonly voiceHotkey = input<string>('KeyV'); // Default is 'KeyV' triggered with Alt

  private readonly speech = injectSpeechRecognition();
  private liveRegion: HTMLDivElement | null = null;
  private isBrowser = false;
  private announceTimeout: any = null;

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);

    if (this.isBrowser) {
      // Effect to sync transcript with the form control or value property
      effect(() => {
        const text = this.speech.transcript();
        if (text) {
          this.ngZone.run(() => {
            this.updateValue(text);
          });
        }
      });

      // Effect to update accessibility live announcements and ARIA attributes
      effect(() => {
        const listening = this.speech.isListening();
        this.renderer.setAttribute(
          this.elementRef.nativeElement,
          'aria-busy',
          listening ? 'true' : 'false',
        );

        if (listening) {
          this.announce('Listening... Speak now.');
        } else {
          const text = this.speech.transcript();
          if (text) {
            this.announce(`Listening stopped. Text inserted: ${text}`);
          }
        }
      });

      effect(() => {
        const err = this.speech.error();
        if (err) {
          this.announce(`Speech recognition error: ${err.message}`);
        }
      });
    }
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.createLiveRegion();
      this.renderer.setAttribute(this.elementRef.nativeElement, 'aria-autocomplete', 'list');
    }
  }

  ngOnDestroy(): void {
    if (this.announceTimeout) {
      clearTimeout(this.announceTimeout);
    }
    if (this.liveRegion) {
      this.liveRegion.remove();
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

  private createLiveRegion(): void {
    this.liveRegion = this.renderer.createElement('div');
    if (this.liveRegion) {
      this.renderer.setAttribute(this.liveRegion, 'aria-live', 'polite');
      this.renderer.setAttribute(this.liveRegion, 'aria-atomic', 'true');
      this.renderer.setStyle(this.liveRegion, 'position', 'absolute');
      this.renderer.setStyle(this.liveRegion, 'width', '1px');
      this.renderer.setStyle(this.liveRegion, 'height', '1px');
      this.renderer.setStyle(this.liveRegion, 'overflow', 'hidden');
      this.renderer.setStyle(this.liveRegion, 'clip', 'rect(1px, 1px, 1px, 1px)');

      // Append to body to avoid layout pollution
      this.renderer.appendChild(document.body, this.liveRegion);
    }
  }

  private announce(message: string): void {
    if (this.liveRegion) {
      this.renderer.setProperty(this.liveRegion, 'textContent', '');
      // Delay slightly to trigger DOM updates for the screen reader
      if (this.announceTimeout) {
        clearTimeout(this.announceTimeout);
      }
      this.announceTimeout = setTimeout(() => {
        if (this.liveRegion) {
          this.renderer.setProperty(this.liveRegion, 'textContent', message);
        }
      }, 50);
    }
  }
}
