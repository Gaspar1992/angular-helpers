/**
 * MetricsCollector — captures main-thread health during a benchmark run.
 *
 * Three independent signals:
 *  - Long Tasks   (PerformanceObserver / longtask) — count + total ms
 *  - Dropped frames (rAF delta > 1.5 * frame budget) — proxy for visible jank
 *  - Wall clock  (performance.now delta) — total scenario duration
 *
 * Long Tasks are only reported in browsers that support the API
 * (Chromium-family). On Firefox/Safari the count will be 0 — the wall clock
 * and dropped-frames metrics still work cross-browser.
 */
/**
 * Granular stage timing for pipeline analysis
 */
export interface StageMetrics {
  stage: 'worker-init' | 'serialization' | 'transfer-out' | 'worker-processing' | 'transfer-in' | 'deserialization' | 'total';
  durationMs: number;
  details?: Record<string, number>;
}

export interface RequestMetrics {
  requestId: string;
  stages: StageMetrics[];
  totalDurationMs: number;
  payloadSizeBytes: number;
}

export interface BenchmarkMetrics {
  totalMs: number;
  longTaskCount: number;
  longTaskTotalMs: number;
  droppedFrames: number;
  totalFrames: number;
  longTaskSupported: boolean;
  /** Granular per-request stage metrics (when available) */
  requestMetrics?: RequestMetrics[];
  /** Aggregated stage averages */
  stageAverages?: Record<string, number>;
}

const FRAME_BUDGET_MS = 1000 / 60; // 16.67ms
const DROPPED_THRESHOLD_MS = FRAME_BUDGET_MS * 1.5; // ~25ms

export class MetricsCollector {
  private startedAt = 0;
  private longTaskCount = 0;
  private longTaskTotalMs = 0;
  private droppedFrames = 0;
  private totalFrames = 0;
  private lastFrameTs = 0;
  private rafHandle = 0;
  private observer: PerformanceObserver | null = null;
  private readonly longTaskSupported: boolean;

  constructor() {
    this.longTaskSupported =
      typeof PerformanceObserver !== 'undefined' &&
      (PerformanceObserver.supportedEntryTypes ?? []).includes('longtask');
  }

  start(): void {
    this.startedAt = performance.now();
    this.longTaskCount = 0;
    this.longTaskTotalMs = 0;
    this.droppedFrames = 0;
    this.totalFrames = 0;

    if (this.longTaskSupported) {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.longTaskCount += 1;
          this.longTaskTotalMs += entry.duration;
        }
      });
      this.observer.observe({ entryTypes: ['longtask'] });
    }

    this.lastFrameTs = performance.now();
    const tick = (ts: number) => {
      const delta = ts - this.lastFrameTs;
      this.lastFrameTs = ts;
      this.totalFrames += 1;
      if (delta > DROPPED_THRESHOLD_MS) {
        // Approximate number of dropped frames within this gap.
        this.droppedFrames += Math.max(1, Math.round(delta / FRAME_BUDGET_MS) - 1);
      }
      this.rafHandle = requestAnimationFrame(tick);
    };
    this.rafHandle = requestAnimationFrame(tick);
  }

  stop(): BenchmarkMetrics {
    const totalMs = performance.now() - this.startedAt;
    cancelAnimationFrame(this.rafHandle);
    this.observer?.disconnect();
    this.observer = null;

    return {
      totalMs,
      longTaskCount: this.longTaskCount,
      longTaskTotalMs: this.longTaskTotalMs,
      droppedFrames: this.droppedFrames,
      totalFrames: this.totalFrames,
      longTaskSupported: this.longTaskSupported,
    };
  }
}
