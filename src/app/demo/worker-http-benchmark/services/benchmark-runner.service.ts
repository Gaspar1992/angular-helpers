import { Injectable, OnDestroy } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { createWorkerTransport } from '@angular-helpers/worker-http/transport';
import type { WorkerTransport } from '@angular-helpers/worker-http/transport';

import { MetricsCollector } from './metrics-collector';
import type { BenchmarkMetrics, RequestMetrics, StageMetrics } from './metrics-collector';
import type { BenchmarkScenario, ScenarioRequestSpec } from './benchmark-scenarios';

/**
 * Granular request timing for pipeline stage analysis.
 * Tracks all 6 stages: init, serialization, transfer-out, processing, transfer-in, deserialization
 */
interface GranularRequestTiming {
  requestId: string;
  startTime: number;
  stages: Map<string, { start: number; end?: number }>;
  payloadSize: number;
}

/** Global request metrics storage for test instrumentation */
declare global {
  interface Window {
    __benchmarkMetrics?: RequestMetrics[];
    __droppedFramesWorker?: number;
    __droppedFramesFetch?: number;
    __benchmarkComplete?: boolean;
    __runBenchmark?: (scenario: string, transport: string) => Promise<void>;
  }
}

const BENCHMARK_WORKER_URL = 'assets/workers/benchmark.worker.js';

export type BenchmarkMode = 'main-thread' | 'worker-pool-1' | 'worker-pool-4';

export interface BenchmarkRunResult {
  scenarioId: string;
  mode: BenchmarkMode;
  metrics: BenchmarkMetrics;
  successCount: number;
  failureCount: number;
  /** Granular per-request metrics with pipeline stage breakdown */
  requestMetrics?: RequestMetrics[];
}

interface BenchmarkResponse {
  generatedAt: number;
  bytes: number;
  payload?: string;
  body?: any;
}

/**
 * BenchmarkRunnerService — executes scenarios across transport modes.
 *
 * Each run:
 *  1. Optionally schedules a chunked main-thread CPU burn (simulates UI work)
 *  2. Starts the metrics collector
 *  3. Dispatches the scenario's requests via the chosen mode
 *  4. Awaits all requests + the burn to complete
 *  5. Stops the collector and returns metrics
 *
 * Workers are pooled across runs to avoid measuring worker boot time on every
 * scenario. Call `dispose()` to release them (called automatically on destroy).
 */
@Injectable()
export class BenchmarkRunnerService implements OnDestroy {
  private workerPool1: WorkerTransport<ScenarioRequestSpec, BenchmarkResponse> | null = null;
  private workerPool4: WorkerTransport<ScenarioRequestSpec, BenchmarkResponse> | null = null;

  async run(scenario: BenchmarkScenario, mode: BenchmarkMode): Promise<BenchmarkRunResult> {
    const collector = new MetricsCollector();

    // Array to collect granular metrics for each request
    const requestMetrics: RequestMetrics[] = [];

    // Get instrumented dispatcher based on mode
    const dispatch =
      mode === 'main-thread'
        ? this.getInstrumentedMainThreadDispatcher(requestMetrics)
        : this.getInstrumentedWorkerDispatcher(mode, requestMetrics, scenario);

    // Warm-up: ensure worker is booted before measurement starts.
    if (mode !== 'main-thread') {
      await dispatch({ payloadBytes: 1, delayMs: 0, cpuBurnMs: 0 }).catch(() => undefined);
    }

    collector.start();

    const burnPromise = scenario.mainThreadCpuBurnMs
      ? scheduleMainThreadBurn(scenario.mainThreadCpuBurnMs)
      : Promise.resolve();

    const requests: Promise<BenchmarkResponse | null>[] = [];

    if (scenario.mode === 'parallel') {
      for (let i = 0; i < scenario.requestCount; i++) {
        requests.push(safeDispatch(dispatch, scenario.request));
      }
    } else {
      // Sequential: chain promises so each request waits for the previous one.
      for (let i = 0; i < scenario.requestCount; i++) {
        const previous = requests[i - 1] ?? Promise.resolve(null);
        requests.push(previous.then(() => safeDispatch(dispatch, scenario.request)));
      }
    }

    const [results] = await Promise.all([Promise.all(requests), burnPromise]);

    const metrics = collector.stop();

    // Add granular metrics to the metrics object
    metrics.requestMetrics = requestMetrics;
    metrics.stageAverages = calculateStageAverages(requestMetrics);

    let successCount = 0;
    let failureCount = 0;
    for (const r of results) {
      if (r === null) failureCount += 1;
      else successCount += 1;
    }

    return {
      scenarioId: scenario.id,
      mode,
      metrics,
      successCount,
      failureCount,
      requestMetrics,
    };
  }

  dispose(): void {
    this.workerPool1?.terminate();
    this.workerPool4?.terminate();
    this.workerPool1 = null;
    this.workerPool4 = null;
  }

  ngOnDestroy(): void {
    this.dispose();
  }

  private getDispatcher(
    mode: BenchmarkMode,
  ): (req: ScenarioRequestSpec) => Promise<BenchmarkResponse> {
    if (mode === 'main-thread') {
      return (req) => simulateMainThreadResponse(req);
    }

    const transport = mode === 'worker-pool-4' ? this.getOrCreatePool(4) : this.getOrCreatePool(1);
    return (req) => firstValueFrom(transport.execute(req));
  }

  /**
   * Returns an instrumented dispatcher for main-thread mode that captures
   * granular pipeline stage metrics.
   */
  private getInstrumentedMainThreadDispatcher(
    metricsCollector: RequestMetrics[],
  ): (req: ScenarioRequestSpec) => Promise<BenchmarkResponse> {
    let requestCounter = 0;

    return async (req) => {
      const requestId = `main-${++requestCounter}`;
      const tracker = createGranularTracker(requestId, req.payloadBytes);

      // Stage 1: Worker init (N/A for main thread)
      tracker.markStageStart('worker-init');
      tracker.markStageEnd('worker-init');

      // Stage 2: Serialization
      tracker.markStageStart('serialization');
      const _serializedReq = JSON.stringify(req);
      tracker.markStageEnd('serialization');

      // Stage 3: Transfer out (N/A for main thread)
      tracker.markStageStart('transfer-out');
      tracker.markStageEnd('transfer-out');

      // Stage 4: Worker processing (simulated on main thread)
      tracker.markStageStart('worker-processing');
      const response = await simulateMainThreadResponse(req);

      let streamBytesRead = 0;
      if (response && response.body instanceof ReadableStream) {
        const reader = response.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            streamBytesRead += value.length;
          }
        }
      }
      tracker.markStageEnd('worker-processing');

      // Stage 5: Transfer in (N/A for main thread)
      tracker.markStageStart('transfer-in');
      tracker.markStageEnd('transfer-in');

      // Stage 6: Deserialization
      tracker.markStageStart('deserialization');
      const _deserialized = JSON.parse(JSON.stringify(response));
      tracker.markStageEnd('deserialization');

      tracker.markStageStart('total');
      tracker.markStageEnd('total');

      const metrics = tracker.getRequestMetrics();
      metricsCollector.push(metrics);

      return response;
    };
  }

  /**
   * Returns an instrumented dispatcher for worker mode that captures
   * granular pipeline stage metrics including transfer times.
   */
  private getInstrumentedWorkerDispatcher(
    mode: 'worker-pool-1' | 'worker-pool-4',
    metricsCollector: RequestMetrics[],
    scenario: BenchmarkScenario,
  ): (req: ScenarioRequestSpec) => Promise<BenchmarkResponse> {
    let requestCounter = 0;
    const transport = mode === 'worker-pool-4' ? this.getOrCreatePool(4) : this.getOrCreatePool(1);

    return async (req) => {
      const requestId = `worker-${++requestCounter}`;
      const tracker = createGranularTracker(requestId, req.payloadBytes);

      // Stage 1: Worker init - already done in warm-up, mark as 0
      tracker.markStageStart('worker-init');
      tracker.markStageEnd('worker-init');

      const shouldBypass = scenario.id === 'threshold-bypass';

      let response: BenchmarkResponse;
      let receiveTime = performance.now();

      if (shouldBypass) {
        // Simulate WorkerHttpBackend threshold bypass: execute directly on main thread
        // Stage 2: Serialization (N/A)
        tracker.markStageStart('serialization');
        tracker.markStageEnd('serialization');

        // Stage 3: Transfer out (N/A)
        tracker.markStageStart('transfer-out');
        tracker.markStageEnd('transfer-out');

        // Stage 4: Worker processing (run on main thread)
        tracker.markStageStart('worker-processing');
        response = await simulateMainThreadResponse(req);
        receiveTime = performance.now();
        tracker.markStageEnd('worker-processing');

        // Stage 5: Transfer in (N/A)
        tracker.markStageStart('transfer-in');
        tracker.markStageEnd('transfer-in');
      } else {
        // Stage 2: Serialization (main thread)
        tracker.markStageStart('serialization');
        const _serializedReq = JSON.stringify(req);
        tracker.markStageEnd('serialization');

        // Stage 3: Transfer out + Stage 4: Worker processing + Stage 5: Transfer in
        // These are measured together via the transport execute
        tracker.markStageStart('transfer-out');

        // Execute via worker transport and capture timing from response
        response = await firstValueFrom(transport.execute(req));
        receiveTime = performance.now();

        let streamBytesRead = 0;
        if (response && response.body instanceof ReadableStream) {
          const reader = response.body.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
              streamBytesRead += value.length;
            }
          }
        }

        tracker.markStageEnd('transfer-out');
      }

      // The worker returns timing data in workerTiming property
      // Note: In the actual implementation, we'd need the transport to expose this
      // For now, we estimate based on what we can measure
      const workerTiming = (
        response as unknown as {
          workerTiming?: {
            deserializationMs: number;
            processingMs: number;
            serializationMs: number;
            totalInWorkerMs: number;
            workerReceivedAt: number;
            workerSendingAt: number;
          };
        }
      ).workerTiming;

      if (workerTiming) {
        const sendTime = tracker.stages.get('transfer-out')?.start ?? tracker.startTime;

        // Precise transfer-out: from start of send until worker received it
        tracker.stages.set('transfer-out', {
          start: sendTime,
          end: workerTiming.workerReceivedAt,
        });

        // Precise worker-processing: time spent inside the worker
        tracker.stages.set('worker-processing', {
          start: workerTiming.workerReceivedAt,
          end: workerTiming.workerSendingAt,
        });

        // Precise transfer-in: from when the worker sent it until we received it on main thread
        tracker.stages.set('transfer-in', {
          start: workerTiming.workerSendingAt,
          end: receiveTime,
        });
      }

      // Stage 6: Deserialization (main thread)
      tracker.markStageStart('deserialization');
      const _deserialized = JSON.parse(JSON.stringify(response));
      tracker.markStageEnd('deserialization');

      tracker.markStageStart('total');
      tracker.markStageEnd('total');

      const metrics = tracker.getRequestMetrics();
      metricsCollector.push(metrics);

      return response;
    };
  }

  private getOrCreatePool(size: 1 | 4): WorkerTransport<ScenarioRequestSpec, BenchmarkResponse> {
    if (size === 4) {
      this.workerPool4 ??= createWorkerTransport<ScenarioRequestSpec, BenchmarkResponse>({
        workerUrl: BENCHMARK_WORKER_URL,
        maxInstances: 4,
        requestTimeout: 60000,
      });
      return this.workerPool4;
    }
    this.workerPool1 ??= createWorkerTransport<ScenarioRequestSpec, BenchmarkResponse>({
      workerUrl: BENCHMARK_WORKER_URL,
      maxInstances: 1,
      requestTimeout: 60000,
    });
    return this.workerPool1;
  }
}

async function safeDispatch(
  dispatch: (req: ScenarioRequestSpec) => Promise<BenchmarkResponse>,
  req: ScenarioRequestSpec,
): Promise<BenchmarkResponse | null> {
  try {
    return await dispatch(req);
  } catch {
    return null;
  }
}

/**
 * Mirrors what benchmark.worker.ts does, but on the main thread.
 * Same cpu burn + same delay + same payload generation, so transport is
 * the only varying factor between modes.
 */
async function simulateMainThreadResponse(req: ScenarioRequestSpec): Promise<BenchmarkResponse> {
  burnCpu(req.cpuBurnMs);

  if (req.streaming) {
    const encoder = new TextEncoder();
    const totalBytes = req.payloadBytes;
    const chunkSize = 256 * 1024; // 256KB chunks
    const chunkDelay =
      req.delayMs > 0 ? req.delayMs / Math.max(1, Math.ceil(totalBytes / chunkSize)) : 0;

    const body = new ReadableStream({
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

    return {
      generatedAt: Date.now(),
      bytes: req.payloadBytes,
      body,
    };
  }

  if (req.delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, req.delayMs));
  }
  const body = generatePayload(req.payloadBytes);
  return {
    generatedAt: Date.now(),
    bytes: body.length,
    payload: body,
  };
}

function burnCpu(ms: number): void {
  if (ms <= 0) return;
  const start = performance.now();
  let spin = 0;
  while (performance.now() - start < ms) {
    spin += 1;
  }
  // Read spin once to defeat dead-code elimination of the loop body.
  spinSink = spin;
}

let spinSink = 0;
export function __getSpinSink(): number {
  return spinSink;
}

function generatePayload(bytes: number): string {
  if (bytes <= 0) return '';
  const chunk = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const repeats = Math.ceil(bytes / chunk.length);
  return chunk.repeat(repeats).slice(0, bytes);
}

/**
 * Granular stage tracking for performance analysis.
 * Creates a timing recorder that tracks all 6 pipeline stages.
 */
function createGranularTracker(requestId: string, payloadSize: number) {
  const timing: GranularRequestTiming = {
    requestId,
    startTime: performance.now(),
    stages: new Map(),
    payloadSize,
  };

  return {
    markStageStart: (stage: string) => {
      timing.stages.set(stage, { start: performance.now() });
    },
    markStageEnd: (stage: string) => {
      const existing = timing.stages.get(stage);
      if (existing) {
        existing.end = performance.now();
      }
    },
    // Expose stages map and startTime for injecting worker-reported timings
    stages: timing.stages,
    startTime: timing.startTime,
    getRequestMetrics: (): RequestMetrics => {
      const stages: StageMetrics[] = [];
      let totalDuration = 0;

      // Process stages in order
      const stageOrder = [
        'worker-init',
        'serialization',
        'transfer-out',
        'worker-processing',
        'transfer-in',
        'deserialization',
      ];

      for (const stageName of stageOrder) {
        const stage = timing.stages.get(stageName);
        if (stage?.end && stage?.start) {
          const duration = stage.end - stage.start;
          stages.push({ stage: stageName as StageMetrics['stage'], durationMs: duration });
          totalDuration += duration;
        }
      }

      // Calculate total from start to final end
      const totalStage = timing.stages.get('total');
      const totalDurationMs =
        totalStage?.end && totalStage?.start
          ? totalStage.end - totalStage.start
          : performance.now() - timing.startTime;

      return {
        requestId: timing.requestId,
        stages,
        totalDurationMs,
        payloadSizeBytes: timing.payloadSize,
      };
    },
  };
}

/**
 * Calculates average stage times from a collection of request metrics.
 */
export function calculateStageAverages(metrics: RequestMetrics[]): Record<string, number> {
  const stageTotals: Record<string, number[]> = {};

  for (const metric of metrics) {
    for (const stage of metric.stages) {
      if (!stageTotals[stage.stage]) stageTotals[stage.stage] = [];
      stageTotals[stage.stage].push(stage.durationMs);
    }
  }

  const averages: Record<string, number> = {};
  for (const [stage, times] of Object.entries(stageTotals)) {
    averages[stage] = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  }

  return averages;
}

/**
 * Simulates UI work happening DURING the benchmark by burning CPU in
 * 20ms chunks scheduled via setTimeout. This produces real long tasks and
 * dropped frames if the main thread is also handling the requests, but is
 * harmless if the requests run in a worker.
 */
async function scheduleMainThreadBurn(totalMs: number): Promise<void> {
  // Burn the CPU synchronously to simulate a heavy blocking UI task (e.g. rendering a complex grid)
  burnCpu(totalMs);
}
