import { Component, OnDestroy, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { ServerSentEventsService } from '@angular-helpers/browser-web-apis';

@Component({
  selector: 'app-server-sent-events-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ServerSentEventsService],
  imports: [FormsModule],
  template: `
    <section
      class="bg-base-200 border border-base-300 rounded-xl p-5 sm:p-6 mb-5"
      aria-labelledby="sse-title"
    >
      <div class="flex items-center justify-between gap-3 flex-wrap mb-3">
        <h2 class="text-lg sm:text-xl font-bold text-base-content m-0" id="sse-title">
          Server-Sent Events
        </h2>
        <div class="flex gap-2 flex-wrap">
          @if (supported) {
            <span class="badge badge-success badge-sm">supported</span>
          } @else {
            <span class="badge badge-error badge-sm">unsupported</span>
          }
          @if (connected()) {
            <span class="badge badge-success badge-sm">connected</span>
          } @else {
            <span class="badge badge-ghost badge-sm">disconnected</span>
          }
        </div>
      </div>
      <p class="text-sm text-base-content/80 mb-4 leading-relaxed">
        Connect to any SSE endpoint and stream events in real-time.
      </p>
      <div class="flex flex-wrap gap-2 items-center mb-4">
        <input
          class="input input-bordered input-sm flex-1 min-w-[200px]"
          name="sse-url"
          [ngModel]="url"
          (ngModelChange)="url = $event"
          placeholder="https://example.com/events"
          aria-label="SSE endpoint URL"
          [disabled]="connected()"
        />
        <button
          class="btn btn-primary btn-sm"
          (click)="connect()"
          [disabled]="!supported || connected()"
        >
          Connect
        </button>
        <button class="btn btn-error btn-sm" (click)="disconnect()" [disabled]="!connected()">
          Disconnect
        </button>
      </div>
      @if (messages().length > 0) {
        <div
          class="bg-base-300 border border-base-300 rounded-lg p-3 max-h-60 overflow-y-auto"
          aria-live="polite"
          aria-label="SSE messages"
        >
          @for (m of messages(); track $index) {
            <div
              class="font-mono text-sm text-base-content py-1 border-b border-base-300 last:border-b-0"
            >
              {{ m }}
            </div>
          }
        </div>
      }
      @if (messages().length === 0 && connected()) {
        <p class="text-xs text-base-content/80 italic">Waiting for events…</p>
      }
    </section>
  `,
})
export class ServerSentEventsDemoComponent implements OnDestroy {
  private readonly svc = inject(ServerSentEventsService);
  private readonly subs: Subscription[] = [];

  readonly supported = this.svc.isSupported();
  url = '';
  readonly connected = signal(false);
  readonly messages = signal<string[]>([]);

  connect(): void {
    const endpoint = this.url.trim();
    if (!endpoint) return;
    this.subs.push(
      this.svc.connect(endpoint).subscribe({
        next: (m) =>
          this.messages.update((prev) => [
            `[${m.type}] ${JSON.stringify(m.data)}`,
            ...prev.slice(0, 49),
          ]),
        error: () => this.connected.set(false),
      }),
    );
    this.connected.set(true);
  }

  disconnect(): void {
    this.svc.disconnect(this.url.trim());
    this.connected.set(false);
  }

  ngOnDestroy(): void {
    if (this.connected()) this.disconnect();
    this.subs.forEach((s) => s.unsubscribe());
  }
}
