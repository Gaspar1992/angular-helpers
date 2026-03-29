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
  type IntersectionRef,
} from '@angular-helpers/browser-web-apis';

@Component({
  selector: 'app-intersection-observer-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [IntersectionObserverService],
  styleUrl: '../demo.styles.css',
  template: `
    <section class="svc-card" aria-labelledby="inter-title">
      <div class="svc-card-head">
        <h2 class="svc-card-title" id="inter-title">Intersection Observer</h2>
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
        Fires when an element enters or exits the viewport. Scroll down to trigger it.
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
        @if (apiMode() === 'Service') {
          <button class="btn btn-primary" (click)="attach()" [disabled]="observing() || !supported">
            {{ observing() ? 'Observing…' : 'Attach observer' }}
          </button>
        }
        @if (apiMode() === 'Signal Fn') {
          <span class="badge" [class]="fnRef.isIntersecting() ? 'badge-ok' : 'badge-no'">
            {{ fnRef.isIntersecting() ? 'In viewport' : 'Out of viewport' }}
          </span>
        } @else {
          <span class="badge" [class]="isIntersecting() ? 'badge-ok' : 'badge-no'">
            {{ isIntersecting() ? 'In viewport' : 'Out of viewport' }}
          </span>
        }
      </div>

      <div class="intersect-scroll-area" #intersectScroll aria-label="Scrollable area with target">
        <p class="svc-hint">↓ Scroll inside this box to trigger</p>
        <div class="intersect-spacer"></div>
        <div class="intersect-target" #intersectBox aria-label="Intersection target">
          Target element
        </div>
      </div>
    </section>
  `,
})
export class IntersectionObserverDemoComponent implements OnDestroy {
  private readonly svc = inject(IntersectionObserverService);
  private readonly subs: Subscription[] = [];
  readonly fnRef: IntersectionRef;

  readonly supported = this.svc.isSupported();
  readonly intersectBoxRef = viewChild<ElementRef>('intersectBox');
  readonly intersectScrollRef = viewChild<ElementRef>('intersectScroll');
  readonly isIntersecting = signal(false);
  readonly observing = signal(false);
  readonly apiMode = signal<'Service' | 'Signal Fn'>('Service');

  constructor() {
    const el = this.intersectBoxRef();
    const root = this.intersectScrollRef();
    if (el && root) {
      this.fnRef = injectIntersectionObserver(el, { root: root.nativeElement, threshold: 0.1 });
    } else {
      this.fnRef = {
        isIntersecting: signal(false).asReadonly(),
        isVisible: signal(false).asReadonly(),
      };
    }
  }

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
