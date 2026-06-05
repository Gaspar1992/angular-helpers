import { Component, OnDestroy, inject, signal, viewChild, ElementRef } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  IntersectionObserverService,
  injectIntersectionObserver,
} from '@angular-helpers/browser-web-apis';
import { CodeBlockComponent } from '../../../docs/shared/code-block/code-block.component';

@Component({
  selector: 'app-intersection-observer-demo',
  providers: [IntersectionObserverService],
  imports: [CodeBlockComponent],
  styleUrls: ['../demo.styles.css'],
  template: `
    <section class="svc-card" aria-labelledby="inter-title">
      <div class="svc-card-head">
        <h2 class="svc-card-title" id="inter-title">
          <span class="text-primary text-2xl">👁️‍🗨️</span> Intersection Observer
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
        Detect when elements enter or leave the viewport. Essential for lazy loading and
        scroll-triggered animations.
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
        @if (apiMode() === 'Service') {
          <button
            class="btn btn-primary btn-sm font-black"
            (click)="attach()"
            [disabled]="observing() || !supported"
          >
            {{ observing() ? 'Observing…' : 'Attach Observer' }}
          </button>
        }
        <div
          class="flex items-center gap-2 px-4 py-2 rounded-xl bg-base-content/5 border border-base-content/5 shadow-inner"
        >
          <span class="text-[10px] font-black uppercase tracking-widest text-base-content/30"
            >Viewport</span
          >
          @if (apiMode() === 'Signal Fn' ? fnRef.isIntersecting() : isIntersecting()) {
            <span class="badge badge-success font-black">VISIBLE</span>
          } @else {
            <span class="badge badge-ghost font-black opacity-30">HIDDEN</span>
          }
        </div>
      </div>

      <div
        class="h-48 overflow-y-auto bg-base-content/5 border border-base-content/5 rounded-2xl p-6 mb-8 shadow-inner no-scrollbar"
        #intersectScroll
        aria-label="Scrollable area"
      >
        <p
          class="text-[10px] font-black uppercase tracking-widest text-base-content/20 mb-4 flex items-center gap-2"
        >
          <span class="animate-bounce">↓</span> Scroll down inside this box
        </p>
        <div class="h-48"></div>
        <div
          class="bg-primary/10 border-2 border-primary border-dashed rounded-2xl p-8 text-center text-primary font-black uppercase tracking-tighter transition-all duration-500"
          [class.bg-primary/20]="
            apiMode() === 'Signal Fn' ? fnRef.isIntersecting() : isIntersecting()
          "
          [class.scale-105]="apiMode() === 'Signal Fn' ? fnRef.isIntersecting() : isIntersecting()"
          #intersectBox
        >
          Target Element
        </div>
        <div class="h-48"></div>
      </div>

      <div class="svc-result">
        @if (apiMode() === 'Signal Fn') {
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-base-content/20 mb-3">
            Composition Utility
          </p>
          <app-code-block
            code="import { injectIntersectionObserver } from '@angular-helpers/browser-web-apis';

readonly targetRef = viewChild&lt;ElementRef&gt;('target');
readonly inView = injectIntersectionObserver(this.targetRef);

// Simple signal boolean:
// inView.isIntersecting()"
          />
        } @else {
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-base-content/20 mb-3">
            Service Subscription
          </p>
          <app-code-block
            code="import { IntersectionObserverService } from '@angular-helpers/browser-web-apis';

readonly svc = inject(IntersectionObserverService);

this.svc.observeVisibility(element, { threshold: 0.5 })
  .subscribe(isVisible => { ... });"
          />
        }
      </div>
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
