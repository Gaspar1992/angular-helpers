import {
  assertInInjectionContext,
  computed,
  DestroyRef,
  inject,
  isSignal,
  PLATFORM_ID,
  signal,
  type ResourceRef,
  type Signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import type {
  WebTransportOptions,
  WebTransportCloseInfo,
  WebTransportBidirectionalStream,
} from '../services/web-transport.service';

export type WebTransportStatus = 'connecting' | 'connected' | 'closed' | 'error';

export interface WebTransportResourceOptions extends WebTransportOptions {
  /** Optional auto-connect flag. Defaults to true. */
  autoConnect?: boolean;
}

export interface WebTransportSessionInfo {
  transport: any;
  url: string;
}

export interface WebTransportResourceRef {
  /** The underlying rxResource instance */
  readonly resource: ResourceRef<WebTransportSessionInfo | null>;
  /** Reactive status signal */
  readonly status: Signal<WebTransportStatus>;
  /** Latest datagram payload signal */
  readonly datagram: Signal<Uint8Array | null>;
  /** Signal indicating whether WebTransport is supported in the current environment */
  readonly isSupported: Signal<boolean>;
  /** Send datagram payload over datagrams.writable */
  sendDatagram(data: Uint8Array | ArrayBuffer): Promise<void>;
  /** Create outgoing unidirectional stream */
  createUnidirectionalStream(options?: any): Promise<WritableStream<Uint8Array>>;
  /** Create outgoing bidirectional stream */
  createBidirectionalStream(): Promise<WebTransportBidirectionalStream>;
  /** Incoming unidirectional streams */
  readonly incomingUnidirectionalStreams: ReadableStream<ReadableStream<Uint8Array>> | null;
  /** Incoming bidirectional streams */
  readonly incomingBidirectionalStreams: ReadableStream<WebTransportBidirectionalStream> | null;
  /** Explicitly close transport session */
  close(closeInfo?: WebTransportCloseInfo): void;
}

export function injectWebTransportResource(
  url: string | Signal<string | null | undefined> | (() => string | null | undefined),
  options?: WebTransportResourceOptions,
): WebTransportResourceRef {
  assertInInjectionContext(injectWebTransportResource);
  const platformId = inject(PLATFORM_ID);
  const destroyRef = inject(DestroyRef);
  const isBrowser = isPlatformBrowser(platformId);

  const supported = signal<boolean>(false);
  if (isBrowser) {
    supported.set(typeof globalThis !== 'undefined' && 'WebTransport' in globalThis);
  }

  const internalStatus = signal<WebTransportStatus>('closed');
  const datagramSignal = signal<Uint8Array | null>(null);
  let currentTransport: any = null;

  const getUrl = (): string | null | undefined => {
    if (typeof url === 'function') {
      return url();
    }
    if (isSignal(url)) {
      return (url as Signal<string | null | undefined>)();
    }
    return url;
  };

  const resource = rxResource<WebTransportSessionInfo | null, string | null>({
    params: () => {
      if (!isBrowser || !supported()) {
        return 'UNSUPPORTED';
      }
      if (options?.autoConnect === false) {
        return null;
      }
      const targetUrl = getUrl();
      return targetUrl || null;
    },
    stream: (param) => {
      const targetUrl = (param as any).request ?? (param as any).params;
      const abortSignal = param.abortSignal;
      if (targetUrl === 'UNSUPPORTED') {
        internalStatus.set('error');
        throw new Error('WebTransport is not supported in this environment');
      }

      internalStatus.set('connecting');

      return new Observable<WebTransportSessionInfo | null>((subscriber) => {
        let transport: any = null;
        let active = true;

        const WebTransportCtor = (globalThis as any).WebTransport;
        if (!WebTransportCtor) {
          internalStatus.set('error');
          subscriber.error(new Error('WebTransport constructor is not available'));
          return;
        }

        try {
          transport = new WebTransportCtor(targetUrl, options);
          currentTransport = transport;

          const listenDatagrams = async (t: any) => {
            if (!t.datagrams?.readable) return;
            try {
              const reader = t.datagrams.readable.getReader();
              while (active && currentTransport === t) {
                const { value, done } = await reader.read();
                if (done) break;
                if (value) {
                  datagramSignal.set(value instanceof Uint8Array ? value : new Uint8Array(value));
                }
              }
            } catch {
              // Ignore reader cancellation errors
            }
          };

          Promise.resolve(transport.ready).then(
            () => {
              if (!active) return;
              internalStatus.set('connected');
              subscriber.next({ transport, url: targetUrl });
              listenDatagrams(transport);

              if (transport.closed) {
                Promise.resolve(transport.closed).then(
                  () => {
                    if (active) {
                      internalStatus.set('closed');
                    }
                  },
                  (closedErr) => {
                    if (active) {
                      internalStatus.set('error');
                      subscriber.error(
                        closedErr instanceof Error ? closedErr : new Error(String(closedErr)),
                      );
                    }
                  },
                );
              }
            },
            (readyErr) => {
              if (active) {
                internalStatus.set('error');
                subscriber.error(
                  readyErr instanceof Error ? readyErr : new Error(String(readyErr)),
                );
              }
            },
          );
        } catch (err) {
          internalStatus.set('error');
          subscriber.error(err instanceof Error ? err : new Error(String(err)));
        }

        const cleanup = () => {
          active = false;
          if (currentTransport === transport) {
            currentTransport = null;
          }
          if (transport) {
            try {
              transport.close();
            } catch {
              // Ignore
            }
          }
          if (internalStatus() === 'connected' || internalStatus() === 'connecting') {
            internalStatus.set('closed');
          }
        };

        const abortHandler = () => {
          cleanup();
          subscriber.complete();
        };

        abortSignal.addEventListener('abort', abortHandler);

        return () => {
          cleanup();
          abortSignal.removeEventListener('abort', abortHandler);
        };
      });
    },
  });

  const status = computed<WebTransportStatus>(() => {
    if (!isBrowser || !supported()) {
      return 'error';
    }

    const resStatus = resource.status();
    if (resStatus === 'error') {
      return 'error';
    }

    try {
      resource.value();
    } catch {
      return 'error';
    }

    if (internalStatus() === 'closed') {
      const u = getUrl();
      if (options?.autoConnect !== false && u && resStatus !== 'resolved') {
        return 'connecting';
      }
    }
    return internalStatus();
  });

  const sendDatagram = async (data: Uint8Array | ArrayBuffer): Promise<void> => {
    if (!currentTransport || status() !== 'connected') {
      throw new Error('WebTransport is not connected');
    }
    const payload = data instanceof Uint8Array ? data : new Uint8Array(data);
    const writer = currentTransport.datagrams?.writable?.getWriter();
    if (!writer) {
      throw new Error('Datagrams writable stream is not available');
    }
    try {
      await writer.write(payload);
    } finally {
      writer.releaseLock();
    }
  };

  const createUnidirectionalStream = async (
    streamOptions?: any,
  ): Promise<WritableStream<Uint8Array>> => {
    if (!currentTransport || status() !== 'connected') {
      throw new Error('WebTransport is not connected');
    }
    return await currentTransport.createUnidirectionalStream(streamOptions);
  };

  const createBidirectionalStream = async (): Promise<WebTransportBidirectionalStream> => {
    if (!currentTransport || status() !== 'connected') {
      throw new Error('WebTransport is not connected');
    }
    return await currentTransport.createBidirectionalStream();
  };

  const close = (closeInfo?: WebTransportCloseInfo): void => {
    if (currentTransport) {
      const t = currentTransport;
      currentTransport = null;
      try {
        t.close(closeInfo);
      } catch {
        // Ignore
      }
    }
    internalStatus.set('closed');
  };

  destroyRef.onDestroy(() => {
    close();
  });

  return {
    resource: resource as unknown as ResourceRef<WebTransportSessionInfo | null>,
    status,
    datagram: datagramSignal.asReadonly(),
    isSupported: supported.asReadonly(),
    sendDatagram,
    createUnidirectionalStream,
    createBidirectionalStream,
    get incomingUnidirectionalStreams() {
      return currentTransport?.incomingUnidirectionalStreams ?? null;
    },
    get incomingBidirectionalStreams() {
      return currentTransport?.incomingBidirectionalStreams ?? null;
    },
    close,
  };
}

export function injectWebTransport(
  url: string | Signal<string | null | undefined> | (() => string | null | undefined),
  options?: WebTransportResourceOptions,
): WebTransportResourceRef {
  assertInInjectionContext(injectWebTransport);
  return injectWebTransportResource(url, options);
}
