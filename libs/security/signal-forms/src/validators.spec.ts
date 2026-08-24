import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form } from '@angular/forms/signals';
import { HibpService } from '@angular-helpers/security';
import {
  strongPassword,
  safeHtml,
  safeUrl,
  noScriptInjection,
  noSqlInjectionHints,
  hibpPassword,
} from './validators';

describe('Signal Forms Security Validators', () => {
  let mockHibpService: {
    isPasswordLeaked: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockHibpService = {
      isPasswordLeaked: vi.fn().mockResolvedValue({ leaked: false, count: 0 }),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: HibpService, useValue: mockHibpService }],
    });
  });

  describe('strongPassword', () => {
    it('validates password strength on signal form', () => {
      TestBed.runInInjectionContext(() => {
        const model = signal({ password: '' });
        const testForm = form(model, (f) => {
          strongPassword(f.password, { minScore: 2 });
        });

        // Empty password is valid (skipped by default, like required handles emptiness)
        expect(testForm.password().valid()).toBe(true);

        // Weak password fails
        model.set({ password: '123' });
        expect(testForm.password().valid()).toBe(false);
        expect(testForm.password().errors()).toEqual([
          expect.objectContaining({ kind: 'weakPassword', message: 'Password is too weak' }),
        ]);

        // Strong password passes
        model.set({ password: 'P@ssw0rd123!' });
        expect(testForm.password().valid()).toBe(true);
      });
    });

    it('supports custom error message and minScore', () => {
      TestBed.runInInjectionContext(() => {
        const model = signal({ password: '123' });
        const testForm = form(model, (f) => {
          strongPassword(f.password, { minScore: 3, message: 'Custom weak password msg' });
        });

        expect(testForm.password().valid()).toBe(false);
        expect(testForm.password().errors()).toEqual([
          expect.objectContaining({ kind: 'weakPassword', message: 'Custom weak password msg' }),
        ]);
      });
    });
  });

  describe('safeHtml', () => {
    it('validates HTML safety on signal form', () => {
      TestBed.runInInjectionContext(() => {
        const model = signal({ bio: '' });
        const testForm = form(model, (f) => {
          safeHtml(f.bio);
        });

        expect(testForm.bio().valid()).toBe(true);

        // Safe HTML
        model.set({ bio: '<p>Hello <b>World</b></p>' });
        expect(testForm.bio().valid()).toBe(true);

        // Unsafe HTML
        model.set({ bio: '<script>alert(1)</script>' });
        expect(testForm.bio().valid()).toBe(false);
        expect(testForm.bio().errors()).toEqual([
          expect.objectContaining({ kind: 'unsafeHtml', message: 'Value contains unsafe HTML' }),
        ]);
      });
    });
  });

  describe('safeUrl', () => {
    it('validates URL safety and scheme allowlist', () => {
      TestBed.runInInjectionContext(() => {
        const model = signal({ website: '' });
        const testForm = form(model, (f) => {
          safeUrl(f.website);
        });

        expect(testForm.website().valid()).toBe(true);

        model.set({ website: 'https://example.com' });
        expect(testForm.website().valid()).toBe(true);

        model.set({ website: 'javascript:alert(1)' });
        expect(testForm.website().valid()).toBe(false);
        expect(testForm.website().errors()).toEqual([
          expect.objectContaining({ kind: 'unsafeUrl', message: 'URL scheme is not allowed' }),
        ]);
      });
    });
  });

  describe('noScriptInjection', () => {
    it('rejects values with script injection patterns', () => {
      TestBed.runInInjectionContext(() => {
        const model = signal({ comment: 'Clean comment' });
        const testForm = form(model, (f) => {
          noScriptInjection(f.comment);
        });

        expect(testForm.comment().valid()).toBe(true);

        model.set({ comment: '<script>alert(1)</script>' });
        expect(testForm.comment().valid()).toBe(false);
        expect(testForm.comment().errors()).toEqual([
          expect.objectContaining({
            kind: 'scriptInjection',
            message: 'Value contains script injection patterns',
          }),
        ]);
      });
    });
  });

  describe('noSqlInjectionHints', () => {
    it('rejects values with SQL injection heuristics', () => {
      TestBed.runInInjectionContext(() => {
        const model = signal({ search: 'clean query' });
        const testForm = form(model, (f) => {
          noSqlInjectionHints(f.search);
        });

        expect(testForm.search().valid()).toBe(true);

        model.set({ search: "admin' OR '1'='1" });
        expect(testForm.search().valid()).toBe(false);
        expect(testForm.search().errors()).toEqual([
          expect.objectContaining({
            kind: 'sqlInjectionHint',
            message: 'Value contains SQL injection hints',
          }),
        ]);
      });
    });
  });

  describe('hibpPassword', () => {
    it('registers async validator and flags breached passwords with debouncing', async () => {
      mockHibpService.isPasswordLeaked.mockResolvedValue({ leaked: true, count: 50 });

      await TestBed.runInInjectionContext(async () => {
        const model = signal({ password: 'compromisedPassword123' });
        const testForm = form(model, (f) => {
          hibpPassword(f.password, { debounceMs: 10 });
        });

        // Wait for async validation resource
        await vi.waitFor(() => {
          expect(mockHibpService.isPasswordLeaked).toHaveBeenCalledWith('compromisedPassword123');
        });

        expect(testForm.password().valid()).toBe(false);
        expect(testForm.password().errors()).toEqual([
          expect.objectContaining({
            kind: 'leakedPassword',
            count: 50,
          }),
        ]);
      });
    });

    it('skips HIBP check if password is under 8 characters', async () => {
      await TestBed.runInInjectionContext(async () => {
        const model = signal({ password: 'short' });
        const testForm = form(model, (f) => {
          hibpPassword(f.password, { debounceMs: 0 });
        });

        await vi.waitFor(() => {
          expect(testForm.password().valid()).toBe(true);
        });
        expect(mockHibpService.isPasswordLeaked).not.toHaveBeenCalled();
      });
    });

    it('passes when password is not leaked or lookup has network error', async () => {
      mockHibpService.isPasswordLeaked.mockResolvedValue({
        leaked: false,
        count: 0,
        error: 'network',
      });

      await TestBed.runInInjectionContext(async () => {
        const model = signal({ password: 'securePassword123!' });
        const testForm = form(model, (f) => {
          hibpPassword(f.password, { debounceMs: 0 });
        });

        await vi.waitFor(() => {
          expect(mockHibpService.isPasswordLeaked).toHaveBeenCalledWith('securePassword123!');
        });

        expect(testForm.password().valid()).toBe(true);
      });
    });

    it('handles unexpected exceptions from HIBP service without breaking form', async () => {
      mockHibpService.isPasswordLeaked.mockRejectedValue(new Error('Boom'));

      await TestBed.runInInjectionContext(async () => {
        const model = signal({ password: 'exceptionPassword123' });
        const testForm = form(model, (f) => {
          hibpPassword(f.password, { debounceMs: 0 });
        });

        await vi.waitFor(() => {
          expect(mockHibpService.isPasswordLeaked).toHaveBeenCalled();
        });

        expect(testForm.password().valid()).toBe(true);
      });
    });
  });
});
