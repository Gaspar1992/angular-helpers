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
import { BroadcastChannelService } from '@angular-helpers/browser-web-apis';

@Component({
  selector: 'app-broadcast-channel-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [BroadcastChannelService],
  imports: [FormsModule],
  styleUrl: '../demo.styles.css',
  template: `
    <section class="svc-card" aria-labelledby="bc-title">
      <div class="svc-card-head">
        <h2 class="svc-card-title" id="bc-title">Broadcast Channel</h2>
        <div class="svc-badges">
          @if (supported) {
            <span class="badge badge-ok">supported</span>
          } @else {
            <span class="badge badge-no">unsupported</span>
          }
          <span class="badge" [class]="channelOpen() ? 'badge-ok' : 'badge-no'">
            {{ channelOpen() ? 'open' : 'closed' }}
          </span>
        </div>
      </div>
      <p class="svc-desc">
        Send messages between tabs on the same origin. Open this demo in a second tab and you'll see
        messages arrive.
      </p>
      <div class="svc-controls svc-controls--col">
        <div class="svc-controls">
          <input
            class="demo-input"
            [ngModel]="channelName"
            (ngModelChange)="channelName = $event"
            placeholder="Channel name"
            aria-label="Channel name"
            [disabled]="channelOpen()"
          />
          <button
            class="btn btn-primary"
            (click)="openChannel()"
            [disabled]="!supported || channelOpen()"
          >
            Listen
          </button>
          <button class="btn btn-secondary" (click)="clearMessages()">Clear</button>
        </div>
        <div class="svc-controls">
          <input
            class="demo-input"
            [ngModel]="channelMsg"
            (ngModelChange)="channelMsg = $event"
            placeholder="Message to broadcast"
            aria-label="Broadcast message"
            (keydown.enter)="send()"
            [disabled]="!channelOpen()"
          />
          <button
            class="btn btn-secondary"
            (click)="send()"
            [disabled]="!channelOpen() || !channelMsg.trim()"
          >
            Send
          </button>
        </div>
      </div>
      @if (messages().length > 0) {
        <div class="msg-log" aria-live="polite" aria-label="Channel messages">
          @for (m of messages(); track $index) {
            <div
              class="msg-row"
              [class.msg-sent]="m.dir === 'sent'"
              [class.msg-recv]="m.dir === 'recv'"
            >
              <span class="msg-dir">{{ m.dir }}</span>
              <span class="msg-text">{{ m.text }}</span>
              <span class="msg-time">{{ m.time }}</span>
            </div>
          }
        </div>
      }
    </section>
  `,
})
export class BroadcastChannelDemoComponent implements OnDestroy {
  private readonly svc = inject(BroadcastChannelService);
  private readonly subs: Subscription[] = [];

  readonly supported = this.svc.isSupported();
  channelName = 'demo-channel';
  channelMsg = '';
  readonly channelOpen = signal(false);
  readonly messages = signal<Array<{ dir: 'sent' | 'recv'; text: string; time: string }>>([]);

  openChannel(): void {
    if (!this.supported) return;
    this.subs.push(
      this.svc.open<string>(this.channelName).subscribe((msg) => {
        this.messages.update((prev) => [
          ...prev,
          { dir: 'recv', text: msg, time: new Date().toLocaleTimeString() },
        ]);
      }),
    );
    this.channelOpen.set(true);
  }

  send(): void {
    if (!this.channelMsg.trim()) return;
    this.svc.post(this.channelName, this.channelMsg);
    this.messages.update((prev) => [
      ...prev,
      { dir: 'sent', text: this.channelMsg, time: new Date().toLocaleTimeString() },
    ]);
    this.channelMsg = '';
  }

  clearMessages(): void {
    this.messages.set([]);
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }
}
