import { Component, ViewEncapsulation, ChangeDetectionStrategy, signal } from '@angular/core';

@Component({
  selector: 'app-clipboard-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: '../demo.styles.css',
  template: `
    <section class="svc-card" aria-labelledby="clip-title">
      <div class="svc-card-head">
        <h2 class="svc-card-title" id="clip-title">Clipboard API</h2>
        <div class="svc-badges">
          @if (supported) {
            <span class="badge badge-ok">supported</span>
          } @else {
            <span class="badge badge-no">unsupported</span>
          }
          <span class="badge badge-secure">secure context</span>
        </div>
      </div>
      <p class="svc-desc">Async read/write to the system clipboard.</p>
      <div class="svc-controls">
        <button class="btn btn-primary" (click)="copy()" [disabled]="!supported">Copy timestamp</button>
        <button class="btn btn-secondary" (click)="paste()" [disabled]="!supported">Paste</button>
      </div>
      @if (clipboardText()) {
        <div class="mono-block" aria-live="polite">{{ clipboardText() }}</div>
      }
    </section>
  `,
})
export class ClipboardDemoComponent {
  readonly supported = typeof navigator !== 'undefined' && 'clipboard' in navigator;
  readonly clipboardText = signal('');

  async copy(): Promise<void> {
    const text = `Copied at ${new Date().toISOString()}`;
    try {
      await navigator.clipboard.writeText(text);
      this.clipboardText.set(text);
    } catch {
      // permission denied
    }
  }

  async paste(): Promise<void> {
    try {
      this.clipboardText.set(await navigator.clipboard.readText());
    } catch {
      // permission denied
    }
  }
}
