import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { BrowserApiBaseService } from './base/browser-api-base.service';
import type { BrowserCapabilityId } from './browser-capability.service';

export interface SerialPortFilter {
  usbVendorId?: number;
  usbProductId?: number;
  bluetoothServiceClassId?: string | number;
}

export interface SerialPortRequestOptions {
  filters?: SerialPortFilter[];
}

export type ParityType = 'none' | 'even' | 'odd';
export type FlowControlType = 'none' | 'hardware';

export interface SerialOptions {
  baudRate: number;
  dataBits?: 7 | 8;
  stopBits?: 1 | 2;
  parity?: ParityType;
  bufferSize?: number;
  flowControl?: FlowControlType;
}

export interface SerialPortInfo {
  usbVendorId?: number;
  usbProductId?: number;
  bluetoothServiceClassId?: string;
}

export interface SerialPort extends EventTarget {
  readonly readable: ReadableStream<Uint8Array> | null;
  readonly writable: WritableStream<Uint8Array> | null;
  open(options: SerialOptions): Promise<void>;
  close(): Promise<void>;
  getInfo(): SerialPortInfo;
  forget?(): Promise<void>;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ): void;
}

export interface SerialConnectionEvent {
  type: 'connect' | 'disconnect';
  port: SerialPort;
}

export interface SerialNavigator extends Navigator {
  serial?: {
    requestPort(options?: SerialPortRequestOptions): Promise<SerialPort>;
    getPorts(): Promise<SerialPort[]>;
    addEventListener?(
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener?(
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | EventListenerOptions,
    ): void;
  };
}

@Injectable({
  providedIn: 'root',
})
export class WebSerialService extends BrowserApiBaseService {
  protected override getApiName(): string {
    return 'web-serial';
  }

  protected override getCapabilityId(): BrowserCapabilityId {
    return 'webSerial';
  }

  override isSupported(): boolean {
    return (
      super.isSupported() &&
      typeof navigator !== 'undefined' &&
      'serial' in navigator &&
      (typeof window === 'undefined' || window.isSecureContext)
    );
  }

  protected override ensureSupported(): void {
    super.ensureSupported();
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      throw new Error('Web Serial API requires a secure context (HTTPS)');
    }
  }

  private get serialApi(): SerialNavigator['serial'] | undefined {
    return typeof navigator !== 'undefined' ? (navigator as SerialNavigator).serial : undefined;
  }

  /**
   * Requests a serial port from the user.
   */
  async requestPort(options?: SerialPortRequestOptions): Promise<SerialPort> {
    this.ensureSupported();
    const api = this.serialApi;
    if (!api || typeof api.requestPort !== 'function') {
      throw this.createError('Web Serial requestPort is not supported');
    }
    return api.requestPort(options);
  }

  /**
   * Gets a list of serial ports the user has already granted access to.
   */
  async getPorts(): Promise<SerialPort[]> {
    this.ensureSupported();
    const api = this.serialApi;
    if (!api || typeof api.getPorts !== 'function') {
      return [];
    }
    return api.getPorts();
  }

  /**
   * Opens the serial port with the specified configuration options.
   */
  async openPort(port: SerialPort, options: SerialOptions): Promise<void> {
    this.ensureSupported();
    if (!port || typeof port.open !== 'function') {
      throw this.createError('Invalid serial port');
    }
    await port.open(options);
  }

  /**
   * Closes the serial port.
   */
  async closePort(port: SerialPort): Promise<void> {
    this.ensureSupported();
    if (!port || typeof port.close !== 'function') {
      throw this.createError('Invalid serial port');
    }
    await port.close();
  }

  /**
   * Streams incoming binary data from an open serial port.
   */
  read(port: SerialPort): Observable<Uint8Array> {
    if (!this.isSupported()) {
      return throwError(() => this.createError('Web Serial API not supported'));
    }

    return new Observable<Uint8Array>((subscriber) => {
      if (!port.readable) {
        subscriber.error(this.createError('Serial port is not readable (must be opened first)'));
        return;
      }

      let reader: ReadableStreamDefaultReader<Uint8Array>;
      try {
        reader = port.readable.getReader();
      } catch (err) {
        subscriber.error(err);
        return;
      }

      let closed = false;

      const readLoop = async () => {
        try {
          while (!closed) {
            const { value, done } = await reader.read();
            if (done) {
              break;
            }
            if (value && !closed) {
              subscriber.next(value);
            }
          }
          if (!closed) {
            subscriber.complete();
          }
        } catch (err) {
          if (!closed) {
            subscriber.error(err);
          }
        } finally {
          try {
            reader.releaseLock();
          } catch {
            // Reader lock might already be released
          }
        }
      };

      void readLoop();

      return () => {
        closed = true;
        try {
          void reader.cancel();
        } catch {
          // Ignore cancellation errors on teardown
        }
      };
    });
  }

  /**
   * Writes data to an open serial port.
   */
  async write(port: SerialPort, data: BufferSource | Uint8Array | string): Promise<void> {
    this.ensureSupported();
    if (!port || !port.writable) {
      throw this.createError('Serial port is not writable (must be opened first)');
    }

    const chunk = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    const writer = port.writable.getWriter();
    try {
      await writer.write(chunk as Uint8Array);
    } finally {
      writer.releaseLock();
    }
  }

  /**
   * Observes serial port connection and disconnection events.
   */
  watchPorts(): Observable<SerialConnectionEvent> {
    if (!this.isSupported()) {
      return throwError(() => this.createError('Web Serial API not supported'));
    }

    const api = this.serialApi;
    if (!api || typeof api.addEventListener !== 'function') {
      return throwError(() => this.createError('Web Serial event listening is not supported'));
    }

    return new Observable<SerialConnectionEvent>((subscriber) => {
      const connectHandler = (event: Event) => {
        const port =
          (event as Event & { port?: SerialPort }).port ?? (event.target as unknown as SerialPort);
        subscriber.next({ type: 'connect', port });
      };

      const disconnectHandler = (event: Event) => {
        const port =
          (event as Event & { port?: SerialPort }).port ?? (event.target as unknown as SerialPort);
        subscriber.next({ type: 'disconnect', port });
      };

      api.addEventListener?.('connect', connectHandler);
      api.addEventListener?.('disconnect', disconnectHandler);

      return () => {
        api.removeEventListener?.('connect', connectHandler);
        api.removeEventListener?.('disconnect', disconnectHandler);
      };
    });
  }
}
