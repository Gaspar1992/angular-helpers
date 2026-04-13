import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { VibrationService } from '@angular-helpers/browser-web-apis';

@Component({
  selector: 'app-vibration-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [VibrationService],
  template: `
    <section
      class="bg-base-200 border border-base-300 rounded-xl p-5 sm:p-6 mb-5"
      aria-labelledby="vib-title"
    >
      <div class="flex items-center justify-between gap-3 flex-wrap mb-3">
        <h2 class="text-lg sm:text-xl font-bold text-base-content m-0" id="vib-title">
          Vibration API
        </h2>
        <div class="flex gap-2 flex-wrap">
          @if (supported) {
            <span class="badge badge-success badge-sm">supported</span>
          } @else {
            <span class="badge badge-warning badge-sm">mobile only</span>
          }
        </div>
      </div>
      <p class="text-sm text-base-content/80 mb-4 leading-relaxed">
        Trigger haptic feedback patterns. Works on mobile devices.
      </p>
      <div class="flex flex-wrap gap-2 items-center mb-4">
        <button class="btn btn-secondary btn-sm" (click)="svc.success()" [disabled]="!supported">
          Success
        </button>
        <button class="btn btn-secondary btn-sm" (click)="svc.error()" [disabled]="!supported">
          Error
        </button>
        <button
          class="btn btn-secondary btn-sm"
          (click)="svc.notification()"
          [disabled]="!supported"
        >
          Notification
        </button>
        <button class="btn btn-secondary btn-sm" (click)="svc.doubleTap()" [disabled]="!supported">
          Double tap
        </button>
      </div>
      @if (!supported) {
        <p class="text-xs text-base-content/80 italic">
          Vibration API is not available on this device/browser.
        </p>
      }
    </section>
  `,
})
export class VibrationDemoComponent {
  protected readonly svc = inject(VibrationService);
  readonly supported = this.svc.isSupported();
}
