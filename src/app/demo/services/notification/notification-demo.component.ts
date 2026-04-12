import {
  Component,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
import { NotificationService, PermissionsService } from '@angular-helpers/browser-web-apis';

@Component({
  selector: 'app-notification-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [PermissionsService, NotificationService],
  template: `
    <section
      class="bg-base-200 border border-base-300 rounded-xl p-5 sm:p-6 mb-5"
      aria-labelledby="notif-title"
    >
      <div class="flex items-center justify-between gap-3 flex-wrap mb-3">
        <h2 class="text-lg sm:text-xl font-bold text-base-content m-0" id="notif-title">
          Notifications
        </h2>
        <div class="flex gap-2 flex-wrap">
          @if (supported) {
            <span class="badge badge-success badge-sm">supported</span>
          } @else {
            <span class="badge badge-error badge-sm">unsupported</span>
          }
          <span class="badge badge-info badge-sm">secure context</span>
          @if (permission() === 'granted') {
            <span class="badge badge-success badge-sm">{{ permission() }}</span>
          } @else if (permission() === 'denied') {
            <span class="badge badge-error badge-sm">{{ permission() }}</span>
          } @else {
            <span class="badge badge-warning badge-sm">{{ permission() }}</span>
          }
        </div>
      </div>
      <p class="text-sm text-base-content/70 mb-4 leading-relaxed">
        Request permission and show browser notifications.
      </p>
      <div class="flex flex-wrap gap-2 items-center mb-4">
        <button
          class="btn btn-secondary btn-sm"
          (click)="requestPermission()"
          [disabled]="!supported || permission() === 'granted'"
        >
          Request permission
        </button>
        <button
          class="btn btn-primary btn-sm"
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
