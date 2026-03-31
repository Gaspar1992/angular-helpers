import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';

import {
  type NdefMessage,
  type NdefReadingEvent,
  type NdefWriteOptions,
  type NdefReaderConstructor,
  type NdefReaderInstance,
} from '../interfaces/experimental-apis.types';

export type { NdefMessage, NdefReadingEvent, NdefWriteOptions };

function getNdefReaderClass(): NdefReaderConstructor | undefined {
  return (window as unknown as { NDEFReader?: NdefReaderConstructor }).NDEFReader;
}

@Injectable()
export class WebNfcService {
  private readonly platformId = inject(PLATFORM_ID);

  isSupported(): boolean {
    return isPlatformBrowser(this.platformId) && 'NDEFReader' in window;
  }

  scan(): Observable<NdefReadingEvent> {
    if (!this.isSupported()) {
      return new Observable((o) => o.error(new Error('Web NFC API not supported')));
    }

    return new Observable<NdefReadingEvent>((subscriber) => {
      const abortController = new AbortController();
      const reader = new (getNdefReaderClass()!)();

      const onReading = (event: Event) => {
        const e = event as Event & NdefReadingEvent;
        subscriber.next({
          serialNumber: e.serialNumber,
          message: e.message,
        });
      };

      const onError = (event: Event) => {
        subscriber.error((event as ErrorEvent).error ?? new Error('NFC read error'));
      };

      reader.addEventListener('reading', onReading);
      reader.addEventListener('readingerror', onError);

      reader
        .scan({ signal: abortController.signal })
        .catch((err: unknown) => subscriber.error(err));

      return () => abortController.abort();
    });
  }

  async write(message: NdefMessage | string, options?: NdefWriteOptions): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Web NFC API not supported');
    }
    const reader = new (getNdefReaderClass()!)();
    await (reader as NdefReaderInstance).write(message, options);
  }
}
