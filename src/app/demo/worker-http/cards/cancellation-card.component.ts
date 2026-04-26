import { ChangeDetectionStrategy, Component, OnDestroy, inject, signal } from '@angular/core';
import {
  createWorkerTransport,
  WorkerHttpAbortError,
  WorkerHttpTimeoutError,
} from '@angular-helpers/worker-http/transport';
import type { WorkerTransport } from '@angular-helpers/worker-http/transport';
import { ECHO_WORKER_URL } from '../shared/samples';
import { WorkerHttpDemoLogService } from '../shared/log.service';

@Component({
  selector: 'app-worker-http-cancellation-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-base-200 border border-base-300 rounded-xl p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-bold text-base-content m-0 flex items-center gap-2">
          🛑 Cancellation
        </h2>
        <span class="badge badge-warning">New in v21.1.0</span>
      </div>
      <p class="text-sm text-base-content/80 mb-4">
        Per-request
        <code class="font-mono text-xs bg-base-300 px-1.5 py-0.5 rounded">signal</code>
        and
        <code class="font-mono text-xs bg-base-300 px-1.5 py-0.5 rounded">timeout</code>
        flow to the worker. Observable rejects with typed
        <code class="font-mono text-xs bg-base-300 px-1.5 py-0.5 rounded"
          >WorkerHttpAbortError</code
        >
        or
        <code class="font-mono text-xs bg-base-300 px-1.5 py-0.5 rounded"
          >WorkerHttpTimeoutError</code
        >.
      </p>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <button
          type="button"
          (click)="startSlowRequest()"
          [disabled]="status() === 'running'"
          class="btn btn-primary btn-sm"
        >
          @if (status() === 'running') {
            <span class="loading loading-spinner loading-xs"></span>
          }
          Start 5s request
        </button>
        <button
          type="button"
          (click)="abortCurrent()"
          [disabled]="status() !== 'running' || !currentAbortController"
          class="btn btn-error btn-sm"
        >
          Abort (signal)
        </button>
        <button
          type="button"
          (click)="startWithTimeout(500)"
          [disabled]="status() === 'running'"
          class="btn btn-warning btn-sm"
        >
          Run with 500ms timeout
        </button>
        <button
          type="button"
          (click)="failFastAlreadyAborted()"
          [disabled]="status() === 'running'"
          class="btn btn-secondary btn-sm"
        >
          Fail-fast (pre-aborted)
        </button>
      </div>

      @if (result()) {
        <div class="p-3 rounded-lg font-mono text-xs break-all" [class]="resultClass()">
          {{ result() }}
        </div>
      }
    </div>
  `,
})
export class CancellationCardComponent implements OnDestroy {
  private readonly log = inject(WorkerHttpDemoLogService);

  protected readonly status = signal<'idle' | 'running' | 'done' | 'error'>('idle');
  protected readonly result = signal<string>('');
  protected readonly resultClass = signal<string>('bg-base-300');
  protected currentAbortController: AbortController | null = null;

  private transport: WorkerTransport<unknown, unknown> | null = null;

  private getTransport(): WorkerTransport<unknown, unknown> {
    if (!this.transport) {
      this.transport = createWorkerTransport({
        workerUrl: ECHO_WORKER_URL,
        maxInstances: 1,
      });
    }
    return this.transport;
  }

  startSlowRequest(): void {
    this.status.set('running');
    this.result.set('');
    const ac = new AbortController();
    this.currentAbortController = ac;
    const start = performance.now();

    this.getTransport()
      .execute({ message: 'slow', delay: 5000 }, { signal: ac.signal })
      .subscribe({
        next: () => {
          const elapsed = Math.round(performance.now() - start);
          this.status.set('done');
          this.resultClass.set('bg-success/10 text-success');
          this.result.set(`Completed in ${elapsed}ms (no abort)`);
          this.currentAbortController = null;
          this.log.log('Cancel', `Slow request completed in ${elapsed}ms`, 'success');
        },
        error: (err) => this.handleError(err, start),
      });
    this.log.log('Cancel', 'Started 5s request — click "Abort" to cancel', 'info');
  }

  abortCurrent(): void {
    if (!this.currentAbortController) return;
    this.currentAbortController.abort('user clicked abort');
  }

  startWithTimeout(timeoutMs: number): void {
    this.status.set('running');
    this.result.set('');
    this.currentAbortController = null;
    const start = performance.now();

    this.getTransport()
      .execute({ message: 'slow', delay: 5000 }, { timeout: timeoutMs })
      .subscribe({
        next: () => {
          this.status.set('done');
          this.resultClass.set('bg-success/10 text-success');
          this.result.set('Completed before timeout');
        },
        error: (err) => this.handleError(err, start),
      });
    this.log.log('Cancel', `Started request with ${timeoutMs}ms timeout`, 'info');
  }

  failFastAlreadyAborted(): void {
    this.status.set('running');
    this.result.set('');
    const ac = new AbortController();
    ac.abort('preempted');
    this.currentAbortController = null;
    const start = performance.now();

    this.getTransport()
      .execute({ message: 'never', delay: 5000 }, { signal: ac.signal })
      .subscribe({
        next: () => {
          /* unreachable */
        },
        error: (err) => this.handleError(err, start),
      });
  }

  private handleError(err: unknown, start: number): void {
    const elapsed = Math.round(performance.now() - start);
    this.currentAbortController = null;
    this.status.set('error');

    if (err instanceof WorkerHttpAbortError) {
      this.resultClass.set('bg-warning/10 text-warning');
      this.result.set(`WorkerHttpAbortError after ${elapsed}ms — reason: ${String(err.reason)}`);
      this.log.log('Cancel', `Aborted via signal in ${elapsed}ms (${String(err.reason)})`, 'info');
      return;
    }
    if (err instanceof WorkerHttpTimeoutError) {
      this.resultClass.set('bg-error/10 text-error');
      this.result.set(`WorkerHttpTimeoutError after ${elapsed}ms (timeoutMs=${err.timeoutMs})`);
      this.log.log('Cancel', `Timed out after ${err.timeoutMs}ms`, 'error');
      return;
    }
    this.resultClass.set('bg-error/10 text-error');
    this.result.set(`Error: ${String(err)}`);
    this.log.log('Cancel', `Unexpected error: ${String(err)}`, 'error');
  }

  ngOnDestroy(): void {
    this.transport?.terminate();
  }
}
