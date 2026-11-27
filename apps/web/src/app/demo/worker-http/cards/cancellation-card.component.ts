import { Component, type OnDestroy, inject, signal } from '@angular/core';
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
  template: `
    <div class="svc-card h-full flex flex-col">
      <div class="svc-card-head">
        <h2 class="svc-card-title"><span>🛑</span> Cancellation</h2>
        <span class="badge badge-warning font-black">New in v21.1.0</span>
      </div>
      <p class="svc-desc">
        Per-request
        <code class="font-mono text-xs text-error px-2 py-0.5 bg-red-500/10 rounded-md"
          >signal</code
        >
        and
        <code class="font-mono text-xs text-error px-2 py-0.5 bg-red-500/10 rounded-md"
          >timeout</code
        >
        flow to the worker. Observable rejects with typed errors.
      </p>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <button
          type="button"
          (click)="startSlowRequest()"
          [disabled]="status() === 'running'"
          class="btn btn-primary"
        >
          @if (status() === 'running') {
            <span class="spinner w-4 h-4 mr-2"></span>
          }
          Start 5s request
        </button>
        <button
          type="button"
          (click)="abortCurrent()"
          [disabled]="status() !== 'running' || !currentAbortController"
          class="btn btn-secondary border border-red-500/30 text-red-400 hover:bg-red-500/10"
        >
          Abort (signal)
        </button>
        <button
          type="button"
          (click)="startWithTimeout(500)"
          [disabled]="status() === 'running'"
          class="btn btn-secondary"
        >
          500ms timeout
        </button>
        <button
          type="button"
          (click)="failFastAlreadyAborted()"
          [disabled]="status() === 'running'"
          class="btn btn-secondary"
        >
          Pre-aborted
        </button>
      </div>

      <div class="mt-auto">
        @if (result()) {
          <div class="font-mono text-[11px] break-all" [class]="resultClass()">
            <div class="font-black mb-2 uppercase tracking-widest text-[9px] opacity-70">
              Status
            </div>
            {{ result() }}
          </div>
        }
      </div>
    </div>
  `,
  styleUrl: '../../services/demo.styles.css',
})
export class CancellationCardComponent implements OnDestroy {
  private readonly log = inject(WorkerHttpDemoLogService);

  protected readonly status = signal<'idle' | 'running' | 'done' | 'error'>('idle');
  protected readonly result = signal<string>('');
  protected readonly resultClass = signal<string>('mono-block');
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
          this.resultClass.set('feedback feedback-success');
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
          this.resultClass.set('feedback feedback-success');
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
      this.resultClass.set('feedback feedback-warning');
      this.result.set(`WorkerHttpAbortError after ${elapsed}ms — reason: ${String(err.reason)}`);
      this.log.log('Cancel', `Aborted via signal in ${elapsed}ms (${String(err.reason)})`, 'info');
      return;
    }
    if (err instanceof WorkerHttpTimeoutError) {
      this.resultClass.set('feedback feedback-error');
      this.result.set(`WorkerHttpTimeoutError after ${elapsed}ms (timeoutMs=${err.timeoutMs})`);
      this.log.log('Cancel', `Timed out after ${err.timeoutMs}ms`, 'error');
      return;
    }
    this.resultClass.set('feedback feedback-error');
    this.result.set(`Error: ${String(err)}`);
    this.log.log('Cancel', `Unexpected error: ${String(err)}`, 'error');
  }

  ngOnDestroy(): void {
    this.transport?.terminate();
  }
}
