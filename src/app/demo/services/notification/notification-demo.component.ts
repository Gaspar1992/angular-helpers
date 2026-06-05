import { Component, inject, signal } from '@angular/core';
import { NotificationService } from '@angular-helpers/browser-web-apis';

@Component({
  selector: 'app-notification-demo',
  providers: [NotificationService],
  styleUrls: ['../demo.styles.css'],
  template: `
    <section class="svc-card" aria-labelledby="notif-title">
      <div class="svc-card-head">
        <h2 class="svc-card-title" id="notif-title">
          <span class="text-primary text-2xl">🔔</span> Notifications
        </h2>
        <div class="flex gap-2 flex-wrap">
          @if (supported) {
            <span class="badge badge-success font-black">supported</span>
          } @else {
            <span class="badge badge-error font-black">unsupported</span>
          }
          <span
            class="badge font-black uppercase tracking-widest text-[9px]"
            [class.badge-success]="permission() === 'granted'"
            [class.badge-warning]="permission() === 'default'"
            [class.badge-error]="permission() === 'denied'"
          >
            {{ permission() }}
          </span>
        </div>
      </div>
      <p class="svc-desc">
        Display system-level notifications to the user. Requires explicit permission.
      </p>

      <div class="svc-controls">
        <button
          class="btn btn-secondary font-black"
          (click)="requestPermission()"
          [disabled]="permission() === 'granted' || !supported"
        >
          Request Permission
        </button>
        <button
          class="btn btn-primary font-black"
          (click)="show()"
          [disabled]="permission() !== 'granted'"
        >
          Push Notification
        </button>
      </div>

      @if (permission() === 'default') {
        <div class="feedback feedback-info mt-8">
          <span class="text-2xl">ℹ️</span>
          <span>Please allow notifications in your browser to test this demo.</span>
        </div>
      }
    </section>
  `,
})
export class NotificationDemoComponent {
  private readonly svc = inject(NotificationService);

  readonly supported = this.svc.isSupported();
  readonly permission = signal<NotificationPermission>('default');

  constructor() {
    if (this.supported) {
      this.permission.set(this.svc.permission);
    }
  }

  async requestPermission(): Promise<void> {
    const p = await this.svc.requestNotificationPermission();
    this.permission.set(p);
  }

  show(): void {
    this.svc.showNotification('Angular Helpers', {
      body: 'Premium technical utilities for elite developers.',
      icon: 'icon.png',
    });
  }
}
