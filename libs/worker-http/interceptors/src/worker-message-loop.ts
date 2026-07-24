import { attachPortLoop } from './worker-port-loop';
import type { RequestHandler } from './worker-fetch-executor';

/**
 * Wires up the worker's request handler around a built request chain.
 *
 * Automatically detects if running in a Dedicated Worker or Shared Worker context
 * and attaches the appropriate listeners.
 */
export function attachRequestLoop(chain: RequestHandler): () => void {
  const disposers: Array<() => void> = [];

  // Shared Worker context
  if ('onconnect' in self) {
    const connectHandler = (event: any) => {
      const port = event.ports[0];
      disposers.push(attachPortLoop(port, chain));
      port.start();
    };
    self.addEventListener('connect', connectHandler);
    disposers.push(() => self.removeEventListener('connect', connectHandler));
  } else {
    // Dedicated Worker context
    disposers.push(attachPortLoop(self as any, chain));
  }

  return () => {
    for (const dispose of disposers) {
      dispose();
    }
    disposers.length = 0;
  };
}
