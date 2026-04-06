import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BrowserApiBaseService } from './base/browser-api-base.service';

export type SpeechState = 'idle' | 'speaking' | 'paused';

export interface SpeechOptions {
  lang?: string;
  voice?: SpeechSynthesisVoice;
  volume?: number;
  rate?: number;
  pitch?: number;
}

@Injectable()
export class SpeechSynthesisService extends BrowserApiBaseService {
  protected override getApiName(): string {
    return 'speech-synthesis';
  }

  isSupported(): boolean {
    return this.isBrowserEnvironment() && 'speechSynthesis' in window;
  }

  private ensureSpeechSynthesisSupported(): void {
    if (!this.isSupported()) {
      throw new Error('Speech Synthesis API not supported in this browser');
    }
  }

  get state(): SpeechState {
    if (!this.isSupported()) return 'idle';
    if (speechSynthesis.speaking && !speechSynthesis.paused) return 'speaking';
    if (speechSynthesis.paused) return 'paused';
    return 'idle';
  }

  get isPending(): boolean {
    return this.isSupported() && speechSynthesis.pending;
  }

  getVoices(): SpeechSynthesisVoice[] {
    if (!this.isSupported()) return [];
    return speechSynthesis.getVoices();
  }

  watchVoices(): Observable<SpeechSynthesisVoice[]> {
    return new Observable<SpeechSynthesisVoice[]>((observer) => {
      if (!this.isSupported()) {
        observer.next([]);
        observer.complete();
        return undefined;
      }

      const emit = () => observer.next(speechSynthesis.getVoices());

      speechSynthesis.addEventListener('voiceschanged', emit);
      emit();

      const cleanup = () => speechSynthesis.removeEventListener('voiceschanged', emit);
      this.destroyRef.onDestroy(cleanup);

      return cleanup;
    });
  }

  speak(text: string, options: SpeechOptions = {}): Observable<SpeechState> {
    return new Observable<SpeechState>((observer) => {
      this.ensureSpeechSynthesisSupported();

      const utterance = new SpeechSynthesisUtterance(text);

      if (options.lang) utterance.lang = options.lang;
      if (options.voice) utterance.voice = options.voice;
      if (options.volume !== undefined) utterance.volume = options.volume;
      if (options.rate !== undefined) utterance.rate = options.rate;
      if (options.pitch !== undefined) utterance.pitch = options.pitch;

      utterance.onstart = () => observer.next('speaking');
      utterance.onpause = () => observer.next('paused');
      utterance.onresume = () => observer.next('speaking');
      utterance.onend = () => {
        observer.next('idle');
        observer.complete();
      };
      utterance.onerror = (event) => {
        observer.error(new Error(`Speech synthesis error: ${event.error}`));
      };

      observer.next('speaking');
      speechSynthesis.speak(utterance);

      const cleanup = () => {
        speechSynthesis.cancel();
        observer.next('idle');
      };

      this.destroyRef.onDestroy(cleanup);

      return cleanup;
    });
  }

  pause(): void {
    if (this.isSupported()) speechSynthesis.pause();
  }

  resume(): void {
    if (this.isSupported()) speechSynthesis.resume();
  }

  cancel(): void {
    if (this.isSupported()) speechSynthesis.cancel();
  }
}
