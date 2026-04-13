import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { InputSanitizerService } from '@angular-helpers/security';

@Component({
  selector: 'app-input-sanitizer-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [InputSanitizerService],
  template: `
    <section
      class="bg-base-200 border border-base-300 rounded-xl p-5 sm:p-6 mb-5"
      aria-labelledby="sanitizer-title"
    >
      <div class="flex items-center justify-between gap-3 flex-wrap mb-3">
        <h2 class="text-lg sm:text-xl font-bold text-base-content m-0" id="sanitizer-title">
          InputSanitizer Service
        </h2>
        <div class="flex gap-2 flex-wrap">
          <span class="badge badge-success badge-sm">xss-safe</span>
          <span class="badge badge-info badge-sm">html escape</span>
        </div>
      </div>
      <p class="text-sm text-base-content/70 mb-4 leading-relaxed">
        Sanitize user input to prevent XSS attacks: strip dangerous HTML, validate URLs, escape
        content.
      </p>

      <div class="flex flex-col gap-2 mb-4">
        <label for="html-input" class="text-sm font-medium text-base-content/70">HTML Input</label>
        <input
          id="html-input"
          class="input input-sm input-bordered w-full font-mono text-xs"
          [value]="htmlInput()"
          (input)="htmlInput.set($any($event.target).value)"
          placeholder="<b>Bold</b><script>alert(1)</script>"
        />
        <label for="url-input" class="text-sm font-medium text-base-content/70">URL Input</label>
        <input
          id="url-input"
          class="input input-sm input-bordered w-full"
          [value]="urlInput()"
          (input)="urlInput.set($any($event.target).value)"
          placeholder="https://example.com or javascript:alert(1)"
        />
      </div>

      <div class="flex flex-wrap gap-2 mb-4">
        <button class="btn btn-primary btn-sm" (click)="sanitizeHtml()">Sanitize HTML</button>
        <button class="btn btn-secondary btn-sm" (click)="escapeHtml()">Escape HTML</button>
        <button class="btn btn-secondary btn-sm" (click)="sanitizeUrl()">Validate URL</button>
      </div>

      @if (sanitizedHtml()) {
        <div class="bg-base-300 border border-base-300 rounded-lg p-3 mt-3">
          <div class="flex items-center justify-between gap-3 py-2">
            <span class="text-sm text-base-content/60 font-medium">Result</span>
            <span class="text-sm text-base-content font-semibold font-mono break-all">{{
              sanitizedHtml()
            }}</span>
          </div>
        </div>
      }

      @if (sanitizedUrl() !== null) {
        <div class="bg-base-300 border border-base-300 rounded-lg p-3 mt-3">
          <div class="flex items-center justify-between gap-3 py-2">
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
