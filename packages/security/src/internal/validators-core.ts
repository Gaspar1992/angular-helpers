/**
 * Internal validator helpers shared by both Reactive Forms validators
 * (`SecurityValidators`) and Signal Forms validators (`@angular-helpers/security/signal-forms`).
 *
 * All helpers in this module are pure and side-effect free. Browser-only helpers
 * (those using DOMParser) are clearly marked and throw when called outside a browser.
 *
 * This module is INTERNAL — not part of the public API surface.
 */

export type PasswordScore = 0 | 1 | 2 | 3 | 4;

export type PasswordLabel = 'very-weak' | 'weak' | 'fair' | 'strong' | 'very-strong';

export interface PasswordAssessment {
  score: PasswordScore;
  label: PasswordLabel;
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

const SCORE_LABELS: Record<PasswordScore, PasswordLabel> = {
  0: 'very-weak',
  1: 'weak',
  2: 'fair',
  3: 'strong',
  4: 'very-strong',
};

/**
 * Entropy-based password assessment. Pure function — safe to call outside Angular context.
 *
 * Thresholds (bits of entropy):
 * - 0 (very-weak):  < 28
 * - 1 (weak):       28–35
 * - 2 (fair):       36–49
 * - 3 (strong):     50–69
 * - 4 (very-strong): ≥ 70
 */
export function assessPasswordStrength(password: string): PasswordAssessment {
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

  const hasAlphaSeq = containsSequence(password.toLowerCase(), ALPHA_SEQUENCES, 3);
  const hasDigitSeq = containsSequence(password, DIGIT_SEQUENCES, 3);
  const hasRepeat = /(.)\1{2,}/.test(password);
  const hasKeyboard = KEYBOARD_ROWS.some((row) => containsSequence(password.toLowerCase(), row, 4));

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

  let score = entropyToScore(entropy);

  if (isCommon) {
    score = Math.min(score, 1) as PasswordScore;
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

function entropyToScore(entropy: number): PasswordScore {
  if (entropy < 28) return 0;
  if (entropy < 36) return 1;
  if (entropy < 50) return 2;
  if (entropy < 70) return 3;
  return 4;
}

function containsSequence(input: string, sequence: string, minLength: number): boolean {
  for (let i = 0; i <= sequence.length - minLength; i++) {
    if (input.includes(sequence.substring(i, i + minLength))) return true;
  }
  return false;
}

/**
 * URL safety check. Returns the normalized URL when the scheme is allowed, `null` otherwise.
 * Malformed URLs, relative URLs, and blocked schemes all return `null`.
 */
export function sanitizeUrlString(
  input: string,
  allowedSchemes: readonly string[] = ['http:', 'https:'],
): string | null {
  if (!input) return null;
  try {
    const url = new URL(input);
    return allowedSchemes.includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

/**
 * Boolean helper around `sanitizeUrlString`. `true` when the URL is well-formed and allowed.
 */
export function isUrlSafe(
  input: string,
  allowedSchemes: readonly string[] = ['http:', 'https:'],
): boolean {
  return sanitizeUrlString(input, allowedSchemes) !== null;
}

const SCRIPT_INJECTION_PATTERN = /<\s*script\b|javascript:|on\w+\s*=/i;

/**
 * Lightweight check for common script-injection sentinels. Complements (does NOT replace)
 * a full HTML sanitizer or Content Security Policy.
 */
export function containsScriptInjection(input: string): boolean {
  if (!input) return false;
  return SCRIPT_INJECTION_PATTERN.test(input);
}

const SQL_HINT_PATTERNS: readonly RegExp[] = [
  /'\s*or\s+'?1'?\s*=\s*'?1/i,
  /--\s*$/m,
  /;\s*--/,
  /\/\*/,
  /\bunion\s+select\b/i,
];

/**
 * Heuristic check for SQL-injection sentinel strings.
 * Intended as defense-in-depth for client-side form inputs; never a substitute for parameterized queries.
 */
export function containsSqlInjectionHints(input: string): boolean {
  if (!input) return false;
  return SQL_HINT_PATTERNS.some((pattern) => pattern.test(input));
}

export const DEFAULT_ALLOWED_TAGS: readonly string[] = [
  'b',
  'i',
  'em',
  'strong',
  'a',
  'p',
  'br',
  'ul',
  'ol',
  'li',
  'span',
];

export const DEFAULT_ALLOWED_ATTRIBUTES: Readonly<Record<string, readonly string[]>> = {
  a: ['href'],
};

export interface HtmlSanitizerOptions {
  allowedTags?: readonly string[];
  allowedAttributes?: Readonly<Record<string, readonly string[]>>;
}

/**
 * Sanitizes an HTML string by allowlist. Browser-only: requires DOMParser.
 *
 * @throws {Error} When called in a non-browser environment.
 */
export function sanitizeHtmlString(input: string, options: HtmlSanitizerOptions = {}): string {
  if (!input) return '';
  if (typeof DOMParser === 'undefined') {
    throw new Error('sanitizeHtmlString requires a browser environment (DOMParser unavailable)');
  }

  const allowedTags = new Set(options.allowedTags ?? DEFAULT_ALLOWED_TAGS);
  const allowedAttributes = options.allowedAttributes ?? DEFAULT_ALLOWED_ATTRIBUTES;

  const parser = new DOMParser();
  const doc = parser.parseFromString(input, 'text/html');

  processHtmlNode(doc.body, allowedTags, allowedAttributes);

  return doc.body.innerHTML;
}

/**
 * Returns `true` when sanitizing `input` produces the same string (i.e. nothing was stripped).
 * Empty strings are considered safe.
 *
 * @throws {Error} When called in a non-browser environment.
 */
export function isHtmlSafe(input: string, options: HtmlSanitizerOptions = {}): boolean {
  if (!input) return true;
  return sanitizeHtmlString(input, options) === input;
}

function processHtmlNode(
  node: Element,
  allowedTags: Set<string>,
  allowedAttributes: Readonly<Record<string, readonly string[]>>,
): void {
  const children = Array.from(node.childNodes);

  for (const child of children) {
    if (child.nodeType !== Node.ELEMENT_NODE) continue;

    const element = child as Element;
    const tagName = element.tagName.toLowerCase();

    if (!allowedTags.has(tagName)) {
      const text = element.textContent ?? '';
      node.replaceChild(document.createTextNode(text), element);
      continue;
    }

    sanitizeElementAttributes(element, tagName, allowedAttributes);
    processHtmlNode(element, allowedTags, allowedAttributes);
  }
}

function sanitizeElementAttributes(
  element: Element,
  tagName: string,
  allowedAttributes: Readonly<Record<string, readonly string[]>>,
): void {
  const attrsToRemove: string[] = [];
  const allowed = allowedAttributes[tagName] ?? [];

  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];

    if (attr.name.startsWith('on')) {
      attrsToRemove.push(attr.name);
      continue;
    }

    if (!allowed.includes(attr.name)) {
      attrsToRemove.push(attr.name);
      continue;
    }

    if (attr.name === 'href' && sanitizeUrlString(attr.value) === null) {
      attrsToRemove.push(attr.name);
    }
  }

  attrsToRemove.forEach((name) => element.removeAttribute(name));
}
