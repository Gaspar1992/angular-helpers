import { Component, inject, signal } from '@angular/core';
import { PasswordStrengthService } from '@angular-helpers/security';

@Component({
  selector: 'app-password-strength-demo',
  providers: [PasswordStrengthService],
  template: `
    <section class="svc-card" aria-labelledby="password-title">
      <div class="svc-card-head">
        <h2 class="svc-card-title" id="password-title">PasswordStrength Service</h2>
        <div class="flex gap-2 flex-wrap">
          <span class="badge badge-success">entropy-based</span>
          <span class="badge badge-info">zxcvbn</span>
        </div>
      </div>
      <p class="text-sm text-base-content/70 mb-4 leading-relaxed">
        Assess password strength with entropy-based scoring, pattern detection, and actionable
        feedback.
      </p>

      <div class="flex flex-col gap-1 mb-4">
        <label for="password-input" class="text-xs font-bold uppercase opacity-50 ml-1"
          >Password</label
        >
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
        <button class="btn btn-primary btn-sm font-bold" (click)="checkPassword()">
          Check Strength
        </button>
      </div>

      @if (passwordScore() !== null) {
        <div class="svc-result mt-4">
          <div class="kv-row py-2 border-b border-base-300 last:border-b-0">
            <span class="text-sm text-base-content/60 font-medium">Score</span>
            <span class="text-sm font-semibold" [style.color]="scoreColor()">
              {{ passwordScore() }}/4 ({{ passwordLabel() }})
            </span>
          </div>
          <div class="kv-row py-2 border-b border-base-300 last:border-b-0">
            <span class="text-sm text-base-content/60 font-medium">Entropy</span>
            <span class="text-sm text-base-content font-semibold font-mono"
              >{{ passwordEntropy() }} bits</span
            >
          </div>
          @if (passwordFeedback().length > 0) {
            <div class="kv-row py-2 border-b border-base-300 last:border-b-0 items-start">
              <span class="text-sm text-base-content/60 font-medium">Feedback</span>
              <span class="text-sm text-base-content text-right">{{
                passwordFeedback().join(', ')
              }}</span>
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
