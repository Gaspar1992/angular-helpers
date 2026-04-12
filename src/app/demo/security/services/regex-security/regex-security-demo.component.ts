import { Component, ChangeDetectionStrategy, ViewEncapsulation, signal } from '@angular/core';
import { RegexSecurityService } from '@angular-helpers/security';

@Component({
  selector: 'app-regex-security-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [RegexSecurityService],
  template: `
    <section class="bg-base-200 border border-base-300 rounded-xl p-5 sm:p-6 mb-5">
      <div class="flex items-center justify-between gap-3 flex-wrap mb-3">
        <h2 class="text-lg sm:text-xl font-bold text-base-content m-0 flex items-center gap-2">
          🔒 RegexSecurityService
        </h2>
        <span class="badge badge-primary badge-sm">ReDoS Protection</span>
      </div>
      <p class="text-sm text-base-content/70 mb-4 leading-relaxed">
        Safe regex execution in Web Workers with ReDoS protection
      </p>

      <div class="space-y-3">
        <div class="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            name="regex-pattern"
            [value]="regexPattern()"
            (input)="regexPattern.set($any($event).target.value)"
            placeholder="Pattern"
            class="input input-bordered input-sm flex-1 font-mono text-xs"
          />
          <input
            type="text"
            name="regex-test-input"
            [value]="regexInput()"
            (input)="regexInput.set($any($event).target.value)"
            placeholder="Test input"
            class="input input-bordered input-sm flex-1"
          />
        </div>
        <div class="flex flex-wrap gap-2">
          <button (click)="testRegex()" class="btn btn-primary btn-sm">Test Regex</button>
          <button (click)="analyzePattern()" class="btn btn-secondary btn-sm">
            Analyze Pattern
          </button>
        </div>

        @if (regexResult()) {
          <div
            class="p-3 rounded-lg font-mono text-sm break-all"
            [class.bg-success/10]="regexStatus() === 'success'"
            [class.text-success]="regexStatus() === 'success'"
            [class.bg-error/10]="regexStatus() === 'error'"
            [class.text-error]="regexStatus() === 'error'"
          >
            {{ regexResult() }}
            @if (regexTime()) {
              <span class="text-xs opacity-60 ml-2">({{ regexTime() }}ms)</span>
            }
          </div>
        }
      </div>
    </section>
  `,
})
export class RegexSecurityDemoComponent {
  regexPattern = signal<string>('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$');
  regexInput = signal<string>('test@example.com');
  regexResult = signal<string>('');
  regexStatus = signal<'idle' | 'running' | 'success' | 'error'>('idle');
  regexTime = signal<number>(0);

  constructor(private regexSecurity: RegexSecurityService) {}

  async testRegex(): Promise<void> {
    this.regexStatus.set('running');
    const start = performance.now();
    try {
      const result = await this.regexSecurity.testRegex(this.regexPattern(), this.regexInput(), {
        timeout: 3000,
        safeMode: true,
      });
      const time = Math.round(performance.now() - start);
      this.regexTime.set(time);
      if (result.timeout) {
        this.regexResult.set('⚠️ Timeout - possible ReDoS attack');
        this.regexStatus.set('error');
        return;
      }
      this.regexResult.set(`Match: ${result.match ? '✅ YES' : '❌ NO'}`);
      this.regexTime.set(time);
      this.regexStatus.set('success');
    } catch (error) {
      this.regexResult.set('Error: ' + (error as Error).message);
      this.regexStatus.set('error');
    }
  }

  async analyzePattern(): Promise<void> {
    try {
      const analysis = await this.regexSecurity.analyzePatternSecurity(this.regexPattern());
      this.regexResult.set(`Risk: ${analysis.risk} | Safe: ${analysis.safe ? '✅' : '❌'}`);
      this.regexStatus.set('success');
    } catch (err) {
      this.regexResult.set(`Error: ${err}`);
      this.regexStatus.set('error');
    }
  }
}
