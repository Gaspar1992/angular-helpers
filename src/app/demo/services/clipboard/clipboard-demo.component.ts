import { Component, ViewEncapsulation, ChangeDetectionStrategy, signal } from '@angular/core';

@Component({
  selector: 'app-clipboard-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <section
      class="bg-base-200 border border-base-300 rounded-xl p-5 sm:p-6 mb-5"
      aria-labelledby="clip-title"
    >
      <div class="flex items-center justify-between gap-3 flex-wrap mb-3">
        <h2 class="text-lg sm:text-xl font-bold text-base-content m-0" id="clip-title">
          Clipboard API
        </h2>
        <div class="flex gap-2 flex-wrap">
          @if (supported) {
            <span class="badge badge-success badge-sm">supported</span>
          } @else {
            <span class="badge badge-error badge-sm">unsupported</span>
          }
          <span class="badge badge-info badge-sm">secure context</span>
        </div>
      </div>
      <p class="text-sm text-base-content/70 mb-4 leading-relaxed">
        Async read/write to the system clipboard.
      </p>
      <div class="flex flex-wrap gap-2 items-center mb-4">
        <button class="btn btn-primary btn-sm" (click)="copy()" [disabled]="!supported">
          Copy timestamp
        </button>
        <button class="btn btn-secondary btn-sm" (click)="paste()" [disabled]="!supported">
          Paste
        </button>
      </div>
      @if (clipboardText()) {
        <div
          class="bg-base-300 border border-base-300 rounded-lg p-3 font-mono text-sm text-base-content break-all"
          aria-live="polite"
        >
          {{ clipboardText() }}
        </div>
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
