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
    <div class="bg-base-200 border border-base-content/5 rounded-3xl p-8 h-full flex flex-col">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold text-error m-0 flex items-center gap-2">🛑 Cancellation</h2>
        <span class="badge badge-warning font-semibold">New in v21.1.0</span>
      </div>
      <p class="text-sm text-base-content/70 mb-8">
        Per-request
        <code class="font-mono text-xs bg-base-content/5 text-error px-2 py-0.5 rounded-md"
          >signal</code
        >
        and
        <code class="font-mono text-xs bg-base-content/5 text-error px-2 py-0.5 rounded-md"
          >timeout</code
        >
        flow to the worker. Observable rejects with typed errors.
      </p>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <button
          type="button"
          (click)="startSlowRequest()"
          [disabled]="status() === 'running'"
          class="btn btn-primary font-bold"
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
          class="btn btn-error font-bold"
        >
          Abort (signal)
        </button>
        <button
          type="button"
          (click)="startWithTimeout(500)"
          [disabled]="status() === 'running'"
          class="btn btn-warning font-bold"
        >
          500ms timeout
        </button>
        <button
          type="button"
          (click)="failFastAlreadyAborted()"
          [disabled]="status() === 'running'"
          class="btn btn-secondary font-bold"
        >
          Pre-aborted
        </button>
      </div>

      <div class="mt-auto">
        @if (result()) {
          <div
            class="p-4 rounded-2xl shadow-inner border font-mono text-xs break-all"
            [class]="resultClass()"
          >
            <div class="font-bold mb-1 uppercase tracking-wider text-[10px] opacity-70">Status</div>
            {{ result() }}
          </div>
        }
      </div>
    </div>
  `,
})
export class CancellationCardComponent implements OnDestroy {
  private readonly log = inject(WorkerHttpDemoLogService);

  protected readonly status = signal<'idle' | 'running' | 'done' | 'error'>('idle');
  protected readonly result = signal<string>('');
  protected readonly resultClass = signal<string>(
    'bg-base-content/5 border-base-content/5 text-base-content/80',
  );
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
          this.resultClass.set('bg-success/10 border-success/20 text-success');
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
          this.resultClass.set('bg-success/10 border-success/20 text-success');
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
      this.resultClass.set('bg-warning/10 border-warning/20 text-warning');
      this.result.set(`WorkerHttpAbortError after ${elapsed}ms — reason: ${String(err.reason)}`);
      this.log.log('Cancel', `Aborted via signal in ${elapsed}ms (${String(err.reason)})`, 'info');
      return;
    }
    if (err instanceof WorkerHttpTimeoutError) {
      this.resultClass.set('bg-error/10 border-error/20 text-error');
      this.result.set(`WorkerHttpTimeoutError after ${elapsed}ms (timeoutMs=${err.timeoutMs})`);
      this.log.log('Cancel', `Timed out after ${err.timeoutMs}ms`, 'error');
      return;
    }
    this.resultClass.set('bg-error/10 border-error/20 text-error');
    this.result.set(`Error: ${String(err)}`);
    this.log.log('Cancel', `Unexpected error: ${String(err)}`, 'error');
  }

  ngOnDestroy(): void {
    this.transport?.terminate();
  }
}
