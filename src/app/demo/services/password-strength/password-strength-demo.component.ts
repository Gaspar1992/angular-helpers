import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  inject,
  signal,
} from '@angular/core';
import { PasswordStrengthService } from '@angular-helpers/security';

@Component({
  selector: 'app-password-strength-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: '../demo.styles.css',
  providers: [PasswordStrengthService],
  template: `
    <section class="svc-card" aria-labelledby="password-title">
      <div class="svc-card-head">
        <h2 class="svc-card-title" id="password-title">PasswordStrength Service</h2>
        <div class="svc-badges">
          <span class="badge badge-ok">entropy-based</span>
          <span class="badge badge-secure">zxcvbn</span>
        </div>
      </div>
      <p class="svc-desc">
        Assess password strength with entropy-based scoring, pattern detection, and actionable feedback.
      </p>

      <div class="svc-controls svc-controls--col">
        <label for="password-input" class="demo-label">Password</label>
        <input
          id="password-input"
          class="demo-input"
          type="password"
          [value]="passwordInput()"
          (input)="passwordInput.set($any($event.target).value)"
          placeholder="Enter a password to test..."
        />
      </div>

      <div class="svc-controls">
        <button class="btn btn-primary" (click)="checkPassword()">Check Strength</button>
      </div>

      @if (passwordScore() !== null) {
        <div class="svc-result">
          <div class="kv-row">
            <span class="kv-key">Score</span>
            <span class="kv-val" [style.color]="scoreColor()"
              >{{ passwordScore() }}/4 ({{ passwordLabel() }})</span
            >
          </div>
          <div class="kv-row">
            <span class="kv-key">Entropy</span>
            <span class="kv-val mono">{{ passwordEntropy() }} bits</span>
          </div>
          @if (passwordFeedback().length > 0) {
            <div class="kv-row">
              <span class="kv-key">Feedback</span>
              <span class="kv-val">{{ passwordFeedback().join(', ') }}</span>
            </div>
          }
        </div>
      }
    </section>
  `,
})
export class PasswordStrengthDemoComponent {
  private readonly passwordStrength = inject(PasswordStrengthService);

  readonly passwordInput = signal<string>('');
  readonly passwordScore = signal<number | null>(null);
  readonly passwordLabel = signal<string>('');
  readonly passwordEntropy = signal<number>(0);
  readonly passwordFeedback = signal<string[]>([]);

  checkPassword(): void {
    const result = this.passwordStrength.assess(this.passwordInput());
    this.passwordScore.set(result.score);
    this.passwordLabel.set(result.label);
    this.passwordEntropy.set(result.entropy);
    this.passwordFeedback.set(result.feedback);
  }

  scoreColor(): string {
    const score = this.passwordScore();
    if (score === null) return 'inherit';
    const colors = ['#ff5050', '#ff9090', '#ffc850', '#6ee7a0', '#50c878'];
    return colors[score] ?? 'inherit';
  }
}
