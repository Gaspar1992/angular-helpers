/**
 * Common interface for communication ports.
 * Unifies Worker and SharedWorker (MessagePort).
 */
export interface TransportPort {
  postMessage(message: any, transfer?: Transferable[]): void;
  addEventListener(type: string, listener: any): void;
  removeEventListener(type: string, listener: any): void;
  terminate?(): void;
  start?(): void;
}
