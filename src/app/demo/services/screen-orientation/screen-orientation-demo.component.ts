import {
  Component,
  OnDestroy,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { ScreenOrientationService, type OrientationInfo } from '@angular-helpers/browser-web-apis';

@Component({
  selector: 'app-screen-orientation-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [ScreenOrientationService],
  styleUrl: '../demo.styles.css',
  template: `
    <section class="svc-card" aria-labelledby="orient-title">
      <div class="svc-card-head">
        <h2 class="svc-card-title" id="orient-title">Screen Orientation</h2>
        <div class="svc-badges">
          @if (supported) {
            <span class="badge badge-ok">supported</span>
          } @else {
            <span class="badge badge-no">unsupported</span>
          }
        </div>
      </div>
      <p class="svc-desc">
        Reads the current screen orientation and angle. Rotate your device to see changes.
      </p>
      <div class="svc-result">
        <div class="kv-row">
          <span class="kv-key">Type</span>
          <span class="kv-val mono">{{ orientation().type }}</span>
        </div>
        <div class="kv-row">
          <span class="kv-key">Angle</span>
          <span class="kv-val mono">{{ orientation().angle }}°</span>
        </div>
      </div>
    </section>
  `,
})
export class ScreenOrientationDemoComponent implements OnDestroy {
  private readonly svc = inject(ScreenOrientationService);
  private readonly subs: Subscription[] = [];

  readonly supported = this.svc.isSupported();
  readonly orientation = signal<OrientationInfo>({ type: 'portrait-primary', angle: 0 });

  constructor() {
    if (this.supported) {
      this.orientation.set(this.svc.getSnapshot());
      this.subs.push(this.svc.watch().subscribe((o) => this.orientation.set(o)));
    }
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }
}
