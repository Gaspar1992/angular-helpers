import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RegexSecurityService } from '@angular-helpers/security';

@Component({
  selector: 'app-regex-security-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RegexSecurityService],
  template: `
    <section
      class="bg-base-200 border border-base-300 rounded-xl p-5 sm:p-6 mb-5"
      aria-labelledby="regex-title"
    >
      <div class="flex items-center justify-between gap-3 flex-wrap mb-3">
        <h2 class="text-lg sm:text-xl font-bold text-base-content m-0" id="regex-title">
          Regex Security Service
        </h2>
        <div class="flex gap-2 flex-wrap">
          <span class="badge badge-success badge-sm">safe execution</span>
          <span class="badge badge-info badge-sm">web worker</span>
        </div>
      </div>
      <p class="text-sm text-base-content/70 mb-4 leading-relaxed">
        Test regular expressions safely with ReDoS protection using Web Workers.
      </p>

      <div class="flex flex-col gap-2 mb-4">
        <label for="regex-pattern" class="text-sm font-medium text-base-content/70">Pattern</label>
        <input
          id="regex-pattern"
          class="input input-sm input-bordered w-full font-mono text-xs"
          [value]="regexPattern()"
          (input)="regexPattern.set($any($event.target).value)"
          placeholder="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
        />
        <label for="regex-input" class="text-sm font-medium text-base-content/70">Test Input</label>
        <input
          id="regex-input"
          class="input input-sm input-bordered w-full"
          [value]="regexInput()"
          (input)="regexInput.set($any($event.target).value)"
          placeholder="test@example.com"
        />
      </div>

      <div class="flex flex-wrap gap-2 mb-4">
        <button
          class="btn btn-primary btn-sm"
          (click)="testRegex()"
          [disabled]="regexStatus() === 'running'"
        >
          @if (regexStatus() === 'running') {
            <span class="loading loading-spinner loading-xs"></span>
          }
          Test Regex
        </button>
        <button class="btn btn-secondary btn-sm" (click)="analyzePattern()">Analyze Pattern</button>
      </div>

      @if (regexResult()) {
        <div
          class="p-3 rounded-lg font-mono text-sm break-all mt-2"
          [class.bg-success/10]="regexStatus() === 'done' && !regexResult()?.includes('❌')"
          [class.text-success]="regexStatus() === 'done' && !regexResult()?.includes('❌')"
          [class.bg-error/10]="regexStatus() === 'error' || regexResult()?.includes('❌')"
          [class.text-error]="regexStatus() === 'error' || regexResult()?.includes('❌')"
          [class.bg-info/10]="regexStatus() === 'idle'"
          [class.text-info]="regexStatus() === 'idle'"
        >
          {{ regexResult() }}
          @if (regexTime() > 0) {
            <span class="text-xs opacity-60 ml-2">({{ regexTime() }}ms)</span>
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
