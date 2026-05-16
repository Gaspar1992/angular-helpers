import { Component, OnDestroy, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { ScreenWakeLockService } from '@angular-helpers/browser-web-apis';

@Component({
  selector: 'app-screen-wake-lock-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ScreenWakeLockService],
  styleUrls: ['../demo.styles.css'],
  template: `
    <section class="svc-card" aria-labelledby="wl-title">
      <div class="svc-card-head">
        <h2 class="svc-card-title" id="wl-title">
          <span class="text-primary text-2xl">🕯️</span> Screen Wake Lock
        </h2>
        <div class="flex gap-2 flex-wrap">
          @if (supported) {
            <span class="badge badge-success font-black">supported</span>
          } @else {
            <span class="badge badge-error font-black">unsupported</span>
          }
          @if (locked()) {
            <span class="badge badge-primary animate-pulse font-black">ACTIVE</span>
          }
        </div>
      </div>
      <p class="svc-desc">
        Prevent the screen from dimming or locking during important application tasks.
      </p>

      <div class="svc-controls">
        <button
          class="btn btn-primary font-black"
          (click)="request()"
          [disabled]="locked() || !supported"
        >
          Request Lock
        </button>
        <button class="btn btn-secondary font-black" (click)="release()" [disabled]="!locked()">
          Release Lock
        </button>
      </div>

      <div class="mt-8">
        <div class="svc-result flex items-center justify-between">
          <span class="kv-key">Status</span>
          <span class="font-black text-sm" [class.text-primary]="locked()">
            {{ locked() ? 'WAKE LOCK ACTIVE' : 'INACTIVE' }}
          </span>
        </div>
      </div>
    </section>
  `,
})
export class ScreenWakeLockDemoComponent implements OnDestroy {
  private readonly svc = inject(ScreenWakeLockService);

  readonly supported = this.svc.isSupported();
  readonly locked = signal(false);

  async request(): Promise<void> {
    try {
      await this.svc.request();
      this.locked.set(true);
    } catch {
      // denied
    }
  }

  async release(): Promise<void> {
    await this.svc.release();
    this.locked.set(false);
  }

  ngOnDestroy(): void {
    void this.release();
  }
}
