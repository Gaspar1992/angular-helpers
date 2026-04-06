import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  inject,
  signal,
} from '@angular/core';
import { InputSanitizerService } from '@angular-helpers/security';

@Component({
  selector: 'app-input-sanitizer-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: '../demo.styles.css',
  template: `
    <section class="svc-card" aria-labelledby="sanitizer-title">
      <div class="svc-card-head">
        <h2 class="svc-card-title" id="sanitizer-title">InputSanitizer Service</h2>
        <div class="svc-badges">
          <span class="badge badge-ok">xss-safe</span>
          <span class="badge badge-secure">html escape</span>
        </div>
      </div>
      <p class="svc-desc">
        Sanitize user input to prevent XSS attacks: strip dangerous HTML, validate URLs, escape content.
      </p>

      <div class="svc-controls svc-controls--col">
        <label for="html-input" class="demo-label">HTML Input</label>
        <input
          id="html-input"
          class="demo-input"
          [value]="htmlInput()"
          (input)="htmlInput.set($any($event.target).value)"
          placeholder="<b>Bold</b><script>alert(1)</script>"
        />

        <label for="url-input" class="demo-label">URL Input</label>
        <input
          id="url-input"
          class="demo-input"
          [value]="urlInput()"
          (input)="urlInput.set($any($event.target).value)"
          placeholder="https://example.com or javascript:alert(1)"
        />
      </div>

      <div class="svc-controls">
        <button class="btn btn-primary" (click)="sanitizeHtml()">Sanitize HTML</button>
        <button class="btn btn-secondary" (click)="escapeHtml()">Escape HTML</button>
        <button class="btn btn-secondary" (click)="sanitizeUrl()">Validate URL</button>
      </div>

      @if (sanitizedHtml()) {
        <div class="svc-result">
          <div class="kv-row">
            <span class="kv-key">Result</span>
            <span class="kv-val mono">{{ sanitizedHtml() }}</span>
          </div>
        </div>
      }

      @if (sanitizedUrl() !== null) {
        <div class="svc-result">
          <div class="kv-row">
            <span class="kv-key">URL Validation</span>
            <span class="kv-val mono">{{ sanitizedUrl() ?? '❌ Rejected' }}</span>
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
