import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { PasswordStrengthService } from '@angular-helpers/security';

@Component({
  selector: 'app-password-strength-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [PasswordStrengthService],
  template: `
    <section
      class="bg-base-200 border border-base-300 rounded-xl p-5 sm:p-6 mb-5"
      aria-labelledby="password-title"
    >
      <div class="flex items-center justify-between gap-3 flex-wrap mb-3">
        <h2 class="text-lg sm:text-xl font-bold text-base-content m-0" id="password-title">
          PasswordStrength Service
        </h2>
        <div class="flex gap-2 flex-wrap">
          <span class="badge badge-success badge-sm">entropy-based</span>
          <span class="badge badge-info badge-sm">zxcvbn</span>
        </div>
      </div>
      <p class="text-sm text-base-content/70 mb-4 leading-relaxed">
        Assess password strength with entropy-based scoring, pattern detection, and actionable
        feedback.
      </p>

      <div class="flex flex-col gap-2 mb-4">
        <label for="password-input" class="text-sm font-medium text-base-content/70"
          >Password</label
        >
        <input
          id="password-input"
          class="input input-sm input-bordered w-full"
          type="password"
          [value]="passwordInput()"
          (input)="passwordInput.set($any($event.target).value)"
          placeholder="Enter a password to test..."
        />
      </div>

      <div class="flex flex-wrap gap-2 mb-4">
        <button class="btn btn-primary btn-sm" (click)="checkPassword()">Check Strength</button>
      </div>

      @if (passwordScore() !== null) {
        <div
          class="bg-base-300 border border-base-300 rounded-lg p-3 mt-3 divide-y divide-base-content/10"
        >
          <div class="flex items-center justify-between gap-3 py-2">
            <span class="text-sm text-base-content/60 font-medium">Score</span>
            <span class="text-sm font-semibold" [style.color]="scoreColor()">
              {{ passwordScore() }}/4 ({{ passwordLabel() }})
            </span>
          </div>
          <div class="flex items-center justify-between gap-3 py-2">
            <span class="text-sm text-base-content/60 font-medium">Entropy</span>
            <span class="text-sm text-base-content font-semibold font-mono"
              >{{ passwordEntropy() }} bits</span
            >
          </div>
          @if (passwordFeedback().length > 0) {
            <div class="flex items-start justify-between gap-3 py-2">
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
