import { ChangeDetectionStrategy, Component, inject, signal, DestroyRef } from '@angular/core';
import {
  IdleDetectorService,
  UserIdleState,
  ScreenIdleState,
} from '@angular-helpers/browser-web-apis';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-idle-detector-demo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <section
      class="bg-base-200 border border-base-300 rounded-xl p-5 sm:p-6 mb-5"
      aria-labelledby="idle-title"
    >
      <div class="flex items-center justify-between gap-3 flex-wrap mb-3">
        <h2 class="text-lg sm:text-xl font-bold text-base-content m-0" id="idle-title">
          IdleDetector API
        </h2>
        <div class="flex gap-2 flex-wrap">
          @if (idleDetector.isSupported()) {
            <span class="badge badge-success badge-sm">supported</span>
          } @else {
            <span class="badge badge-error badge-sm">unsupported</span>
          }
          <span class="badge badge-info badge-sm">secure context</span>
        </div>
      </div>

      <p class="text-sm text-base-content/70 mb-4">
        Detect when the user is idle or the screen is locked at the system level.
      </p>

      @if (idleDetector.isSupported()) {
        <div class="flex gap-2 mb-4">
          <button
            class="btn btn-primary btn-sm"
            (click)="requestAndStart()"
            [disabled]="isTracking()"
          >
            Start Tracking (60s)
          </button>
          <button class="btn btn-error btn-sm" (click)="stop()" [disabled]="!isTracking()">
            Stop
          </button>
        </div>

        @if (permission() === 'denied') {
          <div class="alert alert-error py-2 text-sm mb-4">
            Permission denied to use IdleDetector.
          </div>
        }

        @if (isTracking()) {
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-base-100 p-3 rounded-lg border border-base-300 text-center">
              <div class="text-[10px] uppercase font-bold opacity-50 mb-1">User State</div>
              <div class="text-lg font-bold" [class.text-warning]="userState() === 'idle'">
                {{ userState() || 'Initializing...' }}
              </div>
            </div>
            <div class="bg-base-100 p-3 rounded-lg border border-base-300 text-center">
              <div class="text-[10px] uppercase font-bold opacity-50 mb-1">Screen State</div>
              <div class="text-lg font-bold" [class.text-error]="screenState() === 'locked'">
                {{ screenState() || 'Initializing...' }}
              </div>
            </div>
          </div>
        }
      } @else {
        <div class="alert alert-warning py-2 text-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            class="stroke-current shrink-0 w-4 h-4"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span>This browser does not support the IdleDetector API.</span>
        </div>
      }
    </section>
  `,
})
export class IdleDetectorDemoComponent {
  readonly idleDetector = inject(IdleDetectorService);
  private destroyRef = inject(DestroyRef);

  readonly isTracking = signal(false);
  readonly permission = signal<PermissionState | null>(null);
  readonly userState = signal<UserIdleState | null>(null);
  readonly screenState = signal<ScreenIdleState | null>(null);

  private sub?: Subscription;
  private abortController?: AbortController;

  constructor() {
    this.destroyRef.onDestroy(() => this.stop());
  }

  async requestAndStart() {
    try {
      const perm = await this.idleDetector.requestPermission();
      this.permission.set(perm);

      if (perm === 'granted') {
        this.start();
      }
    } catch (e) {
      console.error('Failed to request permission', e);
    }
  }

  private start() {
    this.stop();
    this.abortController = new AbortController();
    this.isTracking.set(true);

    this.sub = this.idleDetector
      .watch({
        threshold: 60000,
        signal: this.abortController.signal,
      })
      .subscribe({
        next: (state) => {
          this.userState.set(state.userState);
          this.screenState.set(state.screenState);
        },
        error: (e) => {
          console.error('IdleDetector error', e);
          this.stop();
        },
        complete: () => {
          this.isTracking.set(false);
        },
      });
  }

  stop() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = undefined;
    }
    if (this.sub) {
      this.sub.unsubscribe();
      this.sub = undefined;
    }
    this.isTracking.set(false);
    this.userState.set(null);
    this.screenState.set(null);
  }
}
