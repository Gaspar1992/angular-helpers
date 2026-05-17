import { ChangeDetectionStrategy, Component, OnDestroy, inject, signal } from '@angular/core';
import { createWorkerTransport } from '@angular-helpers/worker-http/transport';
import type { WorkerTransport } from '@angular-helpers/worker-http/transport';
import { ECHO_WORKER_URL } from '../shared/samples';
import { WorkerHttpDemoLogService } from '../shared/log.service';

@Component({
  selector: 'app-worker-http-transport-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-base-200 border border-base-content/5 rounded-3xl p-8 h-full flex flex-col">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold text-primary m-0 flex items-center gap-2">
          ⚡ WorkerTransport
        </h2>
        <span class="badge badge-primary font-semibold">Typed RPC</span>
      </div>
      <p class="text-sm text-base-content/70 mb-8">
        Typed RPC bridge with request/response correlation and worker pool
      </p>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <button
          type="button"
          (click)="sendEcho()"
          [disabled]="status() === 'running'"
          class="btn btn-primary font-bold px-6"
        >
          @if (status() === 'running') {
            <span class="loading loading-spinner loading-xs"></span>
          }
          Send Echo
        </button>
        <button
          type="button"
          (click)="sendPoolBurst()"
          [disabled]="status() === 'running'"
          class="btn btn-secondary font-bold px-6"
        >
          Pool Burst (4 workers)
        </button>
      </div>

      <div class="mt-auto">
        @if (result()) {
          <div
            class="p-4 bg-base-content/5 rounded-2xl shadow-inner border border-base-content/5 font-mono text-xs break-all"
          >
            <div class="flex justify-between items-center mb-2">
              <span
                class="text-secondary font-bold uppercase tracking-wider text-[10px] opacity-70"
              >
                Result
              </span>
              <span class="text-[10px] opacity-40 font-mono">{{ elapsedMs() }}ms</span>
            </div>
            <pre class="text-base-content/80 whitespace-pre-wrap">{{ result() }}</pre>
          </div>
        }
      </div>
    </div>
  `,
})
export class TransportCardComponent implements OnDestroy {
  private readonly log = inject(WorkerHttpDemoLogService);

  protected readonly status = signal<'idle' | 'running' | 'done' | 'error'>('idle');
  protected readonly result = signal<string>('');
  protected readonly elapsedMs = signal<number>(0);

  private transport: WorkerTransport<unknown, unknown> | null = null;

  sendEcho(): void {
    this.status.set('running');
    this.result.set('');
    const start = performance.now();

    if (!this.transport) {
      this.transport = createWorkerTransport({
        workerUrl: ECHO_WORKER_URL,
        maxInstances: 1,
      });
    }

    this.transport.execute({ message: 'Hello from main thread', delay: 200 }).subscribe({
      next: (value) => {
        const elapsed = Math.round(performance.now() - start);
        this.elapsedMs.set(elapsed);
        this.result.set(JSON.stringify(value, null, 2));
        this.status.set('done');
        this.log.log('Transport', `Echo response received in ${elapsed}ms`, 'success');
      },
      error: (err) => {
        this.status.set('error');
        this.result.set(String(err));
        this.log.log('Transport', `Error: ${err}`, 'error');
      },
    });
  }

  sendPoolBurst(): void {
    if (this.transport) {
      this.transport.terminate();
    }
    this.transport = createWorkerTransport({
      workerUrl: ECHO_WORKER_URL,
      maxInstances: 4,
    });

    this.status.set('running');
    const start = performance.now();
    let completed = 0;
    const total = 8;

    for (let i = 0; i < total; i++) {
      this.transport.execute({ index: i, delay: 100 + Math.random() * 200 }).subscribe({
        next: () => {
          completed++;
          if (completed === total) {
            const elapsed = Math.round(performance.now() - start);
            this.elapsedMs.set(elapsed);
            this.result.set(`${total} requests completed via 4-worker pool`);
            this.status.set('done');
            this.log.log(
              'Transport',
              `Pool burst: ${total} requests in ${elapsed}ms (4 workers)`,
              'success',
            );
          }
        },
        error: (err) => {
          this.status.set('error');
          this.log.log('Transport', `Pool error: ${err}`, 'error');
        },
      });
    }
  }

  ngOnDestroy(): void {
    this.transport?.terminate();
  }
}
