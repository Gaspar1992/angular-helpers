import type { TransportPort } from './transport-port.types';

/**
 * Wraps a Worker or SharedWorker into a unified TransportPort interface.
 */
export function wrapWorker(worker: Worker | SharedWorker): TransportPort {
  if ('port' in worker) {
    const port = worker.port;
    return {
      postMessage: (msg, transfer) => port.postMessage(msg, transfer!),
      addEventListener: (type, listener) => port.addEventListener(type, listener),
      removeEventListener: (type, listener) => port.removeEventListener(type, listener),
      start: () => port.start(),
      terminate: () => port.close(),
    };
  }

  return worker as unknown as TransportPort;
}
