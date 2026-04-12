import { Component, ChangeDetectionStrategy, ViewEncapsulation, signal } from '@angular/core';
import { RegexSecurityService } from '@angular-helpers/security';

@Component({
  selector: 'app-regex-security-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: '../../../shared/demo-shared.styles.css',
  template: `
    <div class="demo-section">
      <h3>🔒 RegexSecurityService</h3>
      <p>Safe regex execution in Web Workers with ReDoS protection</p>

      <div class="demo-controls">
        <label>
          Pattern:
          <input
            type="text"
            name="regex-pattern"
            [value]="regexPattern()"
            (input)="regexPattern.set($any($event).target.value)"
            class="demo-input"
          />
        </label>
        <label>
          Test input:
          <input
            type="text"
            name="regex-test-input"
            [value]="regexInput()"
            (input)="regexInput.set($any($event).target.value)"
            class="demo-input"
          />
        </label>
        <div class="demo-buttons">
          <button (click)="testRegex()" class="btn btn-primary">Test Regex</button>
          <button (click)="analyzePattern()" class="btn btn-secondary">Analyze Pattern</button>
        </div>
      </div>

      @if (regexResult()) {
        <div class="demo-result" [class.error]="regexStatus() === 'error'">
          {{ regexResult() }}
          @if (regexTime()) {
            <span class="time">({{ regexTime() }}ms)</span>
          }
        </div>
      }
    </div>
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
