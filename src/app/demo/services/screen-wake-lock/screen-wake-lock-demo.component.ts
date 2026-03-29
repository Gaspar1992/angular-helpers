import {
  Component,
  OnDestroy,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
import { ScreenWakeLockService } from '@angular-helpers/browser-web-apis';

@Component({
  selector: 'app-screen-wake-lock-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [ScreenWakeLockService],
  styleUrl: '../demo.styles.css',
  template: `
    <section class="svc-card" aria-labelledby="wl-title">
      <div class="svc-card-head">
        <h2 class="svc-card-title" id="wl-title">Screen Wake Lock</h2>
        <div class="svc-badges">
          @if (supported) {
            <span class="badge badge-ok">supported</span>
          } @else {
            <span class="badge badge-no">unsupported</span>
          }
          <span class="badge badge-secure">secure context</span>
        </div>
      </div>
      <p class="svc-desc">Prevents the screen from dimming or locking.</p>
      <div class="svc-controls">
        <button
          class="btn"
          [class]="active() ? 'btn-danger' : 'btn-primary'"
          (click)="toggle()"
          [disabled]="!supported"
        >
          {{ active() ? '🔓 Release wake lock' : '🔒 Acquire wake lock' }}
        </button>
        <span class="badge" [class]="active() ? 'badge-ok' : 'badge-no'">
          {{ active() ? 'active' : 'inactive' }}
        </span>
      </div>
    </section>
  `,
})
export class ScreenWakeLockDemoComponent implements OnDestroy {
  private readonly svc = inject(ScreenWakeLockService);

  readonly supported = this.svc.isSupported();
  readonly active = signal(false);

  async toggle(): Promise<void> {
    if (!this.supported) return;
    try {
      if (this.active()) {
        await this.svc.release();
        this.active.set(false);
      } else {
        await this.svc.request();
        this.active.set(true);
      }
    } catch {
      // unsupported or denied
    }
  }

  ngOnDestroy(): void {
    if (this.active()) void this.svc.release();
  }
}
