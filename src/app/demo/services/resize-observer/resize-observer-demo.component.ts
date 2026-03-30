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
import { DecimalPipe } from '@angular/common';
import {
  ResizeObserverService,
  injectResizeObserver,
  type ElementSize,
} from '@angular-helpers/browser-web-apis';

@Component({
  selector: 'app-resize-observer-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [ResizeObserverService],
  imports: [DecimalPipe],
  styleUrl: '../demo.styles.css',
  template: `
    <section class="svc-card" aria-labelledby="resize-title">
      <div class="svc-card-head">
        <h2 class="svc-card-title" id="resize-title">Resize Observer</h2>
        <div class="svc-badges">
          @if (supported) {
            <span class="badge badge-ok">supported</span>
          } @else {
            <span class="badge badge-no">unsupported</span>
          }
          <span class="badge badge-info">{{ apiMode() }}</span>
        </div>
      </div>

      <p class="svc-desc">Observes element size changes. Drag the handle to resize the box below.</p>

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
      </div>

      <div
        class="resize-demo-box"
        #resizeBox
        aria-label="Resizable demo box"
        [class.observing-fn]="apiMode() === 'Signal Fn'"
      >
        <span class="resize-demo-label">Resize me →</span>
      </div>

      @if (apiMode() === 'Service' && elementSize(); as size) {
        <div class="svc-result">
          <div class="kv-row">
            <span class="kv-key">Width</span>
            <span class="kv-val mono">{{ size.width | number: '1.0-0' }} px</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">Height</span>
            <span class="kv-val mono">{{ size.height | number: '1.0-0' }} px</span>
          </div>
        </div>
      }

      @if (apiMode() === 'Signal Fn') {
        <div class="svc-result">
          <div class="kv-row">
            <span class="kv-key">width</span>
            <span class="kv-val mono">{{ fnRef.width() | number: '1.0-0' }} px</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">height</span>
            <span class="kv-val mono">{{ fnRef.height() | number: '1.0-0' }} px</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">inlineSize</span>
            <span class="kv-val mono">{{ fnRef.inlineSize() | number: '1.0-0' }}</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">blockSize</span>
            <span class="kv-val mono">{{ fnRef.blockSize() | number: '1.0-0' }}</span>
          </div>
        </div>
      }

      @if (apiMode() === 'Signal Fn') {
        <div class="code-example">
          <p class="svc-hint">Auto-observing element with reactive size signals:</p>
          <pre
            class="code-block"
          ><code>import {{ '{' }} injectResizeObserver {{ '}' }} from '{{'@angular-helpers/browser-web-apis'}}';

    readonly boxRef = viewChild&lt;ElementRef&gt;('box');
    readonly resize = injectResizeObserver(this.boxRef);

    // Direct access in template:
    // resize.width(), resize.height()
    // resize.inlineSize, resize.blockSize (logical pixels)</code></pre>
          <p class="svc-hint">
            <strong>When to use:</strong> Responsive layouts, dynamic charts, scroll containers.
          </p>
        </div>
      } @else {
        <div class="code-example">
          <p class="svc-hint">Manual observation with explicit subscribe:</p>
          <pre
            class="code-block"
          ><code>import {{ '{' }} ResizeObserverService {{ '}' }} from '{{'@angular-helpers/browser-web-apis'}}';

    readonly svc = inject(ResizeObserverService);

    ngOnInit() {{ '{' }}
      const el = this.elementRef.nativeElement;
      this.svc.observeSize(el).subscribe(size =&gt; {{ '{' }}
        // size: {{ '{' }} width, height, inlineSize, blockSize {{ '}' }}
      {{ '}' }});
    {{ '}' }}</code></pre>
          <p class="svc-hint">
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
