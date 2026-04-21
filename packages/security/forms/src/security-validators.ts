import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import {
  assessPasswordStrength,
  containsScriptInjection,
  containsSqlInjectionHints,
  HtmlSanitizerOptions,
  isHtmlSafe,
  isUrlSafe,
  PasswordScore,
} from '@angular-helpers/security';

export interface StrongPasswordOptions {
  minScore?: PasswordScore;
}

export interface SafeUrlOptions {
  schemes?: readonly string[];
}

export type SafeHtmlOptions = HtmlSanitizerOptions;

/**
 * Collection of Reactive Forms validators that bridge the shared security helpers into
 * the Angular `ValidatorFn` contract. All validators are static factory functions and do not
 * require provider registration.
 *
 * For the Signal Forms equivalents see `@angular-helpers/security/signal-forms`.
 *
 * @example
 * const form = new FormGroup({
 *   password: new FormControl('', [
 *     Validators.required,
 *     SecurityValidators.strongPassword({ minScore: 3 }),
 *   ]),
 *   bio: new FormControl('', [SecurityValidators.safeHtml()]),
 *   homepage: new FormControl('', [SecurityValidators.safeUrl({ schemes: ['https:'] })]),
 * });
 */
export class SecurityValidators {
  /**
   * Validates password strength using the shared entropy-based scoring logic.
   * Returns `{ weakPassword: { score, required } }` when the score is below `minScore`.
   *
   * @param options.minScore Minimum acceptable score (0..4). Default: `2` (fair).
   */
  static strongPassword(options: StrongPasswordOptions = {}): ValidatorFn {
    const required = options.minScore ?? 2;

    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (value === null || value === undefined || value === '') return null;
      if (typeof value !== 'string') return null;

      const { score } = assessPasswordStrength(value);
      return score < required ? { weakPassword: { score, required } } : null;
    };
  }

  /**
   * Validates that the given HTML string contains no tags or attributes outside the allowlist.
   * Returns `{ unsafeHtml: true }` when sanitization would alter the value.
   *
   * Requires a browser environment (DOMParser). In SSR contexts the validator returns `null`
   * (no error) to avoid blocking forms server-side; re-validation happens automatically on
   * hydration.
   */
  static safeHtml(options: SafeHtmlOptions = {}): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (value === null || value === undefined || value === '') return null;
      if (typeof value !== 'string') return null;
      if (typeof DOMParser === 'undefined') return null;

      return isHtmlSafe(value, options) ? null : { unsafeHtml: true };
    };
  }

  /**
   * Validates that the given URL is well-formed and uses an allowed scheme.
   * Returns `{ unsafeUrl: true }` for `javascript:`, `data:`, relative URLs, and other
   * non-allowlisted protocols.
   */
  static safeUrl(options: SafeUrlOptions = {}): ValidatorFn {
    const schemes = options.schemes ?? ['http:', 'https:'];

    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (value === null || value === undefined || value === '') return null;
      if (typeof value !== 'string') return null;

      return isUrlSafe(value, schemes) ? null : { unsafeUrl: true };
    };
  }

  /**
   * Rejects values that look like script injection attempts (`<script>`, `javascript:`,
   * or inline event handlers). Lightweight pattern check — NOT a substitute for a full
   * HTML sanitizer.
   */
  static noScriptInjection(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (value === null || value === undefined || value === '') return null;
      if (typeof value !== 'string') return null;

      return containsScriptInjection(value) ? { scriptInjection: true } : null;
    };
  }

  /**
   * Heuristic check for common SQL-injection sentinel strings. Intended as defense-in-depth
   * for user-facing inputs. Use parameterized queries on the server as the primary defense.
   */
  static noSqlInjectionHints(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (value === null || value === undefined || value === '') return null;
      if (typeof value !== 'string') return null;

      return containsSqlInjectionHints(value) ? { sqlInjectionHint: true } : null;
    };
  }
}
