import {
  assertInInjectionContext,
  DestroyRef,
  inject,
  PLATFORM_ID,
  signal,
  type Signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, Subscription, tap } from 'rxjs';
import {
  WebSerialService,
  type SerialPort,
  type SerialOptions,
  type SerialPortRequestOptions,
} from '../services/web-serial.service';

export interface SerialRef {
  readonly isSupported: Signal<boolean>;
  readonly port: Signal<SerialPort | null>;
  readonly isOpen: Signal<boolean>;
  readonly data: Signal<Uint8Array | null>;
  readonly error: Signal<Error | null>;
  requestPort(options?: SerialPortRequestOptions): Promise<SerialPort | null>;
  open(options: SerialOptions, targetPort?: SerialPort): Promise<boolean>;
  close(): Promise<void>;
  write(data: BufferSource | Uint8Array | string): Promise<boolean>;
  readStream(targetPort?: SerialPort): Observable<Uint8Array>;
}

export function injectSerial(): SerialRef {
  assertInInjectionContext(injectSerial);

  const platformId = inject(PLATFORM_ID);
  const destroyRef = inject(DestroyRef);
  const service = inject(WebSerialService);
  const isBrowser = isPlatformBrowser(platformId);

  const supported = signal<boolean>(false);
  const currentPort = signal<SerialPort | null>(null);
  const isPortOpen = signal<boolean>(false);
  const latestData = signal<Uint8Array | null>(null);
  const errorSignal = signal<Error | null>(null);

  let activeSubscription: Subscription | null = null;
  let activePort: SerialPort | null = null;
  let disposed = false;

  if (isBrowser) {
    let destroyed = false;
    queueMicrotask(() => {
      if (destroyed) return;
      supported.set(service.isSupported());
    });

    destroyRef.onDestroy(() => {
      destroyed = true;
      disposed = true;
      if (activeSubscription) {
        activeSubscription.unsubscribe();
        activeSubscription = null;
      }
      if (activePort && isPortOpen()) {
        try {
          void service.closePort(activePort);
        } catch {
          // Ignore close error on teardown
        }
        activePort = null;
      }
    });
  } else {
    destroyRef.onDestroy(() => {
      disposed = true;
    });
  }

  const requestPort = async (options?: SerialPortRequestOptions): Promise<SerialPort | null> => {
    if (!supported() || disposed) {
      errorSignal.set(new Error('Web Serial API is not supported in this environment'));
      return null;
    }

    errorSignal.set(null);
    try {
      const selectedPort = await service.requestPort(options);
      currentPort.set(selectedPort);
      activePort = selectedPort;
      return selectedPort;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      errorSignal.set(error);
      return null;
    }
  };

  const open = async (options: SerialOptions, targetPort?: SerialPort): Promise<boolean> => {
    const p = targetPort ?? currentPort();
    if (!p) {
      const err = new Error('No SerialPort available to open');
      errorSignal.set(err);
      return false;
    }

    if (!supported() || disposed) {
      errorSignal.set(new Error('Web Serial API is not supported in this environment'));
      return false;
    }

    errorSignal.set(null);
    try {
      if (p !== activePort) {
        currentPort.set(p);
        activePort = p;
      }
      await service.openPort(p, options);
      isPortOpen.set(true);
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      errorSignal.set(error);
      return false;
    }
  };

  const close = async (): Promise<void> => {
    if (activeSubscription) {
      activeSubscription.unsubscribe();
      activeSubscription = null;
    }

    const p = currentPort();
    if (p) {
      try {
        await service.closePort(p);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        errorSignal.set(error);
      }
    }
    isPortOpen.set(false);
  };

  const write = async (data: BufferSource | Uint8Array | string): Promise<boolean> => {
    const p = currentPort();
    if (!p) {
      const err = new Error('No SerialPort available to write');
      errorSignal.set(err);
      return false;
    }

    if (!supported() || disposed) {
      errorSignal.set(new Error('Web Serial API is not supported in this environment'));
      return false;
    }

    errorSignal.set(null);
    try {
      await service.write(p, data);
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      errorSignal.set(error);
      return false;
    }
  };

  const readStream = (targetPort?: SerialPort): Observable<Uint8Array> => {
    const p = targetPort ?? currentPort();
    if (!p) {
      const stream = service.read({ readable: null } as unknown as SerialPort);
      return stream;
    }

    const stream$ = service.read(p).pipe(
      tap({
        next: (chunk) => {
          if (!disposed) {
            latestData.set(chunk);
          }
        },
        error: (err) => {
          if (!disposed) {
            const error = err instanceof Error ? err : new Error(String(err));
            errorSignal.set(error);
          }
        },
      }),
    );

    return stream$;
  };

  return {
    isSupported: supported.asReadonly(),
    port: currentPort.asReadonly(),
    isOpen: isPortOpen.asReadonly(),
    data: latestData.asReadonly(),
    error: errorSignal.asReadonly(),
    requestPort,
    open,
    close,
    write,
    readStream,
  };
}
