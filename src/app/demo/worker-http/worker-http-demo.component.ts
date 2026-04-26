import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TransportCardComponent } from './cards/transport-card.component';
import { HmacCardComponent } from './cards/hmac-card.component';
import { HashCardComponent } from './cards/hash-card.component';
import { AesCardComponent } from './cards/aes-card.component';
import { BackendCardComponent } from './cards/backend-card.component';
import { SerializerComparisonCardComponent } from './cards/serializer-comparison-card.component';
import { WorkerVsHttpClientCardComponent } from './cards/worker-vs-httpclient-card.component';
import { WorkerHttpDemoLogService } from './shared/log.service';

@Component({
  selector: 'app-worker-http-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [WorkerHttpDemoLogService],
  imports: [
    TransportCardComponent,
    HmacCardComponent,
    HashCardComponent,
    AesCardComponent,
    BackendCardComponent,
    SerializerComparisonCardComponent,
    WorkerVsHttpClientCardComponent,
  ],
  template: `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <header class="mb-8 sm:mb-12">
        <div class="flex flex-wrap items-center gap-3 mb-4">
          <span class="text-4xl" aria-hidden="true">🚀</span>
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold text-base-content m-0">Worker HTTP Demo</h1>
            <p class="text-sm sm:text-base text-base-content/80 m-0 mt-1">
              Off-main-thread HTTP with typed RPC bridge
            </p>
          </div>
        </div>
        <div class="flex flex-wrap gap-2">
          <span class="badge badge-primary badge-md">Worker Transport</span>
          <span class="badge badge-secondary badge-md">HMAC Crypto</span>
          <span class="badge badge-accent badge-md">Content Hashing</span>
          <span class="badge badge-info badge-md">AES Encryption</span>
          <span class="badge badge-success badge-md">HttpBackend</span>
          <span class="badge badge-warning badge-md">TOON Serializer</span>
        </div>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <app-worker-http-transport-card />
        <app-worker-http-hmac-card />
        <app-worker-http-hash-card />
        <app-worker-http-aes-card />
      </div>

      <div class="mt-6 grid grid-cols-1 gap-6">
        <app-worker-http-backend-card />
        <app-worker-http-serializer-comparison-card />
        <app-worker-http-vs-httpclient-card />
      </div>

      <section
        class="mt-8 bg-base-200 border border-base-300 rounded-xl p-6"
        aria-label="Activity log"
      >
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold text-base-content m-0">Activity Log</h2>
          <button
            type="button"
            (click)="clearLogs()"
            class="btn btn-ghost btn-sm"
            [disabled]="logs().length === 0"
          >
            Clear
          </button>
        </div>

        @if (logs().length === 0) {
          <p class="text-sm text-base-content/40 text-center py-8">
            No activity yet. Try the demos above!
          </p>
        } @else {
          <div class="space-y-2 max-h-64 overflow-y-auto">
            @for (entry of logs(); track entry.id) {
              <div
                class="flex items-center gap-3 p-3 rounded-lg text-sm"
                [class.bg-success/10]="entry.type === 'success'"
                [class.border-l-4]="true"
                [class.border-success]="entry.type === 'success'"
                [class.border-error]="entry.type === 'error'"
                [class.border-info]="entry.type === 'info'"
              >
                <span class="text-xs font-mono text-base-content/40">{{ entry.time }}</span>
                <span class="badge badge-xs badge-primary">{{ entry.section }}</span>
                <span class="flex-1 break-all">{{ entry.message }}</span>
              </div>
            }
          </div>
        }
      </section>
    </div>
  `,
})
export class WorkerHttpDemoComponent {
  private readonly logService = inject(WorkerHttpDemoLogService);
  protected readonly logs = this.logService.logs;

  clearLogs(): void {
    this.logService.clear();
  }
}
