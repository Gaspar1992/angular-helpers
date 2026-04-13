import { Component, ChangeDetectionStrategy, signal } from '@angular/core';

@Component({
  selector: 'app-backend-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="bg-base-200 border border-base-300 rounded-xl p-5 sm:p-6 mb-5">
      <div class="flex items-center justify-between gap-3 flex-wrap mb-3">
        <h2 class="text-lg sm:text-xl font-bold text-base-content m-0 flex items-center gap-2">
          🔀 HttpBackend
        </h2>
        <span class="badge badge-success badge-sm">Angular DI</span>
      </div>
      <p class="text-sm text-base-content/80 mb-4 leading-relaxed">
        Drop-in HttpClient replacement that routes requests to Web Workers
      </p>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
        <button (click)="routeToApiWorker()" class="btn btn-success btn-sm">
          Route to 'api' worker
        </button>
        <button (click)="routeToSecureWorker()" class="btn btn-primary btn-sm">
          Route to 'secure' worker
        </button>
        <button (click)="fallbackMainThread()" class="btn btn-secondary btn-sm">
          Fallback: main-thread
        </button>
        <button (click)="ssrMode()" class="btn btn-accent btn-sm">SSR Mode (no worker)</button>
      </div>

      @if (backendResult()) {
        <div class="p-3 bg-base-300 rounded-lg font-mono text-xs break-all text-base-content">
          {{ backendResult() }}
        </div>
      }
    </section>
  `,
})
export class BackendDemoComponent {
  backendResult = signal<string>('');

  routeToApiWorker(): void {
    this.backendResult.set(`🚀 Routed GET /api/users → 'api' worker (round-robin pool)`);
  }

  routeToSecureWorker(): void {
    this.backendResult.set(`🔒 Routed GET /api/secure/payments → 'secure' worker (priority: 10)`);
  }

  fallbackMainThread(): void {
    this.backendResult.set(`🌐 Fallback: typeof Worker === 'undefined' → FetchBackend (SSR-safe)`);
  }

  ssrMode(): void {
    this.backendResult.set(`🖥️ SSR: Worker unavailable, using main-thread fetch()`);
  }
}
