import { Component, OnDestroy, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  ScreenOrientationService,
  injectScreenOrientation,
  type OrientationInfo,
} from '@angular-helpers/browser-web-apis';

@Component({
  selector: 'app-screen-orientation-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ScreenOrientationService],
  template: `
    <section
      class="bg-base-200 border border-base-300 rounded-xl p-5 sm:p-6 mb-5"
      aria-labelledby="orient-title"
    >
      <div class="flex items-center justify-between gap-3 flex-wrap mb-3">
        <h2 class="text-lg sm:text-xl font-bold text-base-content m-0" id="orient-title">
          Screen Orientation
        </h2>
        <div class="flex gap-2 flex-wrap">
          @if (supported) {
            <span class="badge badge-success badge-sm">supported</span>
          } @else {
            <span class="badge badge-error badge-sm">unsupported</span>
          }
          <span class="badge badge-info badge-sm">{{ apiMode() }}</span>
        </div>
      </div>

      <p class="text-sm text-base-content/80 mb-4 leading-relaxed">
        Reads the current screen orientation and angle. Rotate your device to see changes.
      </p>

      <div class="flex flex-wrap gap-2 items-center mb-4">
        <div class="join" role="group" aria-label="API mode">
          <button
            class="btn btn-sm join-item"
            [class.btn-active]="apiMode() === 'Service'"
            (click)="setMode('Service')"
          >
            Service (RxJS)
          </button>
          <button
            class="btn btn-sm join-item"
            [class.btn-active]="apiMode() === 'Signal Fn'"
            (click)="setMode('Signal Fn')"
          >
            Signal Fn
          </button>
        </div>
      </div>

      <div class="bg-base-300 border border-base-300 rounded-lg p-4">
        @if (apiMode() === 'Service') {
          <div
            class="flex items-center justify-between py-2 border-b border-base-300 last:border-b-0"
          >
            <span class="text-sm text-base-content/80 font-medium">Type</span>
            <span class="text-sm text-base-content font-semibold font-mono">{{
              orientation().type
            }}</span>
          </div>
          <div
            class="flex items-center justify-between py-2 border-b border-base-300 last:border-b-0"
          >
            <span class="text-sm text-base-content/80 font-medium">Angle</span>
            <span class="text-sm text-base-content font-semibold font-mono"
              >{{ orientation().angle }}°</span
            >
          </div>
        } @else {
          <div
            class="flex items-center justify-between py-2 border-b border-base-300 last:border-b-0"
          >
            <span class="text-sm text-base-content/80 font-medium">type</span>
            <span class="text-sm text-base-content font-semibold font-mono">{{
              fnRef.type()
            }}</span>
          </div>
          <div
            class="flex items-center justify-between py-2 border-b border-base-300 last:border-b-0"
          >
            <span class="text-sm text-base-content/80 font-medium">angle</span>
            <span class="text-sm text-base-content font-semibold font-mono"
              >{{ fnRef.angle() }}°</span
            >
          </div>
          <div
            class="flex items-center justify-between py-2 border-b border-base-300 last:border-b-0"
          >
            <span class="text-sm text-base-content/80 font-medium">isPortrait</span>
            <span class="text-sm text-base-content font-semibold font-mono">{{
              fnRef.isPortrait() ? 'yes' : 'no'
            }}</span>
          </div>
          <div
            class="flex items-center justify-between py-2 border-b border-base-300 last:border-b-0"
          >
            <span class="text-sm text-base-content/80 font-medium">isLandscape</span>
            <span class="text-sm text-base-content font-semibold font-mono">{{
              fnRef.isLandscape() ? 'yes' : 'no'
            }}</span>
          </div>
          <div
            class="flex items-center justify-between py-2 border-b border-base-300 last:border-b-0"
          >
            <span class="text-sm text-base-content/80 font-medium">orientation</span>
            <span class="text-sm text-base-content font-semibold font-mono"
              >{{ fnRef.orientation().type }} / {{ fnRef.orientation().angle }}°</span
            >
          </div>
        }
      </div>

      @if (apiMode() === 'Signal Fn') {
        <div class="mt-4">
          <p class="text-xs text-base-content/80 mb-2">
            Reactive orientation with lock/unlock methods:
          </p>
          <pre
            class="bg-base-300 border border-base-300 rounded-lg p-3 overflow-x-auto font-mono text-sm text-base-content"
          ><code>import {{ '{' }} injectScreenOrientation {{ '}' }} from '{{'@angular-helpers/browser-web-apis'}}';

    readonly orientation = injectScreenOrientation();

    // Read signals:
    // orientation.type() - 'portrait-primary', 'landscape', etc.
    // orientation.isPortrait(), orientation.isLandscape()
    // orientation.angle() - rotation in degrees

    // Lock to landscape:
    // await orientation.lock('landscape')</code></pre>
          <p class="text-xs text-base-content/80 mt-2">
            <strong>When to use:</strong> Responsive layouts, games, fullscreen video.
          </p>
        </div>
      } @else {
        <div class="mt-4">
          <p class="text-xs text-base-content/80 mb-2">Manual stream with snapshot:</p>
          <pre
            class="bg-base-300 border border-base-300 rounded-lg p-3 overflow-x-auto font-mono text-sm text-base-content"
          ><code>import {{ '{' }} ScreenOrientationService {{ '}' }} from '{{'@angular-helpers/browser-web-apis'}}';

    readonly svc = inject(ScreenOrientationService);

    ngOnInit() {{ '{' }}
      const current = this.svc.getSnapshot();
      this.svc.watch().subscribe(o =&gt; {{ '{' }}
        // o.type, o.angle
      {{ '}' }});
    {{ '}' }}</code></pre>
          <p class="text-xs text-base-content/80 mt-2">
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
