import { Component, OnDestroy, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BroadcastChannelService } from '@angular-helpers/browser-web-apis';

@Component({
  selector: 'app-broadcast-channel-demo',
  providers: [BroadcastChannelService],
  imports: [FormsModule],
  styleUrls: ['../demo.styles.css'],
  template: `
    <section class="svc-card" aria-labelledby="bc-title">
      <div class="svc-card-head">
        <h2 class="svc-card-title" id="bc-title">
          <span class="text-primary text-2xl">📡</span> Broadcast Channel
        </h2>
        <div class="flex gap-2 flex-wrap">
          @if (supported) {
            <span class="badge badge-success font-black">supported</span>
          } @else {
            <span class="badge badge-error font-black">unsupported</span>
          }
        </div>
      </div>
      <p class="svc-desc">
        Communicate between different tabs or windows of the same origin in real-time.
      </p>

      <div class="space-y-6">
        <div class="space-y-2">
          <label>Broadcast Message</label>
          <div class="flex gap-3">
            <input
              type="text"
              [(ngModel)]="message"
              placeholder="Type to sync across tabs..."
              class="demo-input flex-1 font-bold"
            />
            <button
              class="btn btn-primary font-black px-8"
              (click)="send()"
              [disabled]="!message().trim() || !supported"
            >
              Broadcast
            </button>
          </div>
        </div>

        <div class="space-y-4 pt-4">
          <div class="flex items-center justify-between">
            <label class="m-0">Inbound Stream</label>
            <button class="btn btn-secondary btn-xs font-black" (click)="clearMessages()">
              Clear
            </button>
          </div>

          @if (messages().length === 0) {
            <div
              class="py-12 text-center bg-base-content/5 rounded-2xl border border-dashed border-base-content/10 shadow-inner"
            >
              <p
                class="text-[10px] font-black uppercase tracking-widest text-base-content/20 italic"
              >
                No incoming data
              </p>
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
                  <span class="font-bold text-primary italic flex-1 break-all">{{ msg.text }}</span>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </section>
  `,
})
export class BroadcastChannelDemoComponent implements OnDestroy {
  private readonly svc = inject(BroadcastChannelService);
  private readonly channelName = 'demo-channel';

  readonly supported = this.svc.isSupported();
  readonly message = signal('');
  readonly messages = signal<{ id: number; text: string; time: string }[]>([]);

  constructor() {
    if (this.supported) {
      this.svc.open(this.channelName).subscribe((msg) => {
        this.messages.update((prev) => [
          { id: Date.now(), text: String(msg), time: new Date().toLocaleTimeString() },
          ...prev.slice(0, 19),
        ]);
      });
    }
  }

  send(): void {
    this.svc.post(this.channelName, this.message());
    this.message.set('');
  }

  clearMessages(): void {
    this.messages.set([]);
  }

  ngOnDestroy(): void {
    this.svc.close(this.channelName);
  }
}
