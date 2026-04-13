import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BrowserApiBaseService } from '@angular-helpers/browser-web-apis';
import {
  type NdefMessage,
  type NdefReadingEvent,
  type NdefWriteOptions,
  type NdefReaderConstructor,
  type NdefReaderInstance,
} from './experimental-apis.types';

export type { NdefMessage, NdefReadingEvent, NdefWriteOptions };

function getNdefReaderClass(): NdefReaderConstructor | undefined {
  return (window as unknown as { NDEFReader?: NdefReaderConstructor }).NDEFReader;
}

@Injectable()
export class WebNfcService extends BrowserApiBaseService {
  protected override getApiName(): string {
    return 'web-nfc';
  }

  isSupported(): boolean {
    return this.isBrowserEnvironment() && 'NDEFReader' in window;
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
