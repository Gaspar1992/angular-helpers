import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BrowserApiBaseService } from './base/browser-api-base.service';
import type { BrowserCapabilityId } from './browser-capability.service';

export interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
  confidence: number;
}

export interface SpeechRecognitionEvent {
  type: 'start' | 'end' | 'result' | 'error';
  results?: SpeechRecognitionResult[];
  error?: Error;
}

export interface SpeechRecognitionConfig {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

interface WindowWithSpeechRecognition extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

@Injectable()
export class SpeechRecognitionService extends BrowserApiBaseService {
  private recognition: any = null;

  protected override getApiName(): string {
    return 'speech-recognition';
  }

  protected override getCapabilityId(): BrowserCapabilityId {
    return 'speechRecognition';
  }

  /**
   * Watches speech recognition events in real-time.
   */
  watch(config: SpeechRecognitionConfig = {}): Observable<SpeechRecognitionEvent> {
    return new Observable<SpeechRecognitionEvent>((observer) => {
      this.ensureSupported();

      const SpeechRecognitionClass =
        (window as unknown as WindowWithSpeechRecognition).SpeechRecognition ||
        (window as unknown as WindowWithSpeechRecognition).webkitSpeechRecognition;

      const recognition = new SpeechRecognitionClass();
      this.recognition = recognition;

      recognition.continuous = config.continuous ?? false;
      recognition.interimResults = config.interimResults ?? false;
      recognition.maxAlternatives = config.maxAlternatives ?? 1;
      if (config.lang) {
        recognition.lang = config.lang;
      }

      recognition.onstart = () => {
        observer.next({ type: 'start' });
      };

      recognition.onend = () => {
        observer.next({ type: 'end' });
        observer.complete();
      };

      recognition.onerror = (event: any) => {
        const error = new Error(`Speech recognition error: ${event.error}`);
        observer.next({ type: 'error', error });
        observer.error(error);
      };

      recognition.onresult = (event: any) => {
        const results: SpeechRecognitionResult[] = [];
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const resultList = event.results[i];
          if (resultList.length > 0) {
            results.push({
              transcript: resultList[0].transcript,
              isFinal: resultList.isFinal,
              confidence: resultList[0].confidence,
            });
          }
        }
        observer.next({ type: 'result', results });
      };

      recognition.start();

      return () => {
        try {
          recognition.abort();
        } catch {
          // Ignore if already stopped
        }
        this.recognition = null;
      };
    });
  }

  /**
   * Stop the speech recognition service (saves recognized audio).
   */
  stop(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  /**
   * Abort the speech recognition service (immediately drops connection).
   */
  abort(): void {
    if (this.recognition) {
      this.recognition.abort();
    }
  }
}
