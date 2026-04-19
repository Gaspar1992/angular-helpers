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
}

interface BenchmarkResponse {
  generatedAt: number;
  bytes: number;
  payload: string;
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
self.onmessage = async (event: MessageEvent) => {
  const { type, requestId, payload, timing } = event.data;

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
  const processingStart = performance.now();
  burnCpu(req.cpuBurnMs);

  if (req.delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, req.delayMs));
  }

  const body = generatePayload(req.payloadBytes);
  const processingEnd = performance.now();

  // Serialize response
  const serializationStart = performance.now();
  const result: BenchmarkResponse = {
    generatedAt: Date.now(),
    bytes: body.length,
    payload: body,
  };
  const serializationEnd = performance.now();

  // Capture exit timestamp for transfer-out timing
  const workerSendingAt = performance.now();

  self.postMessage({
    type: 'response',
    requestId,
    result,
    // Granular timing data for performance analysis
    workerTiming: {
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
    },
  });
};
