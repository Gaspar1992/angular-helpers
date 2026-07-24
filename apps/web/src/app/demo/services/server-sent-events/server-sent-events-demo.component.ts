import { Component, type OnDestroy, inject, signal } from '@angular/core';
import { ServerSentEventsService } from '@angular-helpers/browser-web-apis';

@Component({
  selector: 'app-server-sent-events-demo',
  providers: [ServerSentEventsService],
  styleUrls: ['../demo.styles.css'],
  template: `
    <section class="svc-card" aria-labelledby="sse-title">
      <div class="svc-card-head">
        <h2 class="svc-card-title" id="sse-title">
          <span class="text-primary text-2xl">📡</span> Server-Sent Events
        </h2>
        <div class="flex gap-2 flex-wrap">
          @if (supported) {
            <span class="badge badge-success font-black">supported</span>
          } @else {
            <span class="badge badge-error font-black">unsupported</span>
          }
          @if (connected()) {
            <span class="badge badge-primary animate-pulse font-black">CONNECTED</span>
          }
        </div>
      </div>
      <p class="svc-desc">
        Receive real-time push updates from the server over a single HTTP connection.
      </p>

      <div class="svc-controls mb-8">
        <button
          class="btn btn-primary font-black"
          (click)="connect()"
          [disabled]="connected() || !supported"
        >
          Connect to Stream
        </button>
        <button class="btn btn-danger font-black" (click)="disconnect()" [disabled]="!connected()">
          Disconnect
        </button>
      </div>

      <div class="space-y-4">
        <label>Inbound Events</label>
        @if (messages().length === 0) {
          <div
            class="py-12 text-center bg-base-content/5 rounded-2xl border border-dashed border-base-content/10 shadow-inner italic text-xs text-base-content/20"
          >
            {{ connected() ? 'Waiting for events...' : 'No active stream' }}
          </div>
        } @else {
          <div class="svc-result space-y-3 max-h-48 overflow-y-auto no-scrollbar">
            @for (msg of messages(); track msg.id) {
              <div
                class="flex items-center gap-3 p-3 rounded-xl bg-base-content/5 border border-base-content/5 animate-in slide-in-from-left-2 duration-300"
              >
                <span class="text-[9px] font-mono opacity-20 whitespace-nowrap">{{
                  msg.time
                }}</span>
                <span class="font-bold text-accent italic flex-1 break-all">{{ msg.text }}</span>
              </div>
            }
          </div>
        }
      </div>
    </section>
  `,
})
export class ServerSentEventsDemoComponent implements OnDestroy {
  private readonly svc = inject(ServerSentEventsService);
  private readonly demoUrl = 'https://api.angular-helpers.dev/events';

  readonly supported = typeof window !== 'undefined' && 'EventSource' in window;
  readonly connected = signal(false);
  readonly messages = signal<{ id: number; text: string; time: string }[]>([]);

  connect(): void {
    if (!this.supported) return;
    this.connected.set(true);
    this.svc.connect(this.demoUrl).subscribe({
      next: (msg) => {
        this.messages.update((prev) => [
          { id: Date.now(), text: String(msg.data), time: new Date().toLocaleTimeString() },
          ...prev.slice(0, 19),
        ]);
      },
      error: () => this.connected.set(false),
    });
  }

  disconnect(): void {
    this.svc.disconnect(this.demoUrl);
    this.connected.set(false);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
