import { Component, OnDestroy, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { FullscreenService } from '@angular-helpers/browser-web-apis';

@Component({
  selector: 'app-fullscreen-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [FullscreenService],
  styleUrls: ['../demo.styles.css'],
  template: `
    <section class="svc-card" aria-labelledby="fs-title">
      <div class="svc-card-head">
        <h2 class="svc-card-title" id="fs-title">
          <span class="text-primary text-2xl">🖥️</span> Fullscreen API
        </h2>
        <div class="flex gap-2 flex-wrap">
          @if (supported) {
            <span class="badge badge-success font-black">supported</span>
          } @else {
            <span class="badge badge-error font-black">unsupported</span>
          }
          <span class="badge font-black" [class.badge-primary]="isFullscreen()">
            {{ isFullscreen() ? 'FULLSCREEN' : 'WINDOWED' }}
          </span>
        </div>
      </div>
      <p class="svc-desc">Request or exit immersive fullscreen mode for the entire application.</p>

      <div class="svc-controls">
        <button class="btn btn-primary font-black" (click)="toggle()" [disabled]="!supported">
          {{ isFullscreen() ? '↙ Exit Fullscreen' : '↗ Enter Fullscreen' }}
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
      // ignore
    }
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }
}
