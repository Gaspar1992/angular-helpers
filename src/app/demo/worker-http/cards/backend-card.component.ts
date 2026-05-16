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
    <div class="bg-base-200 border border-base-content/5 rounded-3xl p-8 col-span-full">
      <div class="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h2 class="text-xl font-bold text-success m-0 flex items-center gap-2">🔀 HttpBackend</h2>
        <span class="badge badge-success font-semibold tracking-wide">v0.3.0+</span>
      </div>
      <p class="text-sm text-base-content/70 mb-8 max-w-3xl">
        <code class="font-mono text-xs bg-base-content/5 text-success px-2 py-0.5 rounded-md"
          >WorkerHttpBackend</code
        >
        routes real HTTP requests off the main thread via
        <code class="font-mono text-xs bg-base-content/5 text-success px-2 py-0.5 rounded-md"
          >provideWorkerHttpClient()</code
        >. This demo calls JSONPlaceholder via the
        <code class="font-mono text-xs bg-base-content/5 text-success px-2 py-0.5 rounded-md"
          >http-api.worker.js</code
        >
        using a worker pipeline with retry + cache interceptors.
      </p>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div class="flex flex-col">
          <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-base-content/40 mb-4">
            Live HTTP Call via Worker
          </p>
          <div class="flex flex-wrap gap-3 mb-6">
            <button
              type="button"
              (click)="fetch('https://jsonplaceholder.typicode.com/todos/1')"
              [disabled]="status() === 'running'"
              class="btn btn-success font-bold px-6"
            >
              @if (status() === 'running') {
                <span class="loading loading-spinner loading-xs"></span>
              }
              GET /todos/1
            </button>
            <button
              type="button"
              (click)="fetch('https://jsonplaceholder.typicode.com/users/1')"
              [disabled]="status() === 'running'"
              class="btn btn-outline btn-success font-bold px-6 border-2"
            >
              GET /users/1
            </button>
          </div>
          @if (result()) {
            <div
              class="p-4 bg-base-content/5 rounded-2xl shadow-inner border border-base-content/5 font-mono text-xs overflow-auto max-h-60 mt-auto"
            >
              <div class="text-success font-bold mb-2 flex justify-between items-center">
                <span>RESPONSE</span>
                <span class="text-[10px] opacity-70">{{ elapsedMs() }}ms</span>
              </div>
              <pre class="text-success/90 whitespace-pre-wrap">{{ result() }}</pre>
            </div>
          }
        </div>

        <div>
          <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-base-content/40 mb-4">
            URL Routing Simulation
          </p>
          <p class="text-xs text-base-content/60 mb-4">
            <code class="font-mono text-primary">matchWorkerRoute()</code> resolves which worker
            handles each URL based on configuration.
          </p>
          <div class="space-y-2">
            @for (entry of routingResults; track entry.url) {
              <div
                class="flex items-center gap-3 text-xs font-mono p-3 bg-base-content/5 border border-base-content/5 rounded-xl hover:bg-base-content/5 transition-colors"
              >
                <span class="text-base-content/70 flex-1 truncate">{{ entry.url }}</span>
                <span class="text-base-content/30">→</span>
                @if (entry.worker) {
                  <span class="badge badge-primary badge-sm font-bold">{{ entry.worker }}</span>
                } @else {
                  <span class="badge badge-ghost badge-sm opacity-50">main-thread</span>
                }
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
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
