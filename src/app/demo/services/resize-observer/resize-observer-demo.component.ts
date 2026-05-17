import {
  Component,
  OnDestroy,
  ChangeDetectionStrategy,
  inject,
  signal,
  viewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ResizeObserverService, injectResizeObserver } from '@angular-helpers/browser-web-apis';
import { CodeBlockComponent } from '../../../docs/shared/code-block/code-block.component';

@Component({
  selector: 'app-resize-observer-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ResizeObserverService],
  imports: [CommonModule, CodeBlockComponent, FormsModule, DecimalPipe],
  styleUrls: ['../demo.styles.css'],
  template: `
    <section class="svc-card" aria-labelledby="resize-title">
      <div class="svc-card-head">
        <h2 class="svc-card-title" id="resize-title">
          <span class="text-accent text-2xl">📏</span> Resize Observer
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
        Track dimensions of any element. Useful for dynamic layouts that don't depend on the window
        size.
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
      </div>

      <div class="space-y-6">
        <div
          class="relative bg-base-content/5 border border-base-content/5 rounded-[2rem] p-8 shadow-inner overflow-hidden flex items-center justify-center"
        >
          <div
            class="bg-accent/10 border-2 border-accent border-dashed rounded-2xl flex items-center justify-center transition-all duration-300 min-w-[100px] min-h-[60px]"
            #resizeBox
            [style.width.%]="boxWidth()"
            [style.height.px]="100"
          >
            <span class="text-accent font-black text-xs uppercase tracking-widest">Target</span>
          </div>

          <div class="absolute bottom-4 right-4 flex items-center gap-3">
            <span class="text-[10px] font-black text-base-content/20 uppercase tracking-widest"
              >Resize Demo</span
            >
            <input
              type="range"
              min="30"
              max="100"
              [ngModel]="boxWidth()"
              (ngModelChange)="boxWidth.set($event)"
              class="range range-accent range-xs w-32"
            />
          </div>
        </div>

        <div class="svc-result">
          @if (apiMode() === 'Service') {
            <div class="kv-row">
              <span class="kv-key">Measured Width</span>
              <span class="kv-val text-accent">{{ width() | number: '1.0-0' }}px</span>
            </div>
            <div class="kv-row">
              <span class="kv-key">Measured Height</span>
              <span class="kv-val text-accent">{{ height() | number: '1.0-0' }}px</span>
            </div>
          } @else {
            <div class="kv-row">
              <span class="kv-key">width() signal</span>
              <span class="kv-val text-accent">{{ fnRef.width() | number: '1.0-0' }}px</span>
            </div>
            <div class="kv-row">
              <span class="kv-key">height() signal</span>
              <span class="kv-val text-accent">{{ fnRef.height() | number: '1.0-0' }}px</span>
            </div>
          }
        </div>
      </div>

      @if (apiMode() === 'Signal Fn') {
        <div class="mt-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-base-content/20 mb-3">
            Signal-based Observation
          </p>
          <app-code-block
            code="import { injectResizeObserver } from '@angular-helpers/browser-web-apis';

readonly boxRef = viewChild&lt;ElementRef&gt;('box');
readonly size = injectResizeObserver(this.boxRef);

// Reactive width/height:
// size.width(), size.height()"
          />
        </div>
      } @else {
        <div class="mt-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-base-content/20 mb-3">
            Service implementation
          </p>
          <app-code-block
            code="import { ResizeObserverService } from '@angular-helpers/browser-web-apis';

readonly svc = inject(ResizeObserverService);

this.svc.observe(element).subscribe(entry => {
  const { width, height } = entry[0].contentRect;
  // handle resize
});"
          />
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
  readonly width = signal(0);
  readonly height = signal(0);
  readonly boxWidth = signal(60);
  readonly observing = signal(false);
  readonly apiMode = signal<'Service' | 'Signal Fn'>('Service');

  readonly fnRef = injectResizeObserver(this.resizeBoxRef);

  setMode(mode: 'Service' | 'Signal Fn'): void {
    this.apiMode.set(mode);
  }

  attach(): void {
    const el = this.resizeBoxRef()?.nativeElement as Element | undefined;
    if (!el || !this.supported) return;
    this.subs.push(
      this.svc.observe(el).subscribe((entry) => {
        if (entry[0]) {
          this.width.set(entry[0].contentRect.width);
          this.height.set(entry[0].contentRect.height);
        }
      }),
    );
    this.observing.set(true);
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }
}
