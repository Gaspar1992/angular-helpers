import {
  Component,
  OnDestroy,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { FullscreenService } from '@angular-helpers/browser-web-apis';

@Component({
  selector: 'app-fullscreen-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [FullscreenService],
  template: `
    <section
      class="bg-base-200 border border-base-300 rounded-xl p-5 sm:p-6 mb-5"
      aria-labelledby="fs-title"
    >
      <div class="flex items-center justify-between gap-3 flex-wrap mb-3">
        <h2 class="text-lg sm:text-xl font-bold text-base-content m-0" id="fs-title">
          Fullscreen API
        </h2>
        <div class="flex gap-2 flex-wrap">
          @if (supported) {
            <span class="badge badge-success badge-sm">supported</span>
          } @else {
            <span class="badge badge-error badge-sm">unsupported</span>
          }
          @if (isFullscreen()) {
            <span class="badge badge-success badge-sm">fullscreen</span>
          } @else {
            <span class="badge badge-ghost badge-sm">windowed</span>
          }
        </div>
      </div>
      <p class="text-sm text-base-content/70 mb-4 leading-relaxed">
        Request or exit fullscreen mode for the page.
      </p>
      <div class="flex flex-wrap gap-2 items-center mb-4">
        <button class="btn btn-primary btn-sm" (click)="toggle()" [disabled]="!supported">
          {{ isFullscreen() ? '↙ Exit fullscreen' : '↗ Enter fullscreen' }}
        </button>
      </div>
    </section>
  `,
})
export class FullscreenDemoComponent implements OnDestroy {
  private readonly svc = inject(FullscreenService);
  private readonly subs: Subscription[] = [];

  readonly supported = this.svc.isSupported();
  readonly isFullscreen = signal(false);

  constructor() {
    if (this.supported) {
      this.subs.push(this.svc.watch().subscribe((f) => this.isFullscreen.set(f)));
    }
  }

  async toggle(): Promise<void> {
    try {
      await this.svc.toggle();
    } catch {
      // unsupported or denied
    }
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }
}
