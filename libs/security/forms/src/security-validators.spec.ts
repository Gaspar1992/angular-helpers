import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import { FormControl } from '@angular/forms';
import { SecurityValidators } from './security-validators';

describe('SecurityValidators (Reactive Forms)', () => {
  describe('strongPassword', () => {
    it('returns null for empty, null, undefined or non-string values', () => {
      const validator = SecurityValidators.strongPassword();

      expect(validator(new FormControl(''))).toBeNull();
      expect(validator(new FormControl(null))).toBeNull();
      expect(validator(new FormControl(undefined))).toBeNull();
      expect(validator(new FormControl(12345 as any))).toBeNull();
    });

    it('returns error when score is below default minScore (2)', () => {
      const validator = SecurityValidators.strongPassword();
      const control = new FormControl('123'); // score 0

      const errors = validator(control);
      expect(errors).toEqual({
        weakPassword: {
          score: 0,
          required: 2,
        },
      });
    });

    it('returns null when password meets default minScore', () => {
      const validator = SecurityValidators.strongPassword();
      const control = new FormControl('P@ssw0rd123!');
      expect(validator(control)).toBeNull();
    });

    it('supports custom minScore threshold', () => {
      const validator = SecurityValidators.strongPassword({ minScore: 4 });
      const control = new FormControl('P@ssw0rd123!'); // score ~3

      expect(validator(control)).toEqual({
        weakPassword: {
          score: expect.any(Number),
          required: 4,
        },
      });

      const superStrongControl = new FormControl('xK#9mZ$vLq2@rBnT7-extra-entropy');
      expect(validator(superStrongControl)).toBeNull();
    });
  });

  describe('safeHtml', () => {
    it('returns null for empty, null, undefined or non-string values', () => {
      const validator = SecurityValidators.safeHtml();

      expect(validator(new FormControl(''))).toBeNull();
      expect(validator(new FormControl(null))).toBeNull();
      expect(validator(new FormControl(undefined))).toBeNull();
      expect(validator(new FormControl({} as any))).toBeNull();
    });

    it('returns null for safe HTML strings', () => {
      const validator = SecurityValidators.safeHtml();
      const control = new FormControl('<p>Hello <b>world</b></p>');
      expect(validator(control)).toBeNull();
    });

    it('returns { unsafeHtml: true } when HTML contains disallowed tags or script injection', () => {
      const validator = SecurityValidators.safeHtml();
      const control = new FormControl('<p>Hello <script>alert(1)</script></p>');
      expect(validator(control)).toEqual({ unsafeHtml: true });
    });

    it('supports custom allowedTags and allowedAttributes', () => {
      const validator = SecurityValidators.safeHtml({
        allowedTags: ['p', 'b', 'i'],
      });
      const control = new FormControl('<a href="https://test.com">link</a>');
      expect(validator(control)).toEqual({ unsafeHtml: true });
    });

    it('returns null in SSR when DOMParser is undefined', () => {
      const originalParser = globalThis.DOMParser;
      try {
        delete (globalThis as any).DOMParser;
        const validator = SecurityValidators.safeHtml();
        const control = new FormControl('<script>alert(1)</script>');
        expect(validator(control)).toBeNull();
      } finally {
        globalThis.DOMParser = originalParser;
      }
    });
  });

  describe('safeUrl', () => {
    it('returns null for empty, null, undefined or non-string values', () => {
      const validator = SecurityValidators.safeUrl();

      expect(validator(new FormControl(''))).toBeNull();
      expect(validator(new FormControl(null))).toBeNull();
      expect(validator(new FormControl(undefined))).toBeNull();
      expect(validator(new FormControl([] as any))).toBeNull();
    });

    it('returns null for safe http and https URLs', () => {
      const validator = SecurityValidators.safeUrl();

      expect(validator(new FormControl('https://example.com/path'))).toBeNull();
      expect(validator(new FormControl('http://example.com'))).toBeNull();
    });

    it('returns { unsafeUrl: true } for unsafe protocols, relative paths or malformed URLs', () => {
      const validator = SecurityValidators.safeUrl();

      expect(validator(new FormControl('javascript:alert(1)'))).toEqual({ unsafeUrl: true });
      expect(validator(new FormControl('data:text/html,<script>'))).toEqual({ unsafeUrl: true });
      expect(validator(new FormControl('/relative/path'))).toEqual({ unsafeUrl: true });
      expect(validator(new FormControl('not-a-url'))).toEqual({ unsafeUrl: true });
    });

    it('supports custom allowed schemes', () => {
      const validator = SecurityValidators.safeUrl({ schemes: ['https:'] });

      expect(validator(new FormControl('http://insecure.com'))).toEqual({ unsafeUrl: true });
      expect(validator(new FormControl('https://secure.com'))).toBeNull();
    });
  });

  describe('noScriptInjection', () => {
    it('returns null for empty, null, undefined or non-string values', () => {
      const validator = SecurityValidators.noScriptInjection();

      expect(validator(new FormControl(''))).toBeNull();
      expect(validator(new FormControl(null))).toBeNull();
      expect(validator(new FormControl(undefined))).toBeNull();
      expect(validator(new FormControl(123 as any))).toBeNull();
    });

    it('returns null for regular text', () => {
      const validator = SecurityValidators.noScriptInjection();
      expect(validator(new FormControl('This is plain text.'))).toBeNull();
    });

    it('returns { scriptInjection: true } when script injection patterns are detected', () => {
      const validator = SecurityValidators.noScriptInjection();

      expect(validator(new FormControl('<script>alert(1)</script>'))).toEqual({
        scriptInjection: true,
      });
      expect(validator(new FormControl('javascript:doBadThings()'))).toEqual({
        scriptInjection: true,
      });
      expect(validator(new FormControl('<img src=x onerror=alert(1)>'))).toEqual({
        scriptInjection: true,
      });
    });
  });

  describe('noSqlInjectionHints', () => {
    it('returns null for empty, null, undefined or non-string values', () => {
      const validator = SecurityValidators.noSqlInjectionHints();

      expect(validator(new FormControl(''))).toBeNull();
      expect(validator(new FormControl(null))).toBeNull();
      expect(validator(new FormControl(undefined))).toBeNull();
      expect(validator(new FormControl(123 as any))).toBeNull();
    });

    it('returns null for benign input', () => {
      const validator = SecurityValidators.noSqlInjectionHints();
      expect(validator(new FormControl('john.doe@example.com'))).toBeNull();
    });

    it('returns { sqlInjectionHint: true } for SQL injection heuristics', () => {
      const validator = SecurityValidators.noSqlInjectionHints();

      expect(validator(new FormControl("admin' OR '1'='1"))).toEqual({
        sqlInjectionHint: true,
      });
      expect(validator(new FormControl('UNION SELECT * FROM users'))).toEqual({
        sqlInjectionHint: true,
      });
      expect(validator(new FormControl("Robert'); DROP TABLE students;--"))).toEqual({
        sqlInjectionHint: true,
      });
    });
  });
});
