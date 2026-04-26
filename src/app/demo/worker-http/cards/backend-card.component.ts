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
    <div class="bg-base-200 border border-base-300 rounded-xl p-6 col-span-full">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 class="text-lg font-bold text-base-content m-0 flex items-center gap-2">
          🔀 HttpBackend
        </h2>
        <span class="badge badge-success">v0.3.0+</span>
      </div>
      <p class="text-sm text-base-content/80 mb-4">
        <code class="font-mono text-xs bg-base-300 px-1.5 py-0.5 rounded">WorkerHttpBackend</code>
        routes real HTTP requests off the main thread via
        <code class="font-mono text-xs bg-base-300 px-1.5 py-0.5 rounded"
          >provideWorkerHttpClient()</code
        >. The live demo calls JSONPlaceholder via the
        <code class="font-mono text-xs bg-base-300 px-1.5 py-0.5 rounded">http-api.worker.js</code>
        using
        <code class="font-mono text-xs bg-base-300 px-1.5 py-0.5 rounded"
          >createWorkerPipeline()</code
        >
        with retry + cache interceptors.
      </p>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <p class="text-xs font-bold uppercase tracking-wider text-base-content/50 mb-2">
            Live HTTP Call via Worker
          </p>
          <div class="flex flex-wrap gap-2 mb-4">
            <button
              type="button"
              (click)="fetch('https://jsonplaceholder.typicode.com/todos/1')"
              [disabled]="status() === 'running'"
              class="btn btn-success btn-sm"
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
              class="btn btn-ghost btn-sm"
            >
              GET /users/1
            </button>
          </div>
          @if (result()) {
            <div class="p-3 bg-base-300 rounded-lg font-mono text-xs overflow-auto max-h-40">
              <span class="text-success">Response ({{ elapsedMs() }}ms):</span>
              <br />
              {{ result() }}
            </div>
          }
        </div>

        <div>
          <p class="text-xs font-bold uppercase tracking-wider text-base-content/50 mb-2">
            URL Routing Simulation
          </p>
          <p class="text-xs text-base-content/60 mb-3">
            <code class="font-mono">matchWorkerRoute()</code> resolves which worker handles each
            URL.
          </p>
          <div class="space-y-1">
            @for (entry of routingResults; track entry.url) {
              <div class="flex items-center gap-2 text-xs font-mono p-2 bg-base-300 rounded">
                <span class="text-base-content/60 flex-1 truncate">{{ entry.url }}</span>
                <span class="text-xs">→</span>
                @if (entry.worker) {
                  <span class="badge badge-xs badge-primary">{{ entry.worker }}</span>
                } @else {
                  <span class="badge badge-xs badge-ghost">main-thread</span>
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
