/// <reference lib="webworker" />

/**
 * Benchmark worker — deterministic synthetic backend.
 *
 * Receives a request describing what work to simulate, performs that work
 * inside the worker (cpu burn, payload generation, delay), then returns a
 * synthetic response. By keeping the simulated server work identical across
 * transports (Worker vs main-thread baseline), the only variable measured
 * is the cost of the transport itself.
 *
 * Request payload shape:
 * {
 *   payloadBytes: number;   // generated synthetic JSON of ~this size
 *   delayMs: number;        // setTimeout to simulate network/server latency
 *   cpuBurnMs: number;      // synchronous work to simulate parsing/serialization on the server side
 * }
 */

interface BenchmarkRequest {
  payloadBytes: number;
  delayMs: number;
  cpuBurnMs: number;
  streaming?: boolean;
}

interface BenchmarkResponse {
  generatedAt: number;
  bytes: number;
  payload?: string;
  body?: any;
}

function burnCpu(ms: number): void {
  if (ms <= 0) return;
  const start = performance.now();
  let spin = 0;
  while (performance.now() - start < ms) {
    spin += 1;
  }
  // Prevent dead-code elimination of the spin loop.
  if (spin < 0) self.postMessage({ type: 'noop' });
}

function generatePayload(bytes: number): string {
  if (bytes <= 0) return '';
  // ~1 byte per char for ASCII; close enough for benchmarking.
  const chunk = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const repeats = Math.ceil(bytes / chunk.length);
  return chunk.repeat(repeats).slice(0, bytes);
}

/**
 * Benchmark worker — deterministic synthetic backend with granular timing.
 *
 * Receives a request describing what work to simulate, performs that work
 * inside the worker (cpu burn, payload generation, delay), then returns a
 * synthetic response with detailed stage timing for performance analysis.
 */
async function handleMessage(data: {
  type: string;
  requestId?: string;
  payload?: BenchmarkRequest;
  timing?: unknown;
}): Promise<void> {
  const { type, requestId, payload } = data;

  if (type === 'cancel') {
    return;
  }

  if (type !== 'request') {
    return;
  }

  // Capture entry timestamp for transfer-in timing
  const workerReceivedAt = performance.now();

  const req = (payload as BenchmarkRequest) ?? { payloadBytes: 0, delayMs: 0, cpuBurnMs: 0 };

  // Deserialize request (minimal for this synthetic worker)
  const deserializationStart = performance.now();
  // In a real worker-http scenario, this would deserialize SerializableRequest
  const deserializationEnd = performance.now();

  // Worker processing stage
  let body: any = null;
  const processingStart = performance.now();
  burnCpu(req.cpuBurnMs);

  if (req.streaming) {
    const encoder = new TextEncoder();
    const totalBytes = req.payloadBytes;
    const chunkSize = 256 * 1024; // 256KB chunks
    const chunkDelay =
      req.delayMs > 0 ? req.delayMs / Math.max(1, Math.ceil(totalBytes / chunkSize)) : 0;

    body = new ReadableStream({
      start(controller) {
        let sent = 0;
        const sendNext = () => {
          if (sent >= totalBytes) {
            controller.close();
            return;
          }
          const size = Math.min(chunkSize, totalBytes - sent);
          const chunkData = generatePayload(size);
          controller.enqueue(encoder.encode(chunkData));
          sent += size;

          if (chunkDelay > 0) {
            setTimeout(sendNext, chunkDelay);
          } else {
            sendNext();
          }
        };
        sendNext();
      },
    });
  } else {
    if (req.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, req.delayMs));
    }
    body = generatePayload(req.payloadBytes);
  }
  const processingEnd = performance.now();

  // Serialize response
  const serializationStart = performance.now();
  const result: BenchmarkResponse = {
    generatedAt: Date.now(),
    bytes: req.payloadBytes,
    ...(req.streaming ? { body } : { payload: body }),
  };
  const serializationEnd = performance.now();

  // Capture exit timestamp for transfer-out timing
  const workerSendingAt = performance.now();

  const transferables: Transferable[] = [];
  if (result.body instanceof ReadableStream) {
    const { needsPolyfill, serializeStreamToPort } =
      await import('@angular-helpers/worker-http/streams-polyfill');
    if (needsPolyfill()) {
      const port = serializeStreamToPort(result.body);
      result.body = { __isStreamPolyfillPort: true, port };
      transferables.push(port);
    } else {
      transferables.push(result.body);
    }
  }

  const workerTiming = {
    // Time from message received to start of processing
    deserializationMs: deserializationEnd - deserializationStart,
    // Time spent doing actual work
    processingMs: processingEnd - processingStart,
    // Time to serialize response
    serializationMs: serializationEnd - serializationStart,
    // Total time in worker (for transfer calculations)
    totalInWorkerMs: workerSendingAt - workerReceivedAt,
    // Timestamps for calculating transfer times on main thread
    workerReceivedAt,
    workerSendingAt,
  };

  (result as any).workerTiming = workerTiming;

  self.postMessage(
    {
      type: 'response',
      requestId,
      result,
      workerTiming,
    },
    transferables,
  );
}

/**
 * onmessage — handles both direct messages and the batch envelope
 * sent by createWorkerTransport (which wraps requests in
 * `{ type: 'batch', messages: [...] }` via queueMicrotask).
 */
self.onmessage = async (event: MessageEvent) => {
  const data = event.data;

  if (data?.type === 'batch' && Array.isArray(data.messages)) {
    await Promise.all(data.messages.map((msg: any) => handleMessage(msg)));
  } else {
    await handleMessage(data);
  }
};
