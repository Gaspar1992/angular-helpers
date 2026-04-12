import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  inject,
  signal,
} from '@angular/core';
import { RegexSecurityService } from '@angular-helpers/security';

@Component({
  selector: 'app-regex-security-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: '../demo.styles.css',
  providers: [RegexSecurityService],
  template: `
    <section class="svc-card" aria-labelledby="regex-title">
      <div class="svc-card-head">
        <h2 class="svc-card-title" id="regex-title">Regex Security Service</h2>
        <div class="svc-badges">
          <span class="badge badge-ok">safe execution</span>
          <span class="badge badge-secure">web worker</span>
        </div>
      </div>
      <p class="svc-desc">
        Test regular expressions safely with ReDoS protection using Web Workers.
      </p>

      <div class="svc-controls svc-controls--col">
        <label for="regex-pattern" class="demo-label">Pattern</label>
        <input
          id="regex-pattern"
          class="demo-input"
          [value]="regexPattern()"
          (input)="regexPattern.set($any($event.target).value)"
          placeholder="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
        />

        <label for="regex-input" class="demo-label">Test Input</label>
        <input
          id="regex-input"
          class="demo-input"
          [value]="regexInput()"
          (input)="regexInput.set($any($event.target).value)"
          placeholder="test@example.com"
        />
      </div>

      <div class="svc-controls">
        <button
          class="btn btn-primary"
          (click)="testRegex()"
          [disabled]="regexStatus() === 'running'"
        >
          @if (regexStatus() === 'running') {
            <span class="spinner"></span>
          }
          Test Regex
        </button>
        <button class="btn btn-secondary" (click)="analyzePattern()">Analyze Pattern</button>
      </div>

      @if (regexResult()) {
        <div
          class="feedback"
          [class.feedback-success]="regexStatus() === 'done' && !regexResult()?.includes('❌')"
          [class.feedback-error]="regexStatus() === 'error' || regexResult()?.includes('❌')"
          [class.feedback-info]="regexStatus() === 'idle'"
        >
          {{ regexResult() }}
          @if (regexTime() > 0) {
            <span class="kv-key"> ({{ regexTime() }}ms)</span>
          }
        </div>
      }
    </section>
  `,
})
export class RegexSecurityDemoComponent {
  private readonly regexSecurity = inject(RegexSecurityService);

  readonly regexPattern = signal<string>('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$');
  readonly regexInput = signal<string>('test@example.com');
  readonly regexResult = signal<string>('');
  readonly regexTime = signal<number>(0);
  readonly regexStatus = signal<'idle' | 'running' | 'done' | 'error'>('idle');

  async testRegex(): Promise<void> {
    this.regexStatus.set('running');
    const start = performance.now();

    try {
      const result = await this.regexSecurity.testRegex(this.regexPattern(), this.regexInput(), {
        timeout: 3000,
        safeMode: true,
      });

      const elapsed = Math.round(performance.now() - start);
      this.regexTime.set(elapsed);

      if (result.timeout) {
        this.regexResult.set('⚠️ Timeout - possible ReDoS attack');
        this.regexStatus.set('error');
      } else {
        this.regexResult.set(`Match: ${result.match ? '✅ YES' : '❌ NO'}`);
        this.regexStatus.set('done');
      }
    } catch (err) {
      this.regexStatus.set('error');
      this.regexResult.set(`Error: ${err}`);
    }
  }

  async analyzePattern(): Promise<void> {
    try {
      const analysis = await this.regexSecurity.analyzePatternSecurity(this.regexPattern());
      this.regexResult.set(`Risk: ${analysis.risk} | Safe: ${analysis.safe ? '✅' : '❌'}`);
      this.regexStatus.set(analysis.safe ? 'done' : 'error');
    } catch (err) {
      this.regexResult.set(`Analysis error: ${err}`);
      this.regexStatus.set('error');
    }
  }
}
