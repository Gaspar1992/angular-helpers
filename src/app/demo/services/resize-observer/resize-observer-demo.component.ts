import {
  Component,
  OnDestroy,
  ChangeDetectionStrategy,
  inject,
  signal,
  viewChild,
  ElementRef,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { DecimalPipe } from '@angular/common';
import {
  ResizeObserverService,
  injectResizeObserver,
  type ElementSize,
} from '@angular-helpers/browser-web-apis';

@Component({
  selector: 'app-resize-observer-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ResizeObserverService],
  imports: [DecimalPipe],
  template: `
    <section
      class="bg-base-200 border border-base-300 rounded-xl p-5 sm:p-6 mb-5"
      aria-labelledby="resize-title"
    >
      <div class="flex items-center justify-between gap-3 flex-wrap mb-3">
        <h2 class="text-lg sm:text-xl font-bold text-base-content m-0" id="resize-title">
          Resize Observer
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
        Observes element size changes. Drag the handle to resize the box below.
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
      </div>

      <div
        class="resize overflow-auto bg-base-300 border-2 border-dashed border-base-300 rounded-lg p-4 mb-4 min-h-[120px] min-w-[200px] max-w-full"
        #resizeBox
        aria-label="Resizable demo box"
        [class.ring-2]="apiMode() === 'Signal Fn'"
        [class.ring-primary]="apiMode() === 'Signal Fn'"
      >
        <span class="text-sm text-base-content/80 select-none">Resize me →</span>
      </div>

      @if (apiMode() === 'Service' && elementSize(); as size) {
        <div class="bg-base-300 border border-base-300 rounded-lg p-4">
          <div
            class="flex items-center justify-between py-2 border-b border-base-300 last:border-b-0"
          >
            <span class="text-sm text-base-content/80 font-medium">Width</span>
            <span class="text-sm text-base-content font-semibold font-mono"
              >{{ size.width | number: '1.0-0' }} px</span
            >
          </div>
          <div
            class="flex items-center justify-between py-2 border-b border-base-300 last:border-b-0"
          >
            <span class="text-sm text-base-content/80 font-medium">Height</span>
            <span class="text-sm text-base-content font-semibold font-mono"
              >{{ size.height | number: '1.0-0' }} px</span
            >
          </div>
        </div>
      }

      @if (apiMode() === 'Signal Fn') {
        <div class="bg-base-300 border border-base-300 rounded-lg p-4">
          <div
            class="flex items-center justify-between py-2 border-b border-base-300 last:border-b-0"
          >
            <span class="text-sm text-base-content/80 font-medium">width</span>
            <span class="text-sm text-base-content font-semibold font-mono"
              >{{ fnRef.width() | number: '1.0-0' }} px</span
            >
          </div>
          <div
            class="flex items-center justify-between py-2 border-b border-base-300 last:border-b-0"
          >
            <span class="text-sm text-base-content/80 font-medium">height</span>
            <span class="text-sm text-base-content font-semibold font-mono"
              >{{ fnRef.height() | number: '1.0-0' }} px</span
            >
          </div>
          <div
            class="flex items-center justify-between py-2 border-b border-base-300 last:border-b-0"
          >
            <span class="text-sm text-base-content/80 font-medium">inlineSize</span>
            <span class="text-sm text-base-content font-semibold font-mono">{{
              fnRef.inlineSize() | number: '1.0-0'
            }}</span>
          </div>
          <div
            class="flex items-center justify-between py-2 border-b border-base-300 last:border-b-0"
          >
            <span class="text-sm text-base-content/80 font-medium">blockSize</span>
            <span class="text-sm text-base-content font-semibold font-mono">{{
              fnRef.blockSize() | number: '1.0-0'
            }}</span>
          </div>
        </div>
      }

      @if (apiMode() === 'Signal Fn') {
        <div class="mt-4">
          <p class="text-xs text-base-content/80 mb-2">
            Auto-observing element with reactive size signals:
          </p>
          <pre
            class="bg-base-300 border border-base-300 rounded-lg p-3 overflow-x-auto font-mono text-sm text-base-content"
          ><code>import {{ '{' }} injectResizeObserver {{ '}' }} from '{{'@angular-helpers/browser-web-apis'}}';

    readonly boxRef = viewChild&lt;ElementRef&gt;('box');
    readonly resize = injectResizeObserver(this.boxRef);

    // Direct access in template:
    // resize.width(), resize.height()
    // resize.inlineSize, resize.blockSize (logical pixels)</code></pre>
          <p class="text-xs text-base-content/80 mt-2">
            <strong>When to use:</strong> Responsive layouts, dynamic charts, scroll containers.
          </p>
        </div>
      } @else {
        <div class="mt-4">
          <p class="text-xs text-base-content/80 mb-2">
            Manual observation with explicit subscribe:
          </p>
          <pre
            class="bg-base-300 border border-base-300 rounded-lg p-3 overflow-x-auto font-mono text-sm text-base-content"
          ><code>import {{ '{' }} ResizeObserverService {{ '}' }} from '{{'@angular-helpers/browser-web-apis'}}';

    readonly svc = inject(ResizeObserverService);

    ngOnInit() {{ '{' }}
      const el = this.elementRef.nativeElement;
      this.svc.observeSize(el).subscribe(size =&gt; {{ '{' }}
        // size: {{ '{' }} width, height, inlineSize, blockSize {{ '}' }}
      {{ '}' }});
    {{ '}' }}</code></pre>
          <p class="text-xs text-base-content/80 mt-2">
            <strong>When to use:</strong> Complex resize logic, multiple observers, RxJS operators.
          </p>
        </div>
      }
    </section>
  `,
})
export class ResizeObserverDemoComponent implements OnDestroy {
  private readonly svc = inject(ResizeObserverService);
  private readonly subs: Subscription[] = [];

  readonly supported = this.svc.isSupported();
  readonly resizeBoxRef = viewChild<ElementRef>('resizeBox');
  readonly elementSize = signal<ElementSize | null>(null);
  readonly observing = signal(false);
  readonly apiMode = signal<'Service' | 'Signal Fn'>('Service');
  readonly fnRef = injectResizeObserver(this.resizeBoxRef);

  setMode(mode: 'Service' | 'Signal Fn'): void {
    this.apiMode.set(mode);
  }

  attach(): void {
    const el = this.resizeBoxRef()?.nativeElement as Element | undefined;
    if (!el || !this.supported) return;
    this.subs.push(this.svc.observeSize(el).subscribe((s) => this.elementSize.set(s)));
    this.observing.set(true);
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }
}
