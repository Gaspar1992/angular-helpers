import { Injectable } from '@angular/core';
import { assessPasswordStrength, PasswordAssessment } from '../internal/validators-core';

/**
 * Backwards-compatible alias for the shared {@link PasswordAssessment} type.
 * Kept to preserve the `21.2.0` public API surface.
 */
export type PasswordStrengthResult = PasswordAssessment;

/**
 * Service for entropy-based password strength evaluation.
 * All methods are synchronous and side-effect free — safely wrappable in Angular `computed()`.
 *
 * Delegates to the shared {@link assessPasswordStrength} helper so Reactive Forms validators,
 * Signal Forms validators, and direct service consumers all share identical logic.
 *
 * Score thresholds (bits of entropy):
 * - 0 (very-weak):  < 28 bits
 * - 1 (weak):       28–35 bits
 * - 2 (fair):       36–49 bits
 * - 3 (strong):     50–69 bits
 * - 4 (very-strong): ≥ 70 bits
 *
 * @example
 * const result = passwordStrength.assess('P@ssw0rd!');
 * console.log(result.score);   // 2
 * console.log(result.label);   // 'fair'
 * console.log(result.entropy); // ~42.5
 */
@Injectable()
export class PasswordStrengthService {
  /**
   * Evaluates the strength of a password.
   * Never throws — returns score 0 for empty or null-like input.
   */
  assess(password: string): PasswordStrengthResult {
    return assessPasswordStrength(password);
  }
}
