import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { InputSanitizerService } from '@angular-helpers/security';

@Component({
  selector: 'app-input-sanitizer-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [InputSanitizerService],
  template: `
    <section class="svc-card" aria-labelledby="sanitizer-title">
      <div class="svc-card-head">
        <h2 class="svc-card-title" id="sanitizer-title">InputSanitizer Service</h2>
        <div class="flex gap-2 flex-wrap">
          <span class="badge badge-success">xss-safe</span>
          <span class="badge badge-info">html escape</span>
        </div>
      </div>
      <p class="text-sm text-base-content/70 mb-4 leading-relaxed">
        Sanitize user input to prevent XSS attacks: strip dangerous HTML, validate URLs, escape
        content.
      </p>

      <div class="flex flex-col gap-3 mb-4">
        <div class="flex flex-col gap-1">
          <label for="html-input" class="text-xs font-bold uppercase opacity-50 ml-1"
            >HTML Input</label
          >
          <input
            id="html-input"
            class="demo-input font-mono text-xs"
            [value]="htmlInput()"
            (input)="htmlInput.set($any($event.target).value)"
            placeholder="<b>Bold</b><script>alert(1)</script>"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label for="url-input" class="text-xs font-bold uppercase opacity-50 ml-1"
            >URL Input</label
          >
          <input
            id="url-input"
            class="demo-input"
            [value]="urlInput()"
            (input)="urlInput.set($any($event.target).value)"
            placeholder="https://example.com or javascript:alert(1)"
          />
        </div>
      </div>

      <div class="svc-controls">
        <button class="btn btn-primary btn-sm font-bold" (click)="sanitizeHtml()">
          Sanitize HTML
        </button>
        <button class="btn btn-secondary btn-sm font-bold" (click)="escapeHtml()">
          Escape HTML
        </button>
        <button class="btn btn-secondary btn-sm font-bold" (click)="sanitizeUrl()">
          Validate URL
        </button>
      </div>

      @if (sanitizedHtml()) {
        <div class="svc-result mt-4">
          <div class="kv-row">
            <span class="text-sm text-base-content/60 font-medium">Result</span>
            <span class="text-sm text-base-content font-semibold font-mono break-all">{{
              sanitizedHtml()
            }}</span>
          </div>
        </div>
      }

      @if (sanitizedUrl() !== null) {
        <div class="svc-result mt-4">
          <div class="kv-row">
            <span class="text-sm text-base-content/60 font-medium">URL Validation</span>
            <span class="text-sm text-base-content font-semibold font-mono">{{
              sanitizedUrl() ?? '❌ Rejected'
            }}</span>
          </div>
        </div>
      }
    </section>
  `,
})
export class InputSanitizerDemoComponent {
  private readonly inputSanitizer = inject(InputSanitizerService);

  readonly htmlInput = signal<string>('<b>Bold</b><script>alert(1)</script>');
  readonly sanitizedHtml = signal<string>('');
  readonly urlInput = signal<string>('https://example.com');
  readonly sanitizedUrl = signal<string | null>(null);

  sanitizeHtml(): void {
    const result = this.inputSanitizer.sanitizeHtml(this.htmlInput());
    this.sanitizedHtml.set(result);
    this.sanitizedUrl.set(null);
  }

  escapeHtml(): void {
    const result = this.inputSanitizer.escapeHtml(this.htmlInput());
    this.sanitizedHtml.set(result);
    this.sanitizedUrl.set(null);
  }

  sanitizeUrl(): void {
    const result = this.inputSanitizer.sanitizeUrl(this.urlInput());
    this.sanitizedUrl.set(result);
    this.sanitizedHtml.set('');
  }
}
