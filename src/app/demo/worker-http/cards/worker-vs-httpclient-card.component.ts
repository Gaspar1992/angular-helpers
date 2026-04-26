import { ChangeDetectionStrategy, Component, OnDestroy, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { createWorkerTransport } from '@angular-helpers/worker-http/transport';
import type { WorkerTransport } from '@angular-helpers/worker-http/transport';
import type { SerializableResponse } from '@angular-helpers/worker-http/backend';
import { CPU_BURN_DURATION_MS, FETCH_COMPARE_URL, HTTP_API_WORKER_URL } from '../shared/samples';
import type { FetchTimingResult } from '../shared/models';
import { startCpuBurn, startDroppedFrameMonitor } from '../shared/utils';
import { WorkerHttpDemoLogService } from '../shared/log.service';

@Component({
  selector: 'app-worker-http-vs-httpclient-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-base-200 border border-base-300 rounded-xl p-6 col-span-full">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 class="text-lg font-bold text-base-content m-0 flex items-center gap-2">
          🆚 Worker vs HttpClient
        </h2>
        <span class="badge badge-warning">v21.2.0</span>
      </div>
      <p class="text-sm text-base-content/80 mb-4">
        Both buttons fetch
        <code class="font-mono text-xs bg-base-300 px-1.5 py-0.5 rounded">{{ url }}</code>
        while a CPU-burn loop runs on the main thread. The
        <strong>dropped frames</strong> counter is a proxy for visible jank:
        <code class="font-mono text-xs">requestAnimationFrame</code> deltas above 25 ms. HttpClient
        processes the response on the main thread and competes with the burn loop. The Worker path
        leaves the main thread free.
      </p>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <button
          type="button"
          (click)="fetch('http-client')"
          [disabled]="status() === 'running'"
          class="btn btn-sm btn-secondary"
        >
          @if (status() === 'running') {
            <span class="loading loading-spinner loading-xs"></span>
          }
          Fetch with HttpClient
        </button>
        <button
          type="button"
          (click)="fetch('worker-http')"
          [disabled]="status() === 'running'"
          class="btn btn-sm btn-success"
        >
          Fetch with WorkerHttpClient
        </button>
      </div>

      @if (results().length > 0) {
        <div class="overflow-x-auto">
          <table class="table table-sm">
            <thead>
              <tr>
                <th>Transport</th>
                <th class="text-right">Status</th>
                <th class="text-right">Items</th>
                <th class="text-right">Wall time (ms)</th>
                <th class="text-right">Dropped frames</th>
              </tr>
            </thead>
            <tbody>
              @for (row of results(); track $index) {
                <tr>
                  <td>
                    <span
                      class="badge badge-xs"
                      [class.badge-secondary]="row.transport === 'http-client'"
                      [class.badge-success]="row.transport === 'worker-http'"
                    >
                      {{ row.transport }}
                    </span>
                  </td>
                  <td class="text-right font-mono">{{ row.status }}</td>
                  <td class="text-right font-mono">{{ row.itemCount }}</td>
                  <td class="text-right font-mono">{{ row.elapsedMs }}</td>
                  <td
                    class="text-right font-mono"
                    [class.text-error]="row.droppedFrames > 5"
                    [class.text-warning]="row.droppedFrames > 0 && row.droppedFrames <= 5"
                    [class.text-success]="row.droppedFrames === 0"
                  >
                    {{ row.droppedFrames }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class WorkerVsHttpClientCardComponent implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly log = inject(WorkerHttpDemoLogService);

  protected readonly url = FETCH_COMPARE_URL;
  protected readonly status = signal<'idle' | 'running' | 'done'>('idle');
  protected readonly results = signal<readonly FetchTimingResult[]>([]);
  private transport: WorkerTransport<unknown, SerializableResponse> | null = null;

  async fetch(transport: 'http-client' | 'worker-http'): Promise<void> {
    this.status.set('running');

    const dropMonitor = startDroppedFrameMonitor();
    const burnHandle = startCpuBurn(CPU_BURN_DURATION_MS);
    const start = performance.now();
    let status: number | 'error' = 'error';
    let itemCount = 0;

    try {
      if (transport === 'http-client') {
        const data = await firstValueFrom(this.http.get<unknown[]>(FETCH_COMPARE_URL));
        status = 200;
        itemCount = Array.isArray(data) ? data.length : 0;
      } else {
        if (!this.transport) {
          this.transport = createWorkerTransport({
            workerUrl: HTTP_API_WORKER_URL,
            maxInstances: 1,
            initMessage: { type: 'init-interceptors', specs: [] },
          });
        }
        const response = await firstValueFrom(
          this.transport.execute({
            method: 'GET',
            url: FETCH_COMPARE_URL,
            headers: {},
            params: {},
            body: null,
            responseType: 'json',
            withCredentials: false,
            context: {},
          }),
        );
        status = response.status;
        const body = response.body;
        itemCount = Array.isArray(body) ? body.length : 0;
      }
    } catch (err) {
      this.log.log('Compare', `${transport} error: ${err}`, 'error');
    } finally {
      burnHandle.stop();
    }

    const elapsedMs = Math.round(performance.now() - start);
    const droppedFrames = dropMonitor.stop();
    const result: FetchTimingResult = { transport, status, elapsedMs, droppedFrames, itemCount };

    this.results.update((prev) => [result, ...prev].slice(0, 6));
    this.status.set('done');
    this.log.log(
      'Compare',
      `${transport} → ${status} in ${elapsedMs}ms, ${droppedFrames} dropped frame(s)`,
      status === 'error' ? 'error' : 'success',
    );
  }

  ngOnDestroy(): void {
    this.transport?.terminate();
  }
}
