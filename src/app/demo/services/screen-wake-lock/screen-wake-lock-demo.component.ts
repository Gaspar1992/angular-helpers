import {
  Component,
  OnDestroy,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
import { ScreenWakeLockService, PermissionsService } from '@angular-helpers/browser-web-apis';

@Component({
  selector: 'app-screen-wake-lock-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [PermissionsService, ScreenWakeLockService],
  template: `
    <section
      class="bg-base-200 border border-base-300 rounded-xl p-5 sm:p-6 mb-5"
      aria-labelledby="wl-title"
    >
      <div class="flex items-center justify-between gap-3 flex-wrap mb-3">
        <h2 class="text-lg sm:text-xl font-bold text-base-content m-0" id="wl-title">
          Screen Wake Lock
        </h2>
        <div class="flex gap-2 flex-wrap">
          @if (supported) {
            <span class="badge badge-success badge-sm">supported</span>
          } @else {
            <span class="badge badge-error badge-sm">unsupported</span>
          }
          <span class="badge badge-info badge-sm">secure context</span>
        </div>
      </div>
      <p class="text-sm text-base-content/80 mb-4 leading-relaxed">
        Prevents the screen from dimming or locking.
      </p>
      <div class="flex flex-wrap gap-2 items-center mb-4">
        <button
          class="btn btn-sm"
          [class.btn-error]="active()"
          [class.btn-primary]="!active()"
          (click)="toggle()"
          [disabled]="!supported"
        >
          {{ active() ? '🔓 Release wake lock' : '🔒 Acquire wake lock' }}
        </button>
        @if (active()) {
          <span class="badge badge-success badge-sm">active</span>
        } @else {
          <span class="badge badge-ghost badge-sm">inactive</span>
        }
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
