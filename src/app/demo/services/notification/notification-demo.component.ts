import {
  Component,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
import { NotificationService } from '@angular-helpers/browser-web-apis';

@Component({
  selector: 'app-notification-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [NotificationService],
  styleUrl: '../demo.styles.css',
  template: `
    <section class="svc-card" aria-labelledby="notif-title">
      <div class="svc-card-head">
        <h2 class="svc-card-title" id="notif-title">Notifications</h2>
        <div class="svc-badges">
          @if (supported) {
            <span class="badge badge-ok">supported</span>
          } @else {
            <span class="badge badge-no">unsupported</span>
          }
          <span class="badge badge-secure">secure context</span>
          <span
            class="badge"
            [class]="
              permission() === 'granted'
                ? 'badge-ok'
                : permission() === 'denied'
                  ? 'badge-no'
                  : 'badge-warn'
            "
          >
            {{ permission() }}
          </span>
        </div>
      </div>
      <p class="svc-desc">Request permission and show browser notifications.</p>
      <div class="svc-controls">
        <button
          class="btn btn-secondary"
          (click)="requestPermission()"
          [disabled]="!supported || permission() === 'granted'"
        >
          Request permission
        </button>
        <button
          class="btn btn-primary"
          (click)="showNotification()"
          [disabled]="!supported || permission() !== 'granted'"
        >
          Show notification
        </button>
      </div>
    </section>
  `,
})
export class NotificationDemoComponent {
  private readonly svc = inject(NotificationService);

  readonly supported = typeof window !== 'undefined' && 'Notification' in window;
  readonly permission = signal<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default',
  );

  async requestPermission(): Promise<void> {
    const perm = await this.svc.requestNotificationPermission();
    this.permission.set(perm);
  }

  async showNotification(): Promise<void> {
    try {
      await this.svc.showNotification('Angular Helpers', {
        body: 'Browser APIs done right.',
        tag: 'demo',
      });
    } catch {
      // unsupported or denied
    }
  }
}
