import { Component, inject } from '@angular/core';
import { VibrationService } from '@angular-helpers/browser-web-apis';

@Component({
  selector: 'app-vibration-demo',
  providers: [VibrationService],
  styleUrls: ['../demo.styles.css'],
  template: `
    <section class="svc-card" aria-labelledby="vib-title">
      <div class="svc-card-head">
        <h2 class="svc-card-title" id="vib-title">
          <span class="text-primary text-2xl">📳</span> Vibration API
        </h2>
        <div class="flex gap-2 flex-wrap">
          @if (supported) {
            <span class="badge badge-success font-black">supported</span>
          } @else {
            <span class="badge badge-warning font-black">mobile only</span>
          }
        </div>
      </div>
      <p class="svc-desc">
        Trigger haptic feedback patterns. Essential for improving mobile UX through physical tactile
        responses.
      </p>
      <div class="svc-controls">
        <button
          class="btn btn-secondary font-black"
          (click)="svc.success()"
          [disabled]="!supported"
        >
          Success
        </button>
        <button class="btn btn-secondary font-black" (click)="svc.error()" [disabled]="!supported">
          Error
        </button>
        <button
          class="btn btn-secondary font-black"
          (click)="svc.notification()"
          [disabled]="!supported"
        >
          Notification
        </button>
        <button
          class="btn btn-secondary font-black"
          (click)="svc.doubleTap()"
          [disabled]="!supported"
        >
          Double tap
        </button>
      </div>
      @if (!supported) {
        <p class="text-xs text-base-content/30 italic mt-6 ml-2 font-medium">
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
