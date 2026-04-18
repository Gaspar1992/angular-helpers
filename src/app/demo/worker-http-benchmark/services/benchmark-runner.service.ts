import { Injectable, OnDestroy } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { createWorkerTransport } from '@angular-helpers/worker-http/transport';
import type { WorkerTransport } from '@angular-helpers/worker-http/transport';

import { MetricsCollector } from './metrics-collector';
import type { BenchmarkMetrics } from './metrics-collector';
import type { BenchmarkScenario, ScenarioRequestSpec } from './benchmark-scenarios';

const BENCHMARK_WORKER_URL = 'assets/workers/benchmark.worker.js';

export type BenchmarkMode = 'main-thread' | 'worker-pool-1' | 'worker-pool-4';

export interface BenchmarkRunResult {
  scenarioId: string;
  mode: BenchmarkMode;
  metrics: BenchmarkMetrics;
  successCount: number;
  failureCount: number;
}

interface BenchmarkResponse {
  generatedAt: number;
  bytes: number;
  payload: string;
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
    const dispatch = this.getDispatcher(mode);

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
 * Simulates UI work happening DURING the benchmark by burning CPU in
 * 20ms chunks scheduled via setTimeout. This produces real long tasks and
 * dropped frames if the main thread is also handling the requests, but is
 * harmless if the requests run in a worker.
 */
async function scheduleMainThreadBurn(totalMs: number): Promise<void> {
  const chunkMs = 20;
  const chunks = Math.ceil(totalMs / chunkMs);
  for (let i = 0; i < chunks; i++) {
    await new Promise<void>((resolve) =>
      setTimeout(() => {
        burnCpu(chunkMs);
        resolve();
      }, 0),
    );
  }
}
