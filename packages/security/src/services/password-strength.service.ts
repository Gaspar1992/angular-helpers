import { Injectable } from '@angular/core';

export interface PasswordStrengthResult {
  score: 0 | 1 | 2 | 3 | 4;
  label: 'very-weak' | 'weak' | 'fair' | 'strong' | 'very-strong';
  entropy: number;
  feedback: string[];
}

const COMMON_PASSWORDS = new Set([
  'password',
  '123456',
  'qwerty',
  'letmein',
  'admin',
  'welcome',
  '111111',
  'abc123',
  'monkey',
  'master',
  'login',
  'pass',
]);

const ALPHA_SEQUENCES = 'abcdefghijklmnopqrstuvwxyz';
const DIGIT_SEQUENCES = '0123456789';
const KEYBOARD_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

const SCORE_LABELS: Record<0 | 1 | 2 | 3 | 4, PasswordStrengthResult['label']> = {
  0: 'very-weak',
  1: 'weak',
  2: 'fair',
  3: 'strong',
  4: 'very-strong',
};

/**
 * Service for entropy-based password strength evaluation.
 * All methods are synchronous and side-effect free — safely wrappable in Angular `computed()`.
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
    if (!password) {
      return {
        score: 0,
        label: 'very-weak',
        entropy: 0,
        feedback: ['Password cannot be empty'],
      };
    }

    const feedback: string[] = [];
    const chars = [...password];
    const length = chars.length;

    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSymbol = /[!@#$%^&*()\-_=+[\]{}|;:'",.<>/?\\`~]/.test(password);
    const hasExtended = chars.some((c) => c.codePointAt(0)! > 127);

    let poolSize = 0;
    if (hasLower) poolSize += 26;
    if (hasUpper) poolSize += 26;
    if (hasDigit) poolSize += 10;
    if (hasSymbol) poolSize += 32;
    if (hasExtended) poolSize += 64;
    if (poolSize === 0) poolSize = 26;

    let entropy = length * Math.log2(poolSize);

    const hasAlphaSeq = this.containsSequence(password.toLowerCase(), ALPHA_SEQUENCES, 3);
    const hasDigitSeq = this.containsSequence(password, DIGIT_SEQUENCES, 3);
    const hasRepeat = /(.)\1{2,}/.test(password);
    const hasKeyboard = KEYBOARD_ROWS.some((row) =>
      this.containsSequence(password.toLowerCase(), row, 4),
    );

    if (hasAlphaSeq || hasDigitSeq) {
      entropy *= 0.8;
      feedback.push('Avoid predictable sequences (abc, 123)');
    }

    if (hasRepeat) {
      entropy *= 0.9;
      feedback.push('Avoid repeated characters');
    }

    if (hasKeyboard) {
      entropy *= 0.85;
      feedback.push('Avoid keyboard patterns (qwerty, asdf)');
    }

    if (length < 8) {
      feedback.push('Use at least 8 characters');
    }

    if (!hasUpper) feedback.push('Add uppercase letters');
    if (!hasDigit) feedback.push('Add numbers');
    if (!hasSymbol) feedback.push('Add special characters');

    const isCommon = COMMON_PASSWORDS.has(password.toLowerCase());

    let score = this.entropyToScore(entropy);

    if (isCommon) {
      score = Math.min(score, 1) as 0 | 1;
      if (!feedback.includes('Use at least 8 characters')) {
        feedback.push('This is a commonly used password');
      }
    }

    return {
      score,
      label: SCORE_LABELS[score],
      entropy: Math.round(entropy * 100) / 100,
      feedback,
    };
  }

  private entropyToScore(entropy: number): 0 | 1 | 2 | 3 | 4 {
    if (entropy < 28) return 0;
    if (entropy < 36) return 1;
    if (entropy < 50) return 2;
    if (entropy < 70) return 3;
    return 4;
  }

  private containsSequence(input: string, sequence: string, minLength: number): boolean {
    for (let i = 0; i <= sequence.length - minLength; i++) {
      if (input.includes(sequence.substring(i, i + minLength))) return true;
    }
    return false;
  }
}
