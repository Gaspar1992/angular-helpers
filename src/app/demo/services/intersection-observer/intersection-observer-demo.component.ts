import {
  Component,
  OnDestroy,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  inject,
  signal,
  viewChild,
  ElementRef,
} from '@angular/core';
import { Subscription } from 'rxjs';
import {
  IntersectionObserverService,
  injectIntersectionObserver,
} from '@angular-helpers/browser-web-apis';

@Component({
  selector: 'app-intersection-observer-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [IntersectionObserverService],
  template: `
    <section
      class="bg-base-200 border border-base-300 rounded-xl p-5 sm:p-6 mb-5"
      aria-labelledby="inter-title"
    >
      <div class="flex items-center justify-between gap-3 flex-wrap mb-3">
        <h2 class="text-lg sm:text-xl font-bold text-base-content m-0" id="inter-title">
          Intersection Observer
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
        Fires when an element enters or exits the viewport. Scroll down to trigger it.
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
        @if (apiMode() === 'Service') {
          <button
            class="btn btn-primary btn-sm"
            (click)="attach()"
            [disabled]="observing() || !supported"
          >
            {{ observing() ? 'Observing…' : 'Attach observer' }}
          </button>
        }
        @if (apiMode() === 'Signal Fn') {
          @if (fnRef.isIntersecting()) {
            <span class="badge badge-success badge-sm">In viewport</span>
          } @else {
            <span class="badge badge-ghost badge-sm">Out of viewport</span>
          }
        } @else {
          @if (isIntersecting()) {
            <span class="badge badge-success badge-sm">In viewport</span>
          } @else {
            <span class="badge badge-ghost badge-sm">Out of viewport</span>
          }
        }
      </div>

      <div
        class="h-48 overflow-y-auto bg-base-300 border border-base-300 rounded-lg p-4"
        #intersectScroll
        aria-label="Scrollable area with target"
      >
        <p class="text-xs text-base-content/80 mb-2">↓ Scroll inside this box to trigger</p>
        <div class="h-32"></div>
        <div
          class="bg-primary/20 border-2 border-primary rounded p-4 text-center text-primary"
          #intersectBox
          aria-label="Intersection target"
        >
          Target element
        </div>
        <div class="h-32"></div>
      </div>

      @if (apiMode() === 'Signal Fn') {
        <div class="mt-4">
          <p class="text-xs text-base-content/80 mb-2">
            Reactive viewport detection with auto-cleanup:
          </p>
          <pre
            class="bg-base-300 border border-base-300 rounded-lg p-3 overflow-x-auto font-mono text-sm text-base-content"
          ><code>import {{ '{' }} injectIntersectionObserver {{ '}' }} from '{{'@angular-helpers/browser-web-apis'}}';

    readonly targetRef = viewChild&lt;ElementRef&gt;('target');
    readonly inView = injectIntersectionObserver(this.targetRef);

    // Use in template with: inView.isIntersecting()
    // or: inView.isVisible() for visibility tracking</code></pre>
          <p class="text-xs text-base-content/80 mt-2">
            <strong>When to use:</strong> Lazy loading, infinite scroll, analytics tracking.
          </p>
        </div>
      } @else {
        <div class="mt-4">
          <p class="text-xs text-base-content/80 mb-2">Manual visibility observation with RxJS:</p>
          <pre
            class="bg-base-300 border border-base-300 rounded-lg p-3 overflow-x-auto font-mono text-sm text-base-content"
          ><code>import {{ '{' }} IntersectionObserverService {{ '}' }} from '{{'@angular-helpers/browser-web-apis'}}';

    readonly svc = inject(IntersectionObserverService);

    ngOnInit() {{ '{' }}
      this.svc.observeVisibility(element, {{ '{' }} threshold: 0.5 {{ '}' }})
        .subscribe(isVisible =&gt; {{ '{' }}
          // handle visibility change
        {{ '}' }});
    {{ '}' }}</code></pre>
          <p class="text-xs text-base-content/80 mt-2">
            <strong>When to use:</strong> Complex thresholds, multiple observers, combineLatest.
          </p>
        </div>
      }
    </section>
  `,
})
export class IntersectionObserverDemoComponent implements OnDestroy {
  private readonly svc = inject(IntersectionObserverService);
  private readonly subs: Subscription[] = [];

  readonly supported = this.svc.isSupported();
  readonly intersectBoxRef = viewChild<ElementRef>('intersectBox');
  readonly intersectScrollRef = viewChild<ElementRef>('intersectScroll');
  readonly isIntersecting = signal(false);
  readonly observing = signal(false);
  readonly apiMode = signal<'Service' | 'Signal Fn'>('Service');
  readonly fnRef = injectIntersectionObserver(this.intersectBoxRef, { threshold: 0.1 });

  setMode(mode: 'Service' | 'Signal Fn'): void {
    this.apiMode.set(mode);
  }

  attach(): void {
    const el = this.intersectBoxRef()?.nativeElement as Element | undefined;
    const root = this.intersectScrollRef()?.nativeElement as Element | undefined;
    if (!el || !this.supported) return;
    this.subs.push(
      this.svc
        .observeVisibility(el, { root: root ?? null, threshold: 0.1 })
        .subscribe((v) => this.isIntersecting.set(v)),
    );
    this.observing.set(true);
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }
}
