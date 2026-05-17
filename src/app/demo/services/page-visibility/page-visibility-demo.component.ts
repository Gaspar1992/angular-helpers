import { Component, OnDestroy, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { PageVisibilityService, injectPageVisibility } from '@angular-helpers/browser-web-apis';
import { CodeBlockComponent } from '../../../docs/shared/code-block/code-block.component';

@Component({
  selector: 'app-page-visibility-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [PageVisibilityService],
  imports: [CodeBlockComponent],
  styleUrls: ['../demo.styles.css'],
  template: `
    <section class="svc-card" aria-labelledby="vis-title">
      <div class="svc-card-head">
        <h2 class="svc-card-title" id="vis-title">
          <span class="text-primary text-2xl">👁️</span> Page Visibility
        </h2>
        <div class="flex gap-2 flex-wrap">
          @if (supported) {
            <span class="badge badge-success font-black">supported</span>
          } @else {
            <span class="badge badge-error font-black">unsupported</span>
          }
          <span class="badge badge-info font-black">{{ apiMode() }}</span>
        </div>
      </div>

      <p class="svc-desc">
        Tracks whether this tab is visible or hidden. Switch to another tab and watch the state
        change in real-time.
      </p>

      <div class="svc-controls mb-8">
        <div class="segmented" role="group" aria-label="API mode">
          <button
            class="btn btn-sm font-black"
            [class.active]="apiMode() === 'Service'"
            (click)="setMode('Service')"
          >
            Service
          </button>
          <button
            class="btn btn-sm font-black"
            [class.active]="apiMode() === 'Signal Fn'"
            (click)="setMode('Signal Fn')"
          >
            Signal Fn
          </button>
        </div>
      </div>

      <div class="svc-result">
        @if (apiMode() === 'Service') {
          <div class="kv-row">
            <span class="kv-key">Visibility State</span>
            <span class="kv-val">
              @if (visibilityState() === 'visible') {
                <span class="badge badge-success font-black">{{ visibilityState() }}</span>
              } @else {
                <span class="badge badge-ghost font-black opacity-50">{{ visibilityState() }}</span>
              }
            </span>
          </div>
          <div class="kv-row">
            <span class="kv-key">Is Page Visible?</span>
            <span class="kv-val text-primary">{{ pageVisible() ? 'YES' : 'NO' }}</span>
          </div>
        } @else {
          <div class="kv-row">
            <span class="kv-key">Signal State</span>
            <span class="kv-val">
              @if (fnRef.state() === 'visible') {
                <span class="badge badge-success font-black">{{ fnRef.state() }}</span>
              } @else {
                <span class="badge badge-ghost font-black opacity-50">{{ fnRef.state() }}</span>
              }
            </span>
          </div>
          <div class="kv-row">
            <span class="kv-key">isVisible()</span>
            <span class="kv-val text-primary">{{ fnRef.isVisible() ? 'YES' : 'NO' }}</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">isHidden()</span>
            <span class="kv-val text-secondary">{{ fnRef.isHidden() ? 'YES' : 'NO' }}</span>
          </div>
        }
      </div>

      @if (apiMode() === 'Signal Fn') {
        <div class="mt-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-base-content/20 mb-3">
            Reactive State Example
          </p>
          <app-code-block
            code="import { injectPageVisibility } from '@angular-helpers/browser-web-apis';

readonly visibility = injectPageVisibility();

// Reactive signals:
// visibility.isVisible()
// visibility.state() // 'visible' | 'hidden'"
          />
          <p class="text-xs text-base-content/40 mt-4 font-medium leading-relaxed">
            <strong class="text-base-content">Best for:</strong> UI states, pausing animations or
            auto-refresh loops when the user leaves the tab.
          </p>
        </div>
      } @else {
        <div class="mt-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-base-content/20 mb-3">
            Service Implementation
          </p>
          <app-code-block
            code="import { PageVisibilityService } from '@angular-helpers/browser-web-apis';

readonly svc = inject(PageVisibilityService);

this.svc.watch().subscribe(state => {
  console.log('Visibility changed:', state);
});"
          />
          <p class="text-xs text-base-content/40 mt-4 font-medium leading-relaxed">
            <strong class="text-base-content">Best for:</strong> Side effects that need to trigger
            outside of the template, global logging, or legacy RxJS architectures.
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
