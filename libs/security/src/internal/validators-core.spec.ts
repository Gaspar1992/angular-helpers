import { describe, it, expect } from 'vitest';
import {
  assessPasswordStrength,
  containsScriptInjection,
  containsSqlInjectionHints,
  isUrlSafe,
  sanitizeUrlString,
  sanitizeHtmlString,
  isHtmlSafe,
} from './validators-core';

describe('validators-core (shared between Reactive Forms and Signal Forms)', () => {
  describe('assessPasswordStrength', () => {
    it('returns score 0 for empty input', () => {
      expect(assessPasswordStrength('').score).toBe(0);
    });

    it('caps common passwords to score 1', () => {
      const result = assessPasswordStrength('password');
      expect(result.score).toBeLessThanOrEqual(1);
    });

    it('rewards length and character diversity', () => {
      const weak = assessPasswordStrength('abcdef');
      const strong = assessPasswordStrength('xK#9mZ$vLq2@rBnT7');
      expect(strong.score).toBeGreaterThan(weak.score);
      expect(strong.score).toBeGreaterThanOrEqual(3);
    });

    it('detects repeated characters and keyboard patterns', () => {
      const repeated = assessPasswordStrength('aaa111AAA!!!');
      expect(repeated.feedback).toContain('Avoid repeated characters');

      const keyboard = assessPasswordStrength('qwerty123456');
      expect(keyboard.feedback).toContain('Avoid keyboard patterns (qwerty, asdf)');

      const seq = assessPasswordStrength('abcdef12345');
      expect(seq.feedback).toContain('Avoid predictable sequences (abc, 123)');
    });

    it.each([
      ['', 0],
      ['abc', 0],
      ['password', 1],
      ['P@ssw0rd!', 2],
      ['Tr0ub4dor&3', 3],
      ['xK#9mZ$vLq2@rBnT7', 4],
    ])('score(%j) ≥ %i', (input, minExpected) => {
      expect(assessPasswordStrength(input).score).toBeGreaterThanOrEqual(minExpected as 0);
    });
  });

  describe('sanitizeUrlString / isUrlSafe', () => {
    it('accepts http and https', () => {
      expect(sanitizeUrlString('https://example.com')).toBe('https://example.com/');
      expect(sanitizeUrlString('http://example.com/path')).toBe('http://example.com/path');
      expect(isUrlSafe('https://example.com')).toBe(true);
    });

    it('rejects javascript, data, and relative URLs', () => {
      expect(sanitizeUrlString('javascript:alert(1)')).toBeNull();
      expect(sanitizeUrlString('data:text/html,<script>')).toBeNull();
      expect(sanitizeUrlString('/relative/path')).toBeNull();
      expect(sanitizeUrlString('')).toBeNull();
    });

    it('honours explicit scheme allowlist', () => {
      expect(isUrlSafe('http://example.com', ['https:'])).toBe(false);
      expect(isUrlSafe('https://example.com', ['https:'])).toBe(true);
    });
  });

  describe('containsScriptInjection', () => {
    it.each([
      ['hello', false],
      ['<script>alert(1)</script>', true],
      ['<SCRIPT type="text/js">', true],
      ['javascript:void(0)', true],
      ['onclick=alert(1)', true],
      ['http://example.com', false],
    ])('containsScriptInjection(%j) === %j', (input, expected) => {
      expect(containsScriptInjection(input)).toBe(expected);
    });

    it('returns false for empty', () => {
      expect(containsScriptInjection('')).toBe(false);
    });
  });

  describe('containsSqlInjectionHints', () => {
    it.each([
      ['alice', false],
      ["alice' OR '1'='1", true],
      ["Robert'); DROP TABLE students;--", true],
      ['UNION SELECT * FROM users', true],
      ['/* comment */', true],
      ['normal text', false],
    ])('containsSqlInjectionHints(%j) === %j', (input, expected) => {
      expect(containsSqlInjectionHints(input)).toBe(expected);
    });

    it('returns false for empty string', () => {
      expect(containsSqlInjectionHints('')).toBe(false);
    });
  });

  describe('sanitizeHtmlString / isHtmlSafe', () => {
    it('returns empty string for empty input', () => {
      expect(sanitizeHtmlString('')).toBe('');
      expect(isHtmlSafe('')).toBe(true);
    });

    it('should clean scripts and on-handlers leaving safe tags', () => {
      const input = '<p>Hola <b>mundo</b><script>alert(1)</script></p>';
      expect(sanitizeHtmlString(input)).toBe('<p>Hola <b>mundo</b>alert(1)</p>');
    });

    it('should strip inline on* event attributes', () => {
      const input = '<p onclick="alert(1)">Click me</p>';
      expect(sanitizeHtmlString(input)).toBe('<p>Click me</p>');
    });

    it('should remove disallowed attributes', () => {
      const input = '<a href="https://example.com" class="btn" title="link">Link</a>';
      expect(sanitizeHtmlString(input)).toBe('<a href="https://example.com">Link</a>');
    });

    it('should sanitize malicious href attributes', () => {
      const input = '<a href="javascript:alert(1)">Hack</a>';
      expect(sanitizeHtmlString(input)).toBe('<a>Hack</a>');
    });

    it('isHtmlSafe returns true for safe content and false for modified content', () => {
      expect(isHtmlSafe('<p>Safe <b>content</b></p>')).toBe(true);
      expect(isHtmlSafe('<p>Dangerous <script>alert(1)</script></p>')).toBe(false);
    });

    it('should sanitize URL attributes in custom tags to prevent XSS bypass', () => {
      const options = {
        allowedTags: ['iframe', 'form'],
        allowedAttributes: {
          iframe: ['src'],
          form: ['action'],
        },
      };

      const maliciousIframe = '<iframe src="javascript:alert(\'XSS\')"></iframe>';
      expect(sanitizeHtmlString(maliciousIframe, options)).toBe('<iframe></iframe>');

      const safeIframe = '<iframe src="https://example.com/embed"></iframe>';
      expect(sanitizeHtmlString(safeIframe, options)).toBe(
        '<iframe src="https://example.com/embed"></iframe>',
      );

      const maliciousForm = '<form action="javascript:alert(1)"></form>';
      expect(sanitizeHtmlString(maliciousForm, options)).toBe('<form></form>');
    });

    it('throws when DOMParser is unavailable', () => {
      const originalParser = globalThis.DOMParser;
      try {
        delete (globalThis as any).DOMParser;
        expect(() => sanitizeHtmlString('<p>test</p>')).toThrow(/requires a browser environment/);
      } finally {
        globalThis.DOMParser = originalParser;
      }
    });
  });
});
