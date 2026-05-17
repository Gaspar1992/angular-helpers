import { Component, ChangeDetectionStrategy, signal } from '@angular/core';

@Component({
  selector: 'app-clipboard-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['../demo.styles.css'],
  template: `
    <section class="svc-card" aria-labelledby="clip-title">
      <div class="svc-card-head">
        <h2 class="svc-card-title" id="clip-title">
          <span class="text-primary text-2xl">📋</span> Clipboard API
        </h2>
        <div class="flex gap-2 flex-wrap">
          @if (supported) {
            <span class="badge badge-success font-black">supported</span>
          } @else {
            <span class="badge badge-error font-black">unsupported</span>
          }
          <span class="badge badge-info font-black">secure context</span>
        </div>
      </div>
      <p class="svc-desc">
        Securely interact with the system clipboard using asynchronous operations.
      </p>

      <div class="svc-controls">
        <button class="btn btn-primary font-black" (click)="copy()" [disabled]="!supported">
          Copy Timestamp
        </button>
        <button class="btn btn-secondary font-black" (click)="paste()" [disabled]="!supported">
          Read Clipboard
        </button>
      </div>

      @if (clipboardText()) {
        <div class="svc-result animate-in slide-in-from-bottom-2 duration-300">
          <span
            class="text-[10px] font-black uppercase tracking-[0.2em] text-base-content/20 mb-3 block"
          >
            Buffer Content
          </span>
          <div class="mono-block font-black text-primary italic" aria-live="polite">
            "{{ clipboardText() }}"
          </div>
        </div>
      }
    </section>
  `,
})
export class ClipboardDemoComponent {
  readonly supported = typeof navigator !== 'undefined' && 'clipboard' in navigator;
  readonly clipboardText = signal('');

  async copy(): Promise<void> {
    const text = `Angular Helpers — Copied at ${new Date().toLocaleTimeString()}`;
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
