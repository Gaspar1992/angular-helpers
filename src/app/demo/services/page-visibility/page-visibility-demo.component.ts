import {
  Component,
  OnDestroy,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { PageVisibilityService, injectPageVisibility } from '@angular-helpers/browser-web-apis';

@Component({
  selector: 'app-page-visibility-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [PageVisibilityService],
  template: `
    <section
      class="bg-base-200 border border-base-300 rounded-xl p-5 sm:p-6 mb-5"
      aria-labelledby="vis-title"
    >
      <div class="flex items-center justify-between gap-3 flex-wrap mb-3">
        <h2 class="text-lg sm:text-xl font-bold text-base-content m-0" id="vis-title">
          Page Visibility
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

      <p class="text-sm text-base-content/70 mb-4 leading-relaxed">
        Tracks whether this tab is visible or hidden. Switch to another tab and watch the state
        change.
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
            <span class="text-sm text-base-content/70 font-medium">State</span>
            <span class="text-sm text-base-content font-semibold">
              @if (visibilityState() === 'visible') {
                <span class="badge badge-success badge-sm">{{ visibilityState() }}</span>
              } @else {
                <span class="badge badge-ghost badge-sm">{{ visibilityState() }}</span>
              }
            </span>
          </div>
          <div
            class="flex items-center justify-between py-2 border-b border-base-300 last:border-b-0"
          >
            <span class="text-sm text-base-content/70 font-medium">Visible</span>
            <span class="text-sm text-base-content font-semibold">{{
              pageVisible() ? 'yes' : 'no'
            }}</span>
          </div>
        } @else {
          <div
            class="flex items-center justify-between py-2 border-b border-base-300 last:border-b-0"
          >
            <span class="text-sm text-base-content/70 font-medium">State</span>
            <span class="text-sm text-base-content font-semibold">
              @if (fnRef.state() === 'visible') {
                <span class="badge badge-success badge-sm">{{ fnRef.state() }}</span>
              } @else {
                <span class="badge badge-ghost badge-sm">{{ fnRef.state() }}</span>
              }
            </span>
          </div>
          <div
            class="flex items-center justify-between py-2 border-b border-base-300 last:border-b-0"
          >
            <span class="text-sm text-base-content/70 font-medium">isVisible</span>
            <span class="text-sm text-base-content font-semibold">{{
              fnRef.isVisible() ? 'yes' : 'no'
            }}</span>
          </div>
          <div
            class="flex items-center justify-between py-2 border-b border-base-300 last:border-b-0"
          >
            <span class="text-sm text-base-content/70 font-medium">isHidden</span>
            <span class="text-sm text-base-content font-semibold">{{
              fnRef.isHidden() ? 'yes' : 'no'
            }}</span>
          </div>
        }
      </div>

      @if (apiMode() === 'Signal Fn') {
        <div class="mt-4">
          <p class="text-xs text-base-content/60 mb-2">
            Zero-boilerplate reactive state - auto-cleanup on destroy:
          </p>
          <pre
            class="bg-base-300 border border-base-300 rounded-lg p-3 overflow-x-auto font-mono text-sm text-base-content"
          ><code>import {{ '{' }} injectPageVisibility {{ '}' }} from '{{'@angular-helpers/browser-web-apis'}}';

    readonly visibility = injectPageVisibility();

    // Direct signal access in template:
    // visibility.isVisible() or visibility.isHidden()
    // visibility.state() for raw value ('visible' | 'hidden')</code></pre>
          <p class="text-xs text-base-content/60 mt-2">
            <strong>When to use:</strong> Simple reactive read-only state, templates, computed
            signals.
          </p>
        </div>
      } @else {
        <div class="mt-4">
          <p class="text-xs text-base-content/60 mb-2">
            Manual subscription with explicit cleanup:
          </p>
          <pre
            class="bg-base-300 border border-base-300 rounded-lg p-3 overflow-x-auto font-mono text-sm text-base-content"
          ><code>import {{ '{' }} PageVisibilityService {{ '}' }} from '{{'@angular-helpers/browser-web-apis'}}';

    readonly svc = inject(PageVisibilityService);

    ngOnInit() {{ '{' }}
      this.svc.watch().subscribe(state =&gt; {{ '{' }}
        // handle visibility change
      {{ '}' }});
    {{ '}' }}</code></pre>
          <p class="text-xs text-base-content/60 mt-2">
            <strong>When to use:</strong> Complex async flows, combining with other streams,
            explicit control.
          </p>
        </div>
      }
    </section>
  `,
})
export class PageVisibilityDemoComponent implements OnDestroy {
  private readonly svc = inject(PageVisibilityService);
  private readonly subs: Subscription[] = [];

  readonly supported = this.svc.isSupported();
  readonly apiMode = signal<'Service' | 'Signal Fn'>('Service');
  readonly pageVisible = signal(true);
  readonly visibilityState = signal<string>('visible');
  readonly fnRef = injectPageVisibility();

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

  setMode(mode: 'Service' | 'Signal Fn'): void {
    this.apiMode.set(mode);
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }
}
