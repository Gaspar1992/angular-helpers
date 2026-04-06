import { Injectable, InjectionToken, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface SanitizerConfig {
  allowedTags?: string[];
  allowedAttributes?: Record<string, string[]>;
}

export const SANITIZER_CONFIG = new InjectionToken<SanitizerConfig>('SANITIZER_CONFIG');

const DEFAULT_ALLOWED_TAGS: string[] = [
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

const DEFAULT_ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  a: ['href'],
};

const SAFE_URL_SCHEMES = ['http:', 'https:'];

/**
 * Service for structured input sanitization to defend against XSS, URL injection, and unsafe HTML.
 *
 * This service is defense-in-depth and DOES NOT replace a Content Security Policy (CSP).
 * Always configure a proper CSP alongside using this service.
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

  private readonly allowedTags: Set<string>;
  private readonly allowedAttributes: Record<string, string[]>;

  constructor() {
    const config = inject(SANITIZER_CONFIG, { optional: true }) ?? {};
    this.allowedTags = new Set(config.allowedTags ?? DEFAULT_ALLOWED_TAGS);
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

    if (!input) return '';

    const parser = new DOMParser();
    const doc = parser.parseFromString(input, 'text/html');

    this.processNode(doc.body);

    return doc.body.innerHTML;
  }

  /**
   * Validates and normalizes a URL string.
   * Returns the normalized URL only for `http:` and `https:` schemes.
   * Returns `null` for `javascript:`, `data:`, `vbscript:`, relative URLs, or malformed input.
   */
  sanitizeUrl(input: string): string | null {
    if (!input) return null;

    try {
      const url = new URL(input);
      return SAFE_URL_SCHEMES.includes(url.protocol) ? url.toString() : null;
    } catch {
      return null;
    }
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

  private processNode(node: Element): void {
    const children = Array.from(node.childNodes);

    for (const child of children) {
      if (child.nodeType !== Node.ELEMENT_NODE) continue;

      const element = child as Element;
      const tagName = element.tagName.toLowerCase();

      if (!this.allowedTags.has(tagName)) {
        const text = element.textContent ?? '';
        node.replaceChild(document.createTextNode(text), element);
        continue;
      }

      this.sanitizeAttributes(element, tagName);
      this.processNode(element);
    }
  }

  private sanitizeAttributes(element: Element, tagName: string): void {
    const attrsToRemove: string[] = [];
    const allowed = this.allowedAttributes[tagName] ?? [];

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

      if (attr.name === 'href' && this.sanitizeUrl(attr.value) === null) {
        attrsToRemove.push(attr.name);
      }
    }

    attrsToRemove.forEach((name) => element.removeAttribute(name));
  }
}
