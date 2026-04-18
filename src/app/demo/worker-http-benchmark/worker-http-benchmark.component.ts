import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';

import { SCENARIOS } from './services/benchmark-scenarios';
import type { BenchmarkScenario } from './services/benchmark-scenarios';
import { BenchmarkRunnerService } from './services/benchmark-runner.service';
import type { BenchmarkMode, BenchmarkRunResult } from './services/benchmark-runner.service';

const MODES: readonly BenchmarkMode[] = ['main-thread', 'worker-pool-1', 'worker-pool-4'];

const MODE_LABELS: Record<BenchmarkMode, string> = {
  'main-thread': 'Main thread',
  'worker-pool-1': 'Worker (pool=1)',
  'worker-pool-4': 'Worker (pool=4)',
};

interface ScenarioState {
  scenario: BenchmarkScenario;
  results: Partial<Record<BenchmarkMode, BenchmarkRunResult>>;
  runningMode: BenchmarkMode | null;
}

@Component({
  selector: 'app-worker-http-benchmark',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe],
  providers: [BenchmarkRunnerService],
  template: `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <header class="mb-8">
        <div class="flex flex-wrap items-center gap-3 mb-3">
          <span class="text-4xl">📊</span>
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold text-base-content m-0">
              Worker HTTP — Benchmark Suite
            </h1>
            <p class="text-sm sm:text-base text-base-content/80 m-0 mt-1">
              Reproducible measurements: main thread vs worker transports
            </p>
          </div>
        </div>
        <div class="flex flex-wrap gap-2">
          <span class="badge badge-primary badge-md">Long Tasks</span>
          <span class="badge badge-secondary badge-md">Dropped Frames</span>
          <span class="badge badge-accent badge-md">Wall Clock</span>
        </div>
      </header>

      <div
        class="bg-base-200 border border-base-300 rounded-xl p-5 mb-6 text-sm text-base-content/80 leading-relaxed"
      >
        <p class="m-0 mb-2">
          <strong class="text-base-content">How this works:</strong>
          each scenario simulates identical "server" work (CPU burn + delay + payload generation).
          The only difference between modes is where the work runs.
        </p>
        <p class="m-0">
          <strong class="text-base-content">Long Tasks</strong> are PerformanceObserver
          <code class="badge badge-ghost badge-sm font-mono">longtask</code>
          entries (Chromium-only). <strong class="text-base-content">Dropped frames</strong> are
          <code class="badge badge-ghost badge-sm font-mono">requestAnimationFrame</code>
          gaps &gt; 25ms — works in every browser.
        </p>
      </div>

      <div class="flex flex-wrap gap-2 mb-6">
        <button
          type="button"
          class="btn btn-primary btn-sm"
          [disabled]="isAnyRunning()"
          (click)="runAll()"
        >
          ▶ Run all scenarios
        </button>
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          [disabled]="isAnyRunning()"
          (click)="reset()"
        >
          Reset results
        </button>
        @if (longTaskUnsupported()) {
          <span class="badge badge-warning badge-sm self-center">
            Long Task API unsupported in this browser — using dropped frames only
          </span>
        }
      </div>

      <div class="space-y-6">
        @for (state of states(); track state.scenario.id) {
          <section class="bg-base-200 border border-base-300 rounded-xl p-5 sm:p-6">
            <header class="flex flex-wrap items-start justify-between gap-3 mb-3">
              <div class="flex-1 min-w-0">
                <h2 class="text-lg font-bold text-base-content m-0">{{ state.scenario.title }}</h2>
                <p class="text-sm text-base-content/80 m-0 mt-1">
                  {{ state.scenario.description }}
                </p>
              </div>
              <button
                type="button"
                class="btn btn-secondary btn-sm"
                [disabled]="isAnyRunning()"
                (click)="runScenario(state.scenario)"
              >
                @if (state.runningMode) {
                  <span class="loading loading-spinner loading-xs"></span>
                  Running ({{ modeLabel(state.runningMode) }})
                } @else {
                  ▶ Run
                }
              </button>
            </header>

            <div class="overflow-x-auto">
              <table class="table table-sm w-full">
                <thead>
                  <tr>
                    <th class="text-base-content/70">Mode</th>
                    <th class="text-base-content/70 text-right">Total time</th>
                    <th class="text-base-content/70 text-right">Long tasks</th>
                    <th class="text-base-content/70 text-right">Long task time</th>
                    <th class="text-base-content/70 text-right">Dropped frames</th>
                    <th class="text-base-content/70 text-right">OK / Fail</th>
                  </tr>
                </thead>
                <tbody>
                  @for (mode of modes; track mode) {
                    @let result = state.results[mode];
                    <tr>
                      <td class="font-semibold text-base-content">
                        {{ modeLabel(mode) }}
                      </td>
                      @if (result) {
                        <td class="text-right font-mono">
                          {{ result.metrics.totalMs | number: '1.0-0' }} ms
                        </td>
                        <td class="text-right font-mono">
                          @if (result.metrics.longTaskSupported) {
                            {{ result.metrics.longTaskCount }}
                          } @else {
                            <span class="text-base-content/40">n/a</span>
                          }
                        </td>
                        <td class="text-right font-mono">
                          @if (result.metrics.longTaskSupported) {
                            {{ result.metrics.longTaskTotalMs | number: '1.0-0' }} ms
                          } @else {
                            <span class="text-base-content/40">n/a</span>
                          }
                        </td>
                        <td class="text-right font-mono">
                          {{ result.metrics.droppedFrames }} /
                          <span class="text-base-content/60">{{ result.metrics.totalFrames }}</span>
                        </td>
                        <td class="text-right font-mono">
                          <span class="text-success">{{ result.successCount }}</span> /
                          <span class="text-error">{{ result.failureCount }}</span>
                        </td>
                      } @else {
                        <td colspan="5" class="text-center text-base-content/40 italic">
                          not run yet
                        </td>
                      }
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </section>
        }
      </div>

      <footer class="mt-8 text-xs text-base-content/60 text-center">
        Numbers vary by hardware, browser and current system load. Run a scenario multiple times and
        watch the trend, not a single value.
      </footer>
    </div>
  `,
})
export class WorkerHttpBenchmarkComponent implements OnDestroy {
  private readonly runner = inject(BenchmarkRunnerService);

  protected readonly modes = MODES;
  protected readonly states = signal<ScenarioState[]>(
    SCENARIOS.map((scenario) => ({ scenario, results: {}, runningMode: null })),
  );

  protected readonly isAnyRunning = computed(() =>
    this.states().some((s) => s.runningMode !== null),
  );

  protected readonly longTaskUnsupported = computed(() => {
    const supported =
      typeof PerformanceObserver !== 'undefined' &&
      (PerformanceObserver.supportedEntryTypes ?? []).includes('longtask');
    return !supported;
  });

  protected modeLabel(mode: BenchmarkMode): string {
    return MODE_LABELS[mode];
  }

  protected async runScenario(scenario: BenchmarkScenario): Promise<void> {
    for (const mode of MODES) {
      this.updateState(scenario.id, (s) => ({ ...s, runningMode: mode }));
      try {
        const result = await this.runner.run(scenario, mode);
        this.updateState(scenario.id, (s) => ({
          ...s,
          results: { ...s.results, [mode]: result },
        }));
      } finally {
        this.updateState(scenario.id, (s) => ({ ...s, runningMode: null }));
      }
      // Brief idle gap between modes so the previous run's effects settle.
      await wait(150);
    }
  }

  protected async runAll(): Promise<void> {
    for (const state of this.states()) {
      await this.runScenario(state.scenario);
    }
  }

  protected reset(): void {
    this.states.set(SCENARIOS.map((scenario) => ({ scenario, results: {}, runningMode: null })));
  }

  ngOnDestroy(): void {
    this.runner.dispose();
  }

  private updateState(scenarioId: string, mutator: (s: ScenarioState) => ScenarioState): void {
    this.states.update((arr) => arr.map((s) => (s.scenario.id === scenarioId ? mutator(s) : s)));
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
