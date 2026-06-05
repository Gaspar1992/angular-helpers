import { Component, inject, signal } from '@angular/core';
import { RegexSecurityService } from '@angular-helpers/security';

@Component({
  selector: 'app-regex-security-demo',
  template: `
    <section class="svc-card" aria-labelledby="regex-title">
      <div class="svc-card-head">
        <h2 class="svc-card-title" id="regex-title">Regex Security Service</h2>
        <div class="flex gap-2 flex-wrap">
          <span class="badge badge-success">safe execution</span>
          <span class="badge badge-info">web worker</span>
        </div>
      </div>
      <p class="text-sm text-base-content/70 mb-4 leading-relaxed">
        Test regular expressions safely with ReDoS protection using Web Workers.
      </p>

      <div class="flex flex-col gap-3 mb-4">
        <div class="flex flex-col gap-1">
          <label for="regex-pattern" class="text-xs font-bold uppercase opacity-50 ml-1"
            >Pattern</label
          >
          <input
            id="regex-pattern"
            class="demo-input font-mono text-xs"
            [value]="regexPattern()"
            (input)="regexPattern.set($any($event.target).value)"
            placeholder="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2}$"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label for="regex-input" class="text-xs font-bold uppercase opacity-50 ml-1"
            >Test Input</label
          >
          <input
            id="regex-input"
            class="demo-input"
            [value]="regexInput()"
            (input)="regexInput.set($any($event.target).value)"
            placeholder="test@example.com"
          />
        </div>
      </div>

      <div class="svc-controls">
        <button
          class="btn btn-primary btn-sm font-bold"
          (click)="testRegex()"
          [disabled]="regexStatus() === 'running'"
        >
          @if (regexStatus() === 'running') {
            <span class="loading loading-spinner loading-xs"></span>
          }
          Test Regex
        </button>
        <button class="btn btn-secondary btn-sm font-bold" (click)="analyzePattern()">
          Analyze Pattern
        </button>
      </div>

      @if (regexResult()) {
        <div class="svc-result mt-4">
          <div
            class="font-mono text-sm break-all"
            [class.text-success]="regexStatus() === 'done' && !regexResult()?.includes('❌')"
            [class.text-error]="regexStatus() === 'error' || regexResult()?.includes('❌')"
            [class.text-info]="regexStatus() === 'idle'"
          >
            {{ regexResult() }}
            @if (regexTime() > 0) {
              <span class="text-xs opacity-60 ml-2">({{ regexTime() }}ms)</span>
            }
          </div>
        </div>
      }
    </section>
  `,
})
export class RegexSecurityDemoComponent {
  private readonly regexSecurity = inject(RegexSecurityService);

  readonly regexPattern = signal<string>('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2}$');
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
