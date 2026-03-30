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
  ScreenOrientationService,
  injectScreenOrientation,
  type OrientationInfo,
} from '@angular-helpers/browser-web-apis';

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
          <span class="badge badge-info">{{ apiMode() }}</span>
        </div>
      </div>

      <p class="svc-desc">
        Reads the current screen orientation and angle. Rotate your device to see changes.
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
            <span class="kv-key">Type</span>
            <span class="kv-val mono">{{ orientation().type }}</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">Angle</span>
            <span class="kv-val mono">{{ orientation().angle }}°</span>
          </div>
        } @else {
          <div class="kv-row">
            <span class="kv-key">type</span>
            <span class="kv-val mono">{{ fnRef.type() }}</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">angle</span>
            <span class="kv-val mono">{{ fnRef.angle() }}°</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">isPortrait</span>
            <span class="kv-val mono">{{ fnRef.isPortrait() ? 'yes' : 'no' }}</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">isLandscape</span>
            <span class="kv-val mono">{{ fnRef.isLandscape() ? 'yes' : 'no' }}</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">orientation</span>
            <span class="kv-val mono"
              >{{ fnRef.orientation().type }} / {{ fnRef.orientation().angle }}°</span
            >
          </div>
        }
      </div>

      @if (apiMode() === 'Signal Fn') {
        <div class="code-example">
          <p class="svc-hint">Reactive orientation with lock/unlock methods:</p>
          <pre
            class="code-block"
          ><code>import {{ '{' }} injectScreenOrientation {{ '}' }} from '{{'@angular-helpers/browser-web-apis'}}';

    readonly orientation = injectScreenOrientation();

    // Read signals:
    // orientation.type() - 'portrait-primary', 'landscape', etc.
    // orientation.isPortrait(), orientation.isLandscape()
    // orientation.angle() - rotation in degrees

    // Lock to landscape:
    // await orientation.lock('landscape')</code></pre>
          <p class="svc-hint">
            <strong>When to use:</strong> Responsive layouts, games, fullscreen video.
          </p>
        </div>
      } @else {
        <div class="code-example">
          <p class="svc-hint">Manual stream with snapshot:</p>
          <pre
            class="code-block"
          ><code>import {{ '{' }} ScreenOrientationService {{ '}' }} from '{{'@angular-helpers/browser-web-apis'}}';

    readonly svc = inject(ScreenOrientationService);

    ngOnInit() {{ '{' }}
      const current = this.svc.getSnapshot();
      this.svc.watch().subscribe(o =&gt; {{ '{' }}
        // o.type, o.angle
      {{ '}' }});
    {{ '}' }}</code></pre>
          <p class="svc-hint">
            <strong>When to use:</strong> Complex rotation logic, orientation history.
          </p>
        </div>
      }
    </section>
  `,
})
export class ScreenOrientationDemoComponent implements OnDestroy {
  private readonly svc = inject(ScreenOrientationService);
  private readonly subs: Subscription[] = [];

  readonly supported = this.svc.isSupported();
  readonly apiMode = signal<'Service' | 'Signal Fn'>('Service');
  readonly orientation = signal<OrientationInfo>({ type: 'portrait-primary', angle: 0 });
  readonly fnRef = injectScreenOrientation();

  constructor() {
    if (this.supported) {
      this.orientation.set(this.svc.getSnapshot());
      this.subs.push(this.svc.watch().subscribe((o) => this.orientation.set(o)));
    }
  }

  setMode(mode: 'Service' | 'Signal Fn'): void {
    this.apiMode.set(mode);
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }
}
