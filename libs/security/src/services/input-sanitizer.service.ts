import { Injectable, InjectionToken, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  DEFAULT_ALLOWED_ATTRIBUTES,
  DEFAULT_ALLOWED_TAGS,
  sanitizeHtmlString,
  sanitizeUrlString,
} from '../internal/validators-core';

export interface SanitizerConfig {
  allowedTags?: string[];
  allowedAttributes?: Record<string, string[]>;
  enableDefaultTrustedTypesPolicy?: boolean;
}

export interface TrustedHTML {
  toString(): string;
}

export interface TrustedScript {
  toString(): string;
}

export interface TrustedScriptURL {
  toString(): string;
}

export interface TrustedTypePolicyOptions {
  createHTML?: (input: string) => string;
  createScript?: (input: string) => string;
  createScriptURL?: (input: string) => string;
}

export interface TrustedTypePolicy {
  readonly name?: string;
  createHTML(input: string): TrustedHTML | string;
  createScript?(input: string): TrustedScript | string;
  createScriptURL?(input: string): TrustedScriptURL | string;
}

interface TrustedTypePolicyFactory {
  createPolicy(policyName: string, policyOptions?: TrustedTypePolicyOptions): TrustedTypePolicy;
}

interface SanitizerElementConfig {
  allowElements: string[];
  allowAttributes: Record<string, string[]>;
}

interface LegacySanitizer {
  sanitizeToString(input: string): string;
}

interface ElementWithSetHTML extends Omit<HTMLElement, 'setHTML'> {
  setHTML(input: string, options?: { sanitizer?: SanitizerElementConfig }): void;
}

interface WindowWithSanitizerApis extends Omit<Window, 'trustedTypes' | 'Sanitizer'> {
  trustedTypes?: TrustedTypePolicyFactory;
  __ttPolicies?: Map<string, TrustedTypePolicy>;
  Sanitizer?: new (config: SanitizerElementConfig) => LegacySanitizer;
}

export const SANITIZER_CONFIG = new InjectionToken<SanitizerConfig>('SANITIZER_CONFIG');

/**
 * Service for structured input sanitization to defend against XSS, URL injection, and unsafe HTML.
 *
 * This service is defense-in-depth and DOES NOT replace a Content Security Policy (CSP).
 * Always configure a proper CSP alongside using this service.
 *
 * Delegates to shared pure helpers in `internal/validators-core` so Signal Forms and Reactive Forms
 * validators share the exact same sanitization logic.
 *
 * @example
 * const clean = sanitizer.sanitizeHtml('<b>Hello</b><script>alert(1)</script>');
 * // → '<b>Hello</b>'
 *
 * @example
 * const url = sanitizer.sanitizeUrl('javascript:alert(1)');
 * // → null
 */
@Injectable()
export class InputSanitizerService {
  private readonly platformId = inject(PLATFORM_ID);

  private readonly allowedTags: readonly string[];
  private readonly allowedAttributes: Readonly<Record<string, readonly string[]>>;
  private readonly trustedTypesPolicy?: TrustedTypePolicy;

  constructor() {
    const config = inject(SANITIZER_CONFIG, { optional: true }) ?? {};
    this.allowedTags = config.allowedTags ?? DEFAULT_ALLOWED_TAGS;
    this.allowedAttributes = config.allowedAttributes ?? DEFAULT_ALLOWED_ATTRIBUTES;

    const win =
      typeof window !== 'undefined' ? (window as unknown as WindowWithSanitizerApis) : undefined;
    if (win?.trustedTypes) {
      const tt = win.trustedTypes;
      const policyName = config.enableDefaultTrustedTypesPolicy
        ? 'default'
        : '@angular-helpers/security';

      const globalTtPolicies = win.__ttPolicies ?? new Map<string, TrustedTypePolicy>();
      win.__ttPolicies = globalTtPolicies;

      if (globalTtPolicies.has(policyName)) {
        this.trustedTypesPolicy = globalTtPolicies.get(policyName);
      } else {
        try {
          const policyOptions: TrustedTypePolicyOptions = {
            createHTML: (input: string) => {
              return sanitizeHtmlString(input, {
                allowedTags: this.allowedTags,
                allowedAttributes: this.allowedAttributes,
              });
            },
          };

          if (policyName === 'default') {
            policyOptions.createScript = () => {
              throw new TypeError(
                'TrustedTypes default policy: dynamic script evaluation is blocked by @angular-helpers/security',
              );
            };
            policyOptions.createScriptURL = (input: string) => {
              const sanitized = sanitizeUrlString(input);
              if (sanitized === null) {
                throw new TypeError(
                  'TrustedTypes default policy: unsafe script URL blocked by @angular-helpers/security',
                );
              }
              return sanitized;
            };
          }

          this.trustedTypesPolicy = tt.createPolicy(policyName, policyOptions);
          globalTtPolicies.set(policyName, this.trustedTypesPolicy);
        } catch {
          // Fallback if policy creation fails or policy already exists
        }
      }
    }
  }

  isSupported(): boolean {
    return isPlatformBrowser(this.platformId) && typeof DOMParser !== 'undefined';
  }

  /**
   * Parses and sanitizes an HTML string, keeping only allowed tags and attributes.
   * Leverages the native browser Sanitizer API (e.g. Element.prototype.setHTML) if available
   * for high-performance execution, falling back to a custom DOMParser implementation on
   * unsupported environments (such as older browsers or SSR).
   *
   * @throws {Error} When called in a non-browser environment.
   */
  sanitizeHtml(input: string): string {
    if (!this.isSupported()) {
      throw new Error('sanitizeHtml requires a browser environment (DOMParser unavailable)');
    }

    // 1. Try native Element.prototype.setHTML (modern standard in Firefox 148+, etc.)
    if (typeof Element !== 'undefined' && 'setHTML' in Element.prototype) {
      try {
        const tempDiv = document.createElement('div') as unknown as ElementWithSetHTML;
        const config: SanitizerElementConfig = {
          allowElements: this.allowedTags as string[],
          allowAttributes: this.allowedAttributes as Record<string, string[]>,
        };
        tempDiv.setHTML(input, { sanitizer: config });
        return tempDiv.innerHTML;
      } catch {
        // Fallback on error
      }
    }

    // 2. Try older Sanitizer API spec draft (implemented in some Chrome versions)
    const win =
      typeof window !== 'undefined' ? (window as unknown as WindowWithSanitizerApis) : undefined;
    if (win?.Sanitizer !== undefined) {
      try {
        const tempDiv = document.createElement('div');
        const config: SanitizerElementConfig = {
          allowElements: this.allowedTags as string[],
          allowAttributes: this.allowedAttributes as Record<string, string[]>,
        };
        const sanitizer = new win.Sanitizer(config);
        tempDiv.innerHTML = sanitizer.sanitizeToString(input);
        return tempDiv.innerHTML;
      } catch {
        // Fallback on error
      }
    }

    // 3. Fallback to DOMParser-based allowlist sanitizer
    return sanitizeHtmlString(input, {
      allowedTags: this.allowedTags,
      allowedAttributes: this.allowedAttributes,
    });
  }

  /**
   * Returns a TrustedHTML object (or similar if using a polyfill) if the Trusted Types policy
   * is available, otherwise returns the raw input string.
   */
  getTrustedHtml(input: string): TrustedHTML | string {
    if (this.trustedTypesPolicy) {
      return this.trustedTypesPolicy.createHTML(input);
    }
    return input;
  }

  /**
   * Validates and normalizes a URL string.
   * Returns the normalized URL only for `http:` and `https:` schemes.
   * Returns `null` for `javascript:`, `data:`, `vbscript:`, relative URLs, or malformed input.
   */
  sanitizeUrl(input: string): string | null {
    return sanitizeUrlString(input);
  }

  /**
   * Escapes HTML special characters for safe text interpolation.
   * Use this when inserting user content into HTML text nodes or attributes.
   */
  escapeHtml(input: string): string {
    if (!input) return '';

    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  /**
   * Safely parses a JSON string. Returns the parsed value on success, `null` on any error.
   * Does NOT use `eval` or `Function` — uses JSON.parse only.
   */
  sanitizeJson(input: string): unknown | null {
    if (!input) return null;

    try {
      return JSON.parse(input);
    } catch {
      return null;
    }
  }
}
