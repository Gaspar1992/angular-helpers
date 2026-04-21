import { inject, resource, Signal } from '@angular/core';
import {
  PathKind,
  SchemaPath,
  SchemaPathRules,
  validate,
  validateAsync,
} from '@angular/forms/signals';
import {
  assessPasswordStrength,
  containsScriptInjection,
  containsSqlInjectionHints,
  HibpService,
  HtmlSanitizerOptions,
  isHtmlSafe,
  isUrlSafe,
  PasswordScore,
} from '@angular-helpers/security';

/**
 * Options for {@link strongPassword}.
 */
export interface StrongPasswordRuleOptions {
  /** Minimum acceptable score (0..4). Default: `2` (fair). */
  minScore?: PasswordScore;
  /** Custom message shown to the user. Default: `'Password is too weak'`. */
  message?: string;
}

/**
 * Options for {@link safeUrl}.
 */
export interface SafeUrlRuleOptions {
  /** Allowed URL schemes including the trailing colon. Default: `['http:', 'https:']`. */
  schemes?: readonly string[];
  /** Custom message. Default: `'URL scheme is not allowed'`. */
  message?: string;
}

/**
 * Options for {@link safeHtml}.
 */
export interface SafeHtmlRuleOptions extends HtmlSanitizerOptions {
  /** Custom message. Default: `'Value contains unsafe HTML'`. */
  message?: string;
}

/**
 * Options for {@link noScriptInjection} and {@link noSqlInjectionHints}.
 */
export interface PatternRuleOptions {
  /** Custom message. Default varies per rule. */
  message?: string;
}

/**
 * Registers a sync validation rule on a string field that fails when the password strength
 * is below the required score. Uses the shared `assessPasswordStrength` helper for behavioural
 * parity with the Reactive Forms `SecurityValidators.strongPassword`.
 *
 * @example
 * form(model, (p) => {
 *   required(p.password);
 *   strongPassword(p.password, { minScore: 3 });
 * });
 */
export function strongPassword<TPathKind extends PathKind = PathKind.Root>(
  path: SchemaPath<string, SchemaPathRules.Supported, TPathKind>,
  options?: StrongPasswordRuleOptions,
): void {
  const required = options?.minScore ?? 2;
  const message = options?.message ?? 'Password is too weak';

  validate(path, ({ value }) => {
    const raw = value();
    if (!raw) return null;

    const { score } = assessPasswordStrength(raw);
    return score < required ? { kind: 'weakPassword', message } : null;
  });
}

/**
 * Registers a sync validation rule that fails when the input contains tags or attributes
 * outside the allowed HTML sanitizer allowlist.
 *
 * Requires a browser environment. In SSR contexts the rule is a no-op (returns `null`) so
 * server-rendered forms remain submittable; re-validation happens on hydration.
 */
export function safeHtml<TPathKind extends PathKind = PathKind.Root>(
  path: SchemaPath<string, SchemaPathRules.Supported, TPathKind>,
  options?: SafeHtmlRuleOptions,
): void {
  const message = options?.message ?? 'Value contains unsafe HTML';
  const sanitizerOptions: HtmlSanitizerOptions = {
    allowedTags: options?.allowedTags,
    allowedAttributes: options?.allowedAttributes,
  };

  validate(path, ({ value }) => {
    const raw = value();
    if (!raw) return null;
    if (typeof DOMParser === 'undefined') return null;

    return isHtmlSafe(raw, sanitizerOptions) ? null : { kind: 'unsafeHtml', message };
  });
}

/**
 * Registers a sync validation rule that fails for malformed URLs or URLs using schemes
 * outside the allowlist (default: `http:` and `https:`).
 */
export function safeUrl<TPathKind extends PathKind = PathKind.Root>(
  path: SchemaPath<string, SchemaPathRules.Supported, TPathKind>,
  options?: SafeUrlRuleOptions,
): void {
  const schemes = options?.schemes ?? ['http:', 'https:'];
  const message = options?.message ?? 'URL scheme is not allowed';

  validate(path, ({ value }) => {
    const raw = value();
    if (!raw) return null;

    return isUrlSafe(raw, schemes) ? null : { kind: 'unsafeUrl', message };
  });
}

/**
 * Registers a sync validation rule that rejects values matching common script-injection
 * sentinels (`<script>`, `javascript:`, inline event handlers).
 */
export function noScriptInjection<TPathKind extends PathKind = PathKind.Root>(
  path: SchemaPath<string, SchemaPathRules.Supported, TPathKind>,
  options?: PatternRuleOptions,
): void {
  const message = options?.message ?? 'Value contains script injection patterns';

  validate(path, ({ value }) => {
    const raw = value();
    if (!raw) return null;

    return containsScriptInjection(raw) ? { kind: 'scriptInjection', message } : null;
  });
}

/**
 * Registers a sync validation rule that rejects common SQL-injection sentinel strings.
 * Intended as defense-in-depth alongside server-side parameterized queries.
 */
export function noSqlInjectionHints<TPathKind extends PathKind = PathKind.Root>(
  path: SchemaPath<string, SchemaPathRules.Supported, TPathKind>,
  options?: PatternRuleOptions,
): void {
  const message = options?.message ?? 'Value contains SQL injection hints';

  validate(path, ({ value }) => {
    const raw = value();
    if (!raw) return null;

    return containsSqlInjectionHints(raw) ? { kind: 'sqlInjectionHint', message } : null;
  });
}

/**
 * Options for {@link hibpPassword}.
 */
export interface HibpPasswordRuleOptions {
  /** Custom message. Default: `'This password has appeared in a data breach'`. */
  message?: string;
  /** Debounce value changes before contacting HIBP. Default: `300` ms. */
  debounceMs?: number;
}

/**
 * Registers an async validation rule that checks the password against the Have I Been Pwned
 * breach corpus via the k-anonymity API. Requires `provideHibp()` to be set up in the
 * injector hierarchy.
 *
 * Fail-open semantics: network errors and unsupported environments do NOT produce a
 * validation error — the form remains submittable. This is intentional to prevent HIBP
 * outages from blocking user sign-ups.
 *
 * @example
 * form(model, (p) => {
 *   required(p.password);
 *   strongPassword(p.password, { minScore: 3 });
 *   hibpPassword(p.password);
 * });
 */
export function hibpPassword<TPathKind extends PathKind = PathKind.Root>(
  path: SchemaPath<string, SchemaPathRules.Supported, TPathKind>,
  options?: HibpPasswordRuleOptions,
): void {
  const message = options?.message ?? 'This password has appeared in a data breach';
  const debounceMs = options?.debounceMs ?? 300;

  validateAsync(path, {
    params: ({ value }) => {
      const raw = value();
      return raw && raw.length >= 8 ? raw : undefined;
    },
    factory: (passwordSignal: Signal<string | undefined>) => {
      const hibp = inject(HibpService);
      return resource({
        params: () => passwordSignal(),
        loader: async ({ params: password, abortSignal }) => {
          if (!password) return undefined;

          if (debounceMs > 0) {
            await debounce(debounceMs, abortSignal);
          }

          return hibp.isPasswordLeaked(password);
        },
      });
    },
    onSuccess: (result) => {
      if (!result) return null;
      if (result.error) return null;
      return result.leaked ? { kind: 'leakedPassword', message, count: result.count } : null;
    },
    onError: () => null,
  });
}

function debounce(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason);
      return;
    }
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = (): void => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    signal.addEventListener('abort', onAbort, { once: true });
  });
}
