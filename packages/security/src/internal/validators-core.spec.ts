import { describe, it, expect } from 'vitest';
import {
  assessPasswordStrength,
  containsScriptInjection,
  containsSqlInjectionHints,
  isUrlSafe,
  sanitizeUrlString,
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
  });
});
