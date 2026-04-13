import { Component, OnDestroy, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { BroadcastChannelService } from '@angular-helpers/browser-web-apis';

@Component({
  selector: 'app-broadcast-channel-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [BroadcastChannelService],
  imports: [FormsModule],
  template: `
    <section
      class="bg-base-200 border border-base-300 rounded-xl p-5 sm:p-6 mb-5"
      aria-labelledby="bc-title"
    >
      <div class="flex items-center justify-between gap-3 flex-wrap mb-3">
        <h2 class="text-lg sm:text-xl font-bold text-base-content m-0" id="bc-title">
          Broadcast Channel
        </h2>
        <div class="flex gap-2 flex-wrap">
          @if (supported) {
            <span class="badge badge-success badge-sm">supported</span>
          } @else {
            <span class="badge badge-error badge-sm">unsupported</span>
          }
          @if (channelOpen()) {
            <span class="badge badge-success badge-sm">open</span>
          } @else {
            <span class="badge badge-ghost badge-sm">closed</span>
          }
        </div>
      </div>
      <p class="text-sm text-base-content/80 mb-4 leading-relaxed">
        Send messages between tabs on the same origin. Open this demo in a second tab and you'll see
        messages arrive.
      </p>
      <div class="flex flex-col gap-2 mb-4">
        <div class="flex flex-wrap gap-2 items-center">
          <input
            class="input input-bordered input-sm flex-1 min-w-[150px]"
            name="channel-name"
            [ngModel]="channelName"
            (ngModelChange)="channelName = $event"
            placeholder="Channel name"
            aria-label="Channel name"
            [disabled]="channelOpen()"
          />
          <button
            class="btn btn-primary btn-sm"
            (click)="openChannel()"
            [disabled]="!supported || channelOpen()"
          >
            Listen
          </button>
          <button class="btn btn-secondary btn-sm" (click)="clearMessages()">Clear</button>
        </div>
        <div class="flex flex-wrap gap-2 items-center">
          <input
            class="input input-bordered input-sm flex-1 min-w-[150px]"
            name="channel-message"
            [ngModel]="channelMsg"
            (ngModelChange)="channelMsg = $event"
            placeholder="Message to broadcast"
            aria-label="Broadcast message"
            (keydown.enter)="send()"
            [disabled]="!channelOpen()"
          />
          <button
            class="btn btn-secondary btn-sm"
            (click)="send()"
            [disabled]="!channelOpen() || !channelMsg.trim()"
          >
            Send
          </button>
        </div>
      </div>
      @if (messages().length > 0) {
        <div
          class="bg-base-300 border border-base-300 rounded-lg p-3 max-h-60 overflow-y-auto"
          aria-live="polite"
          aria-label="Channel messages"
        >
          @for (m of messages(); track $index) {
            <div
              class="flex items-center gap-3 py-1 border-b border-base-300 last:border-b-0 text-sm"
            >
              <span
                class="badge badge-xs"
                [class.badge-primary]="m.dir === 'sent'"
                [class.badge-secondary]="m.dir === 'recv'"
                >{{ m.dir }}</span
              >
              <span class="flex-1 text-base-content">{{ m.text }}</span>
              <span class="text-xs text-base-content/80">{{ m.time }}</span>
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
