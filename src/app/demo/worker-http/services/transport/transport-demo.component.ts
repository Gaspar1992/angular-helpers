import { Component, ChangeDetectionStrategy, ViewEncapsulation, signal } from '@angular/core';

@Component({
  selector: 'app-transport-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <section class="bg-base-200 border border-base-300 rounded-xl p-5 sm:p-6 mb-5">
      <div class="flex items-center justify-between gap-3 flex-wrap mb-3">
        <h2 class="text-lg sm:text-xl font-bold text-base-content m-0 flex items-center gap-2">
          ⚡ WorkerTransport
        </h2>
        <span class="badge badge-primary badge-sm">Typed RPC</span>
      </div>
      <p class="text-sm text-base-content/70 mb-4 leading-relaxed">
        Typed RPC bridge with request/response correlation and worker pool
      </p>

      <div class="flex flex-wrap gap-2 mb-4">
        <button (click)="sendEcho()" class="btn btn-primary btn-sm">Send Echo</button>
        <button (click)="poolBurst()" class="btn btn-secondary btn-sm">
          Pool Burst (4 workers)
        </button>
      </div>

      @if (transportResult()) {
        <div class="p-3 bg-base-300 rounded-lg font-mono text-xs break-all text-base-content">
          {{ transportResult() }}
        </div>
      }
    </section>
  `,
})
export class TransportDemoComponent {
  transportResult = signal<string>('');

  sendEcho(): void {
    this.transportResult.set('Echo request sent...');
    // Implementation would use WorkerHttpService
  }

  poolBurst(): void {
    this.transportResult.set('Pool burst started with 8 requests...');
    // Implementation would use WorkerHttpService with pool
  }
}
