import { ChangeDetectionStrategy, Component, OnDestroy, inject, signal } from '@angular/core';
import { createWorkerTransport } from '@angular-helpers/worker-http/transport';
import type { WorkerTransport } from '@angular-helpers/worker-http/transport';
import { matchWorkerRoute } from '@angular-helpers/worker-http/backend';
import type { SerializableResponse } from '@angular-helpers/worker-http/backend';
import { DEMO_ROUTES, HTTP_API_WORKER_URL, ROUTING_TEST_URLS } from '../shared/samples';
import { WorkerHttpDemoLogService } from '../shared/log.service';

@Component({
  selector: 'app-worker-http-backend-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="svc-card col-span-full">
      <div class="svc-card-head">
        <h2 class="svc-card-title"><span>🔀</span> HttpBackend</h2>
        <span class="badge badge-success font-black">v0.3.0+</span>
      </div>
      <p class="svc-desc max-w-3xl">
        <code class="font-mono text-xs text-success px-2 py-0.5 bg-green-500/10 rounded-md"
          >WorkerHttpBackend</code
        >
        routes real HTTP requests off the main thread via
        <code class="font-mono text-xs text-success px-2 py-0.5 bg-green-500/10 rounded-md"
          >provideWorkerHttpClient()</code
        >. This demo calls JSONPlaceholder via the
        <code class="font-mono text-xs text-success px-2 py-0.5 bg-green-500/10 rounded-md"
          >http-api.worker.js</code
        >
        using a worker pipeline with retry + cache interceptors.
      </p>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
        <div class="flex flex-col">
          <p class="text-[9px] font-black uppercase tracking-widest text-primary opacity-60 mb-4">
            Live HTTP Call via Worker
          </p>
          <div class="flex flex-wrap gap-3 mb-6">
            <button
              type="button"
              (click)="fetch('https://jsonplaceholder.typicode.com/todos/1')"
              [disabled]="status() === 'running'"
              class="btn btn-primary"
            >
              @if (status() === 'running') {
                <span class="spinner w-4 h-4 mr-2"></span>
              }
              GET /todos/1
            </button>
            <button
              type="button"
              (click)="fetch('https://jsonplaceholder.typicode.com/users/1')"
              [disabled]="status() === 'running'"
              class="btn btn-secondary border border-green-500/30 text-green-400 hover:bg-green-500/10"
            >
              GET /users/1
            </button>
          </div>
          @if (result()) {
            <div class="mono-block overflow-auto max-h-60 mt-auto">
              <div
                class="text-green-400 font-black mb-2 flex justify-between items-center text-[9px] uppercase tracking-widest"
              >
                <span>RESPONSE</span>
                <span class="text-[10px] opacity-75 font-mono">{{ elapsedMs() }}ms</span>
              </div>
              <pre
                class="text-green-400/90 whitespace-pre-wrap font-mono text-[11px] leading-relaxed"
                >{{ result() }}</pre
              >
            </div>
          }
        </div>

        <div>
          <p class="text-[9px] font-black uppercase tracking-widest text-primary opacity-60 mb-4">
            URL Routing Simulation
          </p>
          <p class="text-xs text-base-content/70 mb-4">
            <code class="font-mono text-primary font-bold">matchWorkerRoute()</code> resolves which
            worker handles each URL based on configuration.
          </p>
          <div class="space-y-2">
            @for (entry of routingResults; track entry.url) {
              <div
                class="flex items-center gap-3 text-xs font-mono p-3 bg-slate-950/35 border border-white/5 rounded-xl hover:bg-white/5 transition-colors"
              >
                <span class="text-base-content/80 flex-1 truncate font-semibold">{{
                  entry.url
                }}</span>
                <span class="text-base-content/30">→</span>
                @if (entry.worker) {
                  <span class="badge badge-primary badge-sm font-black">{{ entry.worker }}</span>
                } @else {
                  <span class="badge badge-ghost badge-sm opacity-50 font-black">main-thread</span>
                }
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: '../../services/demo.styles.css',
})
export class BackendCardComponent implements OnDestroy {
  private readonly log = inject(WorkerHttpDemoLogService);

  protected readonly status = signal<'idle' | 'running' | 'done' | 'error'>('idle');
  protected readonly result = signal<string>('');
  protected readonly elapsedMs = signal<number>(0);
  protected readonly routingResults = ROUTING_TEST_URLS.map((url) => ({
    url,
    worker: matchWorkerRoute(url, [...DEMO_ROUTES]),
  }));

  private transport: WorkerTransport<unknown, SerializableResponse> | null = null;

  fetch(url: string): void {
    this.status.set('running');
    this.result.set('');
    const start = performance.now();

    if (!this.transport) {
      this.transport = createWorkerTransport({
        workerUrl: HTTP_API_WORKER_URL,
        maxInstances: 1,
        initMessage: {
          type: 'init-interceptors',
          specs: [
            { kind: 'logging' },
            { kind: 'retry', config: { maxRetries: 2, initialDelay: 500 } },
            { kind: 'cache', config: { ttl: 30000, maxEntries: 50 } },
          ],
        },
      });
    }

    const request = {
      method: 'GET',
      url,
      headers: {},
      params: {},
      body: null,
      responseType: 'json',
      withCredentials: false,
      context: {},
    };

    this.transport.execute(request).subscribe({
      next: (res) => {
        const elapsed = Math.round(performance.now() - start);
        this.elapsedMs.set(elapsed);
        this.result.set(JSON.stringify(res.body, null, 2));
        this.status.set('done');
        this.log.log('Backend', `GET ${url} → ${res.status} in ${elapsed}ms`, 'success');
      },
      error: (err) => {
        this.status.set('error');
        this.result.set(String(err));
        this.log.log('Backend', `Error fetching ${url}: ${err}`, 'error');
      },
    });
  }

  ngOnDestroy(): void {
    this.transport?.terminate();
  }
}
