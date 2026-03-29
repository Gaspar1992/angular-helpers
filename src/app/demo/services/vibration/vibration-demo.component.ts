import { Component, ViewEncapsulation, ChangeDetectionStrategy, inject } from '@angular/core';
import { VibrationService } from '@angular-helpers/browser-web-apis';

@Component({
  selector: 'app-vibration-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [VibrationService],
  styleUrl: '../demo.styles.css',
  template: `
    <section class="svc-card" aria-labelledby="vib-title">
      <div class="svc-card-head">
        <h2 class="svc-card-title" id="vib-title">Vibration API</h2>
        <div class="svc-badges">
          @if (supported) {
            <span class="badge badge-ok">supported</span>
          } @else {
            <span class="badge badge-warn">mobile only</span>
          }
        </div>
      </div>
      <p class="svc-desc">Trigger haptic feedback patterns. Works on mobile devices.</p>
      <div class="svc-controls">
        <button class="btn btn-secondary" (click)="svc.success()" [disabled]="!supported">
          Success
        </button>
        <button class="btn btn-secondary" (click)="svc.error()" [disabled]="!supported">Error</button>
        <button class="btn btn-secondary" (click)="svc.notification()" [disabled]="!supported">
          Notification
        </button>
        <button class="btn btn-secondary" (click)="svc.doubleTap()" [disabled]="!supported">
          Double tap
        </button>
      </div>
      @if (!supported) {
        <p class="svc-hint">Vibration API is not available on this device/browser.</p>
      }
    </section>
  `,
})
export class VibrationDemoComponent {
  protected readonly svc = inject(VibrationService);
  readonly supported = this.svc.isSupported();
}
