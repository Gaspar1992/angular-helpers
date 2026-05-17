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
    <div class="svc-card col-span-full animate-in fade-in duration-300">
      <div class="svc-card-head">
        <h2 class="svc-card-title"><span>🆚</span> Worker vs HttpClient</h2>
        <span class="badge badge-warning font-black">v21.2.0</span>
      </div>
      <p class="svc-desc max-w-4xl">
        Both buttons fetch
        <code class="font-mono text-xs text-primary px-2 py-0.5 bg-primary/10 rounded-md">{{
          url
        }}</code>
        while a CPU-burn loop runs on the main thread. The
        <strong>dropped frames</strong> counter is a proxy for visible jank:
        <code class="font-mono text-xs text-primary px-2 py-0.5 bg-primary/10 rounded-md"
          >requestAnimationFrame</code
        >
        deltas above 25 ms.
      </p>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <button
          type="button"
          (click)="fetch('http-client')"
          [disabled]="status() === 'running'"
          class="btn btn-secondary border border-primary/30 text-primary hover:bg-primary/10"
        >
          @if (status() === 'running') {
            <span class="spinner w-4 h-4 mr-2"></span>
          }
          Fetch with HttpClient
        </button>
        <button
          type="button"
          (click)="fetch('worker-http')"
          [disabled]="status() === 'running'"
          class="btn btn-primary"
        >
          @if (status() === 'running') {
            <span class="spinner w-4 h-4 mr-2"></span>
          }
          Fetch with WorkerHttpClient
        </button>
      </div>

      @if (results().length > 0) {
        <div class="overflow-x-auto bg-slate-950/35 rounded-2xl border border-white/5 shadow-inner">
          <table class="table w-full border-collapse text-left">
            <thead>
              <tr
                class="border-b border-white/10 text-base-content/60 text-xs font-black uppercase tracking-wider bg-slate-950/45"
              >
                <th class="p-4">Transport</th>
                <th class="p-4 text-right">Status</th>
                <th class="p-4 text-right">Items</th>
                <th class="p-4 text-right">Wall time (ms)</th>
                <th class="p-4 text-right">Dropped frames</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5 font-semibold text-sm">
              @for (row of results(); track $index) {
                <tr class="hover:bg-white/5 transition-colors">
                  <td class="p-4">
                    <span
                      class="badge badge-sm font-black tracking-wide"
                      [class.badge-secondary]="row.transport === 'http-client'"
                      [class.badge-success]="row.transport === 'worker-http'"
                    >
                      {{ row.transport }}
                    </span>
                  </td>
                  <td class="p-4 text-right font-mono text-xs text-base-content/80">
                    {{ row.status }}
                  </td>
                  <td class="p-4 text-right font-mono text-xs text-base-content/80">
                    {{ row.itemCount }}
                  </td>
                  <td class="p-4 text-right font-mono text-xs text-accent">{{ row.elapsedMs }}</td>
                  <td
                    class="p-4 text-right font-mono text-xs font-black"
                    [class.text-red-400]="row.droppedFrames > 5"
                    [class.text-yellow-400]="row.droppedFrames > 0 && row.droppedFrames <= 5"
                    [class.text-green-400]="row.droppedFrames === 0"
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
  styleUrl: '../../services/demo.styles.css',
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
