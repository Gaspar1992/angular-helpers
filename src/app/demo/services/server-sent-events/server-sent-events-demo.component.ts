import {
  Component,
  OnDestroy,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { ServerSentEventsService } from '@angular-helpers/browser-web-apis';

@Component({
  selector: 'app-server-sent-events-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [ServerSentEventsService],
  imports: [FormsModule],
  styleUrl: '../demo.styles.css',
  template: `
    <section class="svc-card" aria-labelledby="sse-title">
      <div class="svc-card-head">
        <h2 class="svc-card-title" id="sse-title">Server-Sent Events</h2>
        <div class="svc-badges">
          @if (supported) {
            <span class="badge badge-ok">supported</span>
          } @else {
            <span class="badge badge-no">unsupported</span>
          }
          <span class="badge" [class]="connected() ? 'badge-ok' : 'badge-no'">
            {{ connected() ? 'connected' : 'disconnected' }}
          </span>
        </div>
      </div>
      <p class="svc-desc">Connect to any SSE endpoint and stream events in real-time.</p>
      <div class="svc-controls">
        <input
          class="demo-input"
          name="sse-url"
          [ngModel]="url"
          (ngModelChange)="url = $event"
          placeholder="https://example.com/events"
          aria-label="SSE endpoint URL"
          [disabled]="connected()"
        />
        <button class="btn btn-primary" (click)="connect()" [disabled]="!supported || connected()">
          Connect
        </button>
        <button class="btn btn-danger" (click)="disconnect()" [disabled]="!connected()">
          Disconnect
        </button>
      </div>
      @if (messages().length > 0) {
        <div class="msg-log" aria-live="polite" aria-label="SSE messages">
          @for (m of messages(); track $index) {
            <div class="msg-row msg-recv">
              <span class="msg-text mono">{{ m }}</span>
            </div>
          }
        </div>
      }
      @if (messages().length === 0 && connected()) {
        <p class="svc-hint">Waiting for events…</p>
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
