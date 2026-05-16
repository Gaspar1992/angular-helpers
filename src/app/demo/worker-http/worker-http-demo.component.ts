import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransportCardComponent } from './cards/transport-card.component';
import { HmacCardComponent } from './cards/hmac-card.component';
import { HashCardComponent } from './cards/hash-card.component';
import { AesCardComponent } from './cards/aes-card.component';
import { BackendCardComponent } from './cards/backend-card.component';
import { CancellationCardComponent } from './cards/cancellation-card.component';
import { SerializerComparisonCardComponent } from './cards/serializer-comparison-card.component';
import { WorkerVsHttpClientCardComponent } from './cards/worker-vs-httpclient-card.component';
import { StreamsPolyfillCardComponent } from './cards/streams-polyfill-card.component';
import { WorkerHttpDemoLogService } from './shared/log.service';

@Component({
  selector: 'app-worker-http-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [WorkerHttpDemoLogService],
  imports: [
    CommonModule,
    TransportCardComponent,
    HmacCardComponent,
    HashCardComponent,
    AesCardComponent,
    BackendCardComponent,
    CancellationCardComponent,
    SerializerComparisonCardComponent,
    WorkerVsHttpClientCardComponent,
    StreamsPolyfillCardComponent,
  ],
  template: `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <header class="mb-12">
        <div class="flex flex-wrap items-center gap-4 mb-6">
          <div
            class="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-4xl shadow-lg border border-primary/20"
          >
            🚀
          </div>
          <div>
            <h1 class="text-3xl sm:text-4xl font-bold text-base-content m-0 tracking-tight">
              Worker HTTP
            </h1>
            <p class="text-sm sm:text-base text-base-content/60 m-0 mt-1">
              Off-main-thread HTTP with typed RPC bridge and pool orchestration
            </p>
          </div>
        </div>
        <div class="flex flex-wrap gap-2">
          <span class="badge badge-primary font-semibold">Worker Transport</span>
          <span class="badge badge-secondary font-semibold">HMAC Crypto</span>
          <span class="badge badge-accent font-semibold">Content Hashing</span>
          <span class="badge badge-info font-semibold">AES Encryption</span>
          <span class="badge badge-success font-semibold">HttpBackend</span>
          <span class="badge badge-warning font-semibold">Cancellation</span>
          <span class="badge badge-neutral font-semibold">TOON Serializer</span>
          <span class="badge badge-info font-semibold">Streams Polyfill</span>
        </div>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <app-worker-http-transport-card />
        <app-worker-http-hmac-card />
        <app-worker-http-hash-card />
        <app-worker-http-aes-card />
      </div>

      <div class="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <app-worker-http-streams-polyfill-card />
        <app-worker-http-cancellation-card />
      </div>

      <div class="mt-8 grid grid-cols-1 gap-8">
        <app-worker-http-backend-card />
        <app-worker-http-serializer-comparison-card />
        <app-worker-http-vs-httpclient-card />
      </div>

      <section
        class="mt-12 bg-base-200 border border-base-content/5 rounded-3xl p-8 shadow-xl"
        aria-label="Activity log"
      >
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-bold text-base-content m-0">Activity Log</h2>
          <button
            type="button"
            (click)="clearLogs()"
            class="btn btn-ghost btn-xs font-bold border border-base-content/5"
            [disabled]="logs().length === 0"
          >
            Clear Logs
          </button>
        </div>

        @if (logs().length === 0) {
          <div
            class="py-12 text-center bg-base-content/5 rounded-2xl border border-dashed border-base-content/10"
          >
            <p class="text-sm text-base-content/30 font-medium italic">
              No activity yet. Try the demos above!
            </p>
          </div>
        } @else {
          <div
            class="p-4 bg-base-content/5 rounded-2xl border border-base-content/5 shadow-inner space-y-2 max-h-80 overflow-y-auto"
          >
            @for (entry of logs(); track entry.id) {
              <div
                class="flex items-center gap-3 p-3 rounded-xl text-sm transition-colors hover:bg-base-content/5"
                [class.text-success]="entry.type === 'success'"
                [class.text-error]="entry.type === 'error'"
                [class.text-base-content/80]="entry.type === 'info'"
              >
                <span class="text-[10px] font-mono opacity-40 whitespace-nowrap">{{
                  entry.time
                }}</span>
                <span class="badge badge-xs badge-primary font-bold min-w-[80px]">{{
                  entry.section
                }}</span>
                <span class="flex-1 break-all font-medium">{{ entry.message }}</span>
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
