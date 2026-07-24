import { Injectable, DestroyRef, inject, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { WEB_TRANSPORT_SUPPORTED, WEB_TRANSPORT_TOKEN } from '../providers/web-transport';

export type WebTransportState = 'connecting' | 'connected' | 'closed' | 'error';

export interface WebTransportHash {
  algorithm?: string;
  value?: BufferSource;
}

export interface WebTransportOptions {
  allowPooling?: boolean;
  requireUnreliable?: boolean;
  serverCertificateHashes?: WebTransportHash[];
  congestionControl?: 'default' | 'throughput' | 'low-latency';
}

export interface WebTransportCloseInfo {
  closeCode?: number;
  reason?: string;
}

export interface WebTransportBidirectionalStream {
  readable: ReadableStream<Uint8Array>;
  writable: WritableStream<Uint8Array>;
}

@Injectable({ providedIn: 'root' })
export class WebTransportService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly isSupportedToken = inject(WEB_TRANSPORT_SUPPORTED, { optional: true }) ?? false;
  private readonly webTransportToken = inject(WEB_TRANSPORT_TOKEN, { optional: true });

  readonly status = signal<WebTransportState>('closed');
  readonly error = signal<Error | null>(null);

  transport: any | null = null;

  private readonly datagramsSubject = new Subject<Uint8Array>();
  readonly datagrams$: Observable<Uint8Array> = this.datagramsSubject.asObservable();

  private readonly incomingUnidirectionalStreamsSubject = new Subject<ReadableStream<Uint8Array>>();
  readonly incomingUnidirectionalStreams$: Observable<ReadableStream<Uint8Array>> =
    this.incomingUnidirectionalStreamsSubject.asObservable();

  private readonly incomingBidirectionalStreamsSubject =
    new Subject<WebTransportBidirectionalStream>();
  readonly incomingBidirectionalStreams$: Observable<WebTransportBidirectionalStream> =
    this.incomingBidirectionalStreamsSubject.asObservable();

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.close();
    });
  }

  isSupported(): boolean {
    return this.isSupportedToken;
  }

  async connect(url: string | URL, options?: WebTransportOptions): Promise<void> {
    if (!this.isSupported()) {
      const err = new Error('WebTransport is not supported in this environment');
      this.error.set(err);
      this.status.set('error');
      throw err;
    }

    if (this.transport) {
      this.close();
    }

    this.status.set('connecting');
    this.error.set(null);

    try {
      const WebTransportCtor = this.webTransportToken || (globalThis as any).WebTransport;
      if (!WebTransportCtor) {
        throw new Error('WebTransport constructor is not available');
      }

      const transportInstance = new WebTransportCtor(url, options);
      this.transport = transportInstance;

      await transportInstance.ready;
      this.status.set('connected');

      this.listenDatagrams(transportInstance);
      this.listenUnidirectionalStreams(transportInstance);
      this.listenBidirectionalStreams(transportInstance);

      if (transportInstance.closed) {
        Promise.resolve(transportInstance.closed)
          .then(() => {
            if (this.transport === transportInstance) {
              this.status.set('closed');
            }
          })
          .catch((closedErr: unknown) => {
            if (this.transport === transportInstance) {
              const err = closedErr instanceof Error ? closedErr : new Error(String(closedErr));
              this.error.set(err);
              this.status.set('error');
            }
          });
      }
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      this.error.set(errorObj);
      this.status.set('error');
      this.transport = null;
      throw errorObj;
    }
  }

  async sendDatagram(data: Uint8Array | ArrayBuffer): Promise<void> {
    if (!this.transport || this.status() !== 'connected') {
      throw new Error('WebTransport is not connected');
    }

    const payload = data instanceof Uint8Array ? data : new Uint8Array(data);
    const writer = this.transport.datagrams.writable.getWriter();
    try {
      await writer.write(payload);
    } finally {
      writer.releaseLock();
    }
  }

  async createUnidirectionalStream(): Promise<WritableStream<Uint8Array>> {
    if (!this.transport || this.status() !== 'connected') {
      throw new Error('WebTransport is not connected');
    }

    return await this.transport.createUnidirectionalStream();
  }

  async createBidirectionalStream(): Promise<WebTransportBidirectionalStream> {
    if (!this.transport || this.status() !== 'connected') {
      throw new Error('WebTransport is not connected');
    }

    return await this.transport.createBidirectionalStream();
  }

  close(closeInfo?: WebTransportCloseInfo): void {
    if (this.transport) {
      const transportToClose = this.transport;
      this.transport = null;
      try {
        transportToClose.close(closeInfo);
      } catch {
        // Ignore if already closed
      }
    }
    this.status.set('closed');
  }

  private async listenDatagrams(transport: any): Promise<void> {
    if (!transport.datagrams?.readable) return;
    try {
      const reader = transport.datagrams.readable.getReader();
      while (this.transport === transport) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          this.datagramsSubject.next(value);
        }
      }
    } catch {
      // Ignore reader cancellation/errors on close
    }
  }

  private async listenUnidirectionalStreams(transport: any): Promise<void> {
    if (!transport.incomingUnidirectionalStreams) return;
    try {
      const reader = transport.incomingUnidirectionalStreams.getReader();
      while (this.transport === transport) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          this.incomingUnidirectionalStreamsSubject.next(value);
        }
      }
    } catch {
      // Ignore reader cancellation/errors on close
    }
  }

  private async listenBidirectionalStreams(transport: any): Promise<void> {
    if (!transport.incomingBidirectionalStreams) return;
    try {
      const reader = transport.incomingBidirectionalStreams.getReader();
      while (this.transport === transport) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          this.incomingBidirectionalStreamsSubject.next(value);
        }
      }
    } catch {
      // Ignore reader cancellation/errors on close
    }
  }
}
