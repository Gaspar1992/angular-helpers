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
  styleUrl: '../demo.styles.css',
  template: `
    <section class="svc-card" aria-labelledby="fs-title">
      <div class="svc-card-head">
        <h2 class="svc-card-title" id="fs-title">Fullscreen API</h2>
        <div class="svc-badges">
          @if (supported) {
            <span class="badge badge-ok">supported</span>
          } @else {
            <span class="badge badge-no">unsupported</span>
          }
          <span class="badge" [class]="isFullscreen() ? 'badge-ok' : 'badge-no'">
            {{ isFullscreen() ? 'fullscreen' : 'windowed' }}
          </span>
        </div>
      </div>
      <p class="svc-desc">Request or exit fullscreen mode for the page.</p>
      <div class="svc-controls">
        <button class="btn btn-primary" (click)="toggle()" [disabled]="!supported">
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
