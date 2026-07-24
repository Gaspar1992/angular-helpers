import {
  assertInInjectionContext,
  DestroyRef,
  inject,
  PLATFORM_ID,
  signal,
  type Signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  SpeechRecognitionService,
  type SpeechRecognitionConfig,
} from '../services/speech-recognition.service';

export interface SpeechRecognitionRef {
  readonly isSupported: Signal<boolean>;
  readonly transcript: Signal<string>;
  readonly interimTranscript: Signal<string>;
  readonly isListening: Signal<boolean>;
  readonly error: Signal<Error | null>;
  start(config?: SpeechRecognitionConfig): void;
  stop(): void;
  abort(): void;
}

export function injectSpeechRecognition(): SpeechRecognitionRef {
  assertInInjectionContext(injectSpeechRecognition);
  const platformId = inject(PLATFORM_ID);
  const destroyRef = inject(DestroyRef);
  const isBrowser = isPlatformBrowser(platformId);

  const supported = signal<boolean>(false);
  const transcript = signal<string>('');
  const interimTranscript = signal<string>('');
  const isListening = signal<boolean>(false);
  const error = signal<Error | null>(null);

  let subscription: any = null;
  const service = inject(SpeechRecognitionService);

  if (isBrowser) {
    queueMicrotask(() => {
      supported.set(service.isSupported());
    });

    destroyRef.onDestroy(() => {
      cleanup();
    });
  }

  const cleanup = () => {
    if (subscription) {
      subscription.unsubscribe();
      subscription = null;
    }
    isListening.set(false);
  };

  const start = (config: SpeechRecognitionConfig = {}) => {
    if (!supported()) {
      error.set(new Error('Speech Recognition API is not supported in this environment'));
      return;
    }

    cleanup();
    error.set(null);
    transcript.set('');
    interimTranscript.set('');

    subscription = service.watch(config).subscribe({
      next: (event) => {
        if (event.type === 'start') {
          isListening.set(true);
        } else if (event.type === 'end') {
          isListening.set(false);
        } else if (event.type === 'error') {
          error.set(event.error ?? new Error('Unknown speech recognition error'));
          isListening.set(false);
        } else if (event.type === 'result' && event.results) {
          let finalResult = '';
          let interimResult = '';

          for (const res of event.results) {
            if (res.isFinal) {
              finalResult += res.transcript;
            } else {
              interimResult += res.transcript;
            }
          }

          if (finalResult) {
            transcript.update((prev) => prev + finalResult);
          }
          interimTranscript.set(interimResult);
        }
      },
      error: (err) => {
        error.set(err);
        isListening.set(false);
      },
    });
  };

  const stop = () => {
    service.stop();
  };

  const abort = () => {
    service.abort();
    cleanup();
  };

  return {
    isSupported: supported.asReadonly(),
    transcript: transcript.asReadonly(),
    interimTranscript: interimTranscript.asReadonly(),
    isListening: isListening.asReadonly(),
    error: error.asReadonly(),
    start,
    stop,
    abort,
  };
}
