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
    <div class="max-width-container py-12 sm:py-20 animate-in fade-in duration-700">
      <header class="text-center mb-16">
        <div
          class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-widest text-primary mb-3"
        >
          🚀 <span>Off-Main-Thread Processing</span>
        </div>
        <h1
          class="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-base-content via-primary to-accent bg-clip-text text-transparent pb-2 mb-4"
        >
          Worker HTTP
        </h1>
        <p class="text-base-content/60 max-w-2xl mx-auto text-sm leading-relaxed">
          Off-main-thread HTTP with typed RPC bridge and pool orchestration.
        </p>
        <div class="flex flex-wrap gap-2.5 justify-center mt-6" aria-hidden="true">
          <span class="badge badge-primary font-black">Worker Transport</span>
          <span class="badge badge-secondary font-black">HMAC Crypto</span>
          <span class="badge badge-accent font-black">Content Hashing</span>
          <span class="badge badge-info font-black">AES Encryption</span>
          <span class="badge badge-success font-black">HttpBackend</span>
          <span class="badge badge-warning font-black">Cancellation</span>
          <span class="badge badge-neutral font-black">TOON Serializer</span>
          <span class="badge badge-info font-black">Streams Polyfill</span>
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

      <section class="mt-16 svc-card bg-slate-950/35 backdrop-blur-md" aria-label="Activity log">
        <div class="flex items-center justify-between mb-8">
          <h2 class="svc-card-title text-xl font-black">Activity Log</h2>
          <button
            type="button"
            (click)="clearLogs()"
            class="btn btn-secondary btn-sm"
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
            class="p-6 bg-slate-950/35 border border-white/5 rounded-2xl shadow-inner space-y-3 max-h-80 overflow-y-auto"
          >
            @for (entry of logs(); track entry.id) {
              <div
                class="flex items-center gap-4 p-3 rounded-xl text-sm transition-colors hover:bg-base-content/5"
                [class.text-success]="entry.type === 'success'"
                [class.text-error]="entry.type === 'error'"
                [class.text-base-content/85]="entry.type === 'info'"
              >
                <span class="text-[10px] font-mono opacity-40 whitespace-nowrap">{{
                  entry.time
                }}</span>
                <span
                  class="badge badge-sm badge-secondary font-black shrink-0 min-w-[90px] text-center"
                  >{{ entry.section }}</span
                >
                <span class="flex-1 break-all font-semibold">{{ entry.message }}</span>
              </div>
            }
          </div>
        }
      </section>
    </div>
  `,
  styleUrl: '../services/demo.styles.css',
})
export class WorkerHttpDemoComponent {
  private readonly logService = inject(WorkerHttpDemoLogService);
  protected readonly logs = this.logService.logs;

  clearLogs(): void {
    this.logService.clear();
  }
}
