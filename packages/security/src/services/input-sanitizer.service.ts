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

  constructor() {
    const config = inject(SANITIZER_CONFIG, { optional: true }) ?? {};
    this.allowedTags = config.allowedTags ?? DEFAULT_ALLOWED_TAGS;
    this.allowedAttributes = config.allowedAttributes ?? DEFAULT_ALLOWED_ATTRIBUTES;
  }

  isSupported(): boolean {
    return isPlatformBrowser(this.platformId) && typeof DOMParser !== 'undefined';
  }

  /**
   * Parses and sanitizes an HTML string, keeping only allowed tags and attributes.
   * Script execution is prevented — parsing is done via DOMParser, not innerHTML assignment.
   *
   * @throws {Error} When called in a non-browser environment.
   */
  sanitizeHtml(input: string): string {
    if (!this.isSupported()) {
      throw new Error('sanitizeHtml requires a browser environment (DOMParser unavailable)');
    }
    return sanitizeHtmlString(input, {
      allowedTags: this.allowedTags,
      allowedAttributes: this.allowedAttributes,
    });
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
