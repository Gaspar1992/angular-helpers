import {
  Component,
  OnDestroy,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
import { Subscription } from 'rxjs';
import {
  PageVisibilityService,
  injectPageVisibility,
  type PageVisibilityRef,
} from '@angular-helpers/browser-web-apis';

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
          <span class="badge badge-info">{{ apiMode() }}</span>
        </div>
      </div>

      <p class="svc-desc">
        Tracks whether this tab is visible or hidden. Switch to another tab and watch the state change.
      </p>

      <div class="svc-controls">
        <div class="segmented" role="group" aria-label="API mode">
          <button class="btn" [class.active]="apiMode() === 'Service'" (click)="setMode('Service')">
            Service (RxJS)
          </button>
          <button class="btn" [class.active]="apiMode() === 'Signal Fn'" (click)="setMode('Signal Fn')">
            Signal Fn
          </button>
        </div>
      </div>

      <div class="svc-result">
        @if (apiMode() === 'Service') {
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
        } @else {
          <div class="kv-row">
            <span class="kv-key">State</span>
            <span class="kv-val badge" [class]="'badge-vis-' + fnRef.state()">{{ fnRef.state() }}</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">isVisible</span>
            <span class="kv-val">{{ fnRef.isVisible() ? 'yes' : 'no' }}</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">isHidden</span>
            <span class="kv-val">{{ fnRef.isHidden() ? 'yes' : 'no' }}</span>
          </div>
        }
      </div>
    </section>
  `,
})
export class PageVisibilityDemoComponent implements OnDestroy {
  private readonly svc = inject(PageVisibilityService);
  private readonly subs: Subscription[] = [];
  readonly fnRef: PageVisibilityRef;

  readonly supported = this.svc.isSupported();
  readonly apiMode = signal<'Service' | 'Signal Fn'>('Service');
  readonly pageVisible = signal(true);
  readonly visibilityState = signal<string>('visible');

  constructor() {
    this.fnRef = injectPageVisibility();

    if (this.supported) {
      this.subs.push(
        this.svc.watch().subscribe((s) => {
          this.visibilityState.set(s);
          this.pageVisible.set(s === 'visible');
        }),
      );
    }
  }

  setMode(mode: 'Service' | 'Signal Fn'): void {
    this.apiMode.set(mode);
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }
}
