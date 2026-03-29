import {
  Component,
  OnDestroy,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { PageVisibilityService } from '@angular-helpers/browser-web-apis';

@Component({
  selector: 'app-page-visibility-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [PageVisibilityService],
  styleUrl: '../demo.styles.css',
  template: `
    <section class="svc-card" aria-labelledby="vis-title">
      <div class="svc-card-head">
        <h2 class="svc-card-title" id="vis-title">Page Visibility</h2>
        <div class="svc-badges">
          @if (supported) {
            <span class="badge badge-ok">supported</span>
          } @else {
            <span class="badge badge-no">unsupported</span>
          }
        </div>
      </div>
      <p class="svc-desc">
        Tracks whether this tab is visible or hidden. Switch to another tab and watch the state change.
      </p>
      <div class="svc-result">
        <div class="kv-row">
          <span class="kv-key">State</span>
          <span class="kv-val badge" [class]="'badge-vis-' + visibilityState()">{{
            visibilityState()
          }}</span>
        </div>
        <div class="kv-row">
          <span class="kv-key">Visible</span>
          <span class="kv-val">{{ pageVisible() ? 'yes' : 'no' }}</span>
        </div>
      </div>
    </section>
  `,
})
export class PageVisibilityDemoComponent implements OnDestroy {
  private readonly svc = inject(PageVisibilityService);
  private readonly subs: Subscription[] = [];

  readonly supported = this.svc.isSupported();
  readonly pageVisible = signal(true);
  readonly visibilityState = signal<string>('visible');

  constructor() {
    if (this.supported) {
      this.subs.push(
        this.svc.watch().subscribe((s) => {
          this.visibilityState.set(s);
          this.pageVisible.set(s === 'visible');
        }),
      );
    }
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }
}
