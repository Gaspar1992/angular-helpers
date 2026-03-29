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
import { ResizeObserverService, type ElementSize } from '@angular-helpers/browser-web-apis';

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
        </div>
      </div>
      <p class="svc-desc">Observes element size changes. Drag the handle to resize the box below.</p>
      <div class="svc-controls">
        <button class="btn btn-primary" (click)="attach()" [disabled]="observing() || !supported">
          {{ observing() ? 'Observing…' : 'Attach observer' }}
        </button>
      </div>
      <div class="resize-demo-box" #resizeBox aria-label="Resizable demo box">
        <span class="resize-demo-label">Resize me →</span>
      </div>
      @if (elementSize()) {
        <div class="svc-result">
          <div class="kv-row">
            <span class="kv-key">Width</span>
            <span class="kv-val mono">{{ elementSize()!.width | number: '1.0-0' }} px</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">Height</span>
            <span class="kv-val mono">{{ elementSize()!.height | number: '1.0-0' }} px</span>
          </div>
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
