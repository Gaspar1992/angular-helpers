import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { vi, describe, beforeEach, afterEach, it, expect } from 'vitest';
import { InputSanitizerService, SANITIZER_CONFIG } from './input-sanitizer.service';

describe('InputSanitizerService', () => {
  let service: InputSanitizerService;

  describe('without Trusted Types support', () => {
    let originalTT: any;

    beforeEach(() => {
      originalTT = (window as any).trustedTypes;
      delete (window as any).trustedTypes;
      delete (window as any).__ttPolicies;

      TestBed.configureTestingModule({
        providers: [InputSanitizerService, { provide: PLATFORM_ID, useValue: 'browser' }],
      });
      service = TestBed.inject(InputSanitizerService);
    });

    afterEach(() => {
      if (originalTT) {
        (window as any).trustedTypes = originalTT;
      }
      delete (window as any).__ttPolicies;
    });

    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should return raw string from getTrustedHtml', () => {
      const html = '<div>hello</div>';
      expect(service.getTrustedHtml(html)).toBe(html);
    });

    it('isSupported returns true in browser and false in SSR', () => {
      expect(service.isSupported()).toBe(true);

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [InputSanitizerService, { provide: PLATFORM_ID, useValue: 'server' }],
      });
      const ssrService = TestBed.inject(InputSanitizerService);
      expect(ssrService.isSupported()).toBe(false);
    });

    it('sanitizeHtml uses DOMParser fallback', () => {
      const dirty = '<p>Test <b>bold</b><script>alert(1)</script></p>';
      const clean = service.sanitizeHtml(dirty);
      expect(clean).toBe('<p>Test <b>bold</b>alert(1)</p>');
    });

    it('sanitizeHtml throws when not supported in non-browser', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [InputSanitizerService, { provide: PLATFORM_ID, useValue: 'server' }],
      });
      const ssrService = TestBed.inject(InputSanitizerService);
      expect(() => ssrService.sanitizeHtml('<div></div>')).toThrow(
        /requires a browser environment/,
      );
    });

    it('sanitizeHtml uses Element.prototype.setHTML when available', () => {
      const originalSetHTML = (Element.prototype as any).setHTML;
      try {
        Object.defineProperty(Element.prototype, 'setHTML', {
          value: function (this: HTMLElement) {
            this.innerHTML = '<span>native setHTML sanitized</span>';
          },
          configurable: true,
          writable: true,
        });

        const result = service.sanitizeHtml('<p>test</p>');
        expect(result).toBe('<span>native setHTML sanitized</span>');
      } finally {
        if (originalSetHTML) {
          Object.defineProperty(Element.prototype, 'setHTML', {
            value: originalSetHTML,
            configurable: true,
            writable: true,
          });
        } else {
          delete (Element.prototype as any).setHTML;
        }
      }
    });

    it('sanitizeHtml uses window.Sanitizer when available and setHTML is unavailable', () => {
      const originalSetHTML = (Element.prototype as any).setHTML;
      const originalSanitizer = (window as any).Sanitizer;

      try {
        delete (Element.prototype as any).setHTML;

        class MockSanitizer {
          constructor(public config: any) {}
          sanitizeToString(_input: string) {
            return '<p>sanitized via Sanitizer API</p>';
          }
        }
        (window as any).Sanitizer = MockSanitizer;

        const result = service.sanitizeHtml('<p>test</p>');
        expect(result).toBe('<p>sanitized via Sanitizer API</p>');
      } finally {
        if (originalSetHTML) {
          Object.defineProperty(Element.prototype, 'setHTML', {
            value: originalSetHTML,
            configurable: true,
            writable: true,
          });
        }
        if (originalSanitizer) {
          (window as any).Sanitizer = originalSanitizer;
        } else {
          delete (window as any).Sanitizer;
        }
      }
    });

    it('sanitizeUrl delegates to pure url sanitizer', () => {
      expect(service.sanitizeUrl('https://example.com')).toBe('https://example.com/');
      expect(service.sanitizeUrl('javascript:alert(1)')).toBeNull();
    });

    it('escapeHtml escapes HTML entities', () => {
      expect(service.escapeHtml('')).toBe('');
      expect(service.escapeHtml('Tom & Jerry <script>"quoted" \'single\'</script>')).toBe(
        'Tom &amp; Jerry &lt;script&gt;&quot;quoted&quot; &#x27;single&#x27;&lt;/script&gt;',
      );
    });

    it('sanitizeJson safely parses JSON and returns null for invalid input', () => {
      expect(service.sanitizeJson('')).toBeNull();
      expect(service.sanitizeJson('{"valid": true}')).toEqual({ valid: true });
      expect(service.sanitizeJson('invalid json {')).toBeNull();
    });
  });

  describe('with Trusted Types support', () => {
    let mockTT: any;
    let createdPolicies: Map<string, any>;
    let originalTT: any;

    beforeEach(() => {
      originalTT = (window as any).trustedTypes;
      createdPolicies = new Map();
      mockTT = {
        getPolicy: vi.fn().mockImplementation((name: string) => {
          return createdPolicies.get(name);
        }),
        createPolicy: vi.fn().mockImplementation((name: string, rules: any) => {
          const policy: any = {
            name,
          };
          if (rules.createHTML) {
            policy.createHTML = vi.fn().mockImplementation((input: string) => {
              return {
                toString: () => rules.createHTML(input),
                type: 'TrustedHTML',
              };
            });
          }
          if (rules.createScript) {
            policy.createScript = vi.fn().mockImplementation((input: string) => {
              return {
                toString: () => rules.createScript(input),
                type: 'TrustedScript',
              };
            });
          }
          if (rules.createScriptURL) {
            policy.createScriptURL = vi.fn().mockImplementation((input: string) => {
              return {
                toString: () => rules.createScriptURL(input),
                type: 'TrustedScriptURL',
              };
            });
          }
          createdPolicies.set(name, policy);
          return policy;
        }),
      };

      (window as any).trustedTypes = mockTT;
      delete (window as any).__ttPolicies;
    });

    afterEach(() => {
      if (originalTT) {
        (window as any).trustedTypes = originalTT;
      } else {
        delete (window as any).trustedTypes;
      }
      delete (window as any).__ttPolicies;
    });

    it('should create policy with default name @angular-helpers/security', () => {
      TestBed.configureTestingModule({
        providers: [InputSanitizerService],
      });
      service = TestBed.inject(InputSanitizerService);

      expect(mockTT.createPolicy).toHaveBeenCalledWith(
        '@angular-helpers/security',
        expect.any(Object),
      );

      const res = service.getTrustedHtml('<span>test</span>');
      expect(res.toString()).toBe('<span>test</span>');
    });

    it('should create policy with name default when enableDefaultTrustedTypesPolicy is true', () => {
      TestBed.configureTestingModule({
        providers: [
          InputSanitizerService,
          {
            provide: SANITIZER_CONFIG,
            useValue: { enableDefaultTrustedTypesPolicy: true },
          },
        ],
      });
      service = TestBed.inject(InputSanitizerService);

      expect(mockTT.createPolicy).toHaveBeenCalledWith('default', expect.any(Object));
    });

    it('should reuse existing policy from __ttPolicies map if already registered', () => {
      const existingPolicy = {
        name: '@angular-helpers/security',
        createHTML: vi.fn().mockReturnValue('reused'),
      };
      (window as any).__ttPolicies = new Map([['@angular-helpers/security', existingPolicy]]);

      TestBed.configureTestingModule({
        providers: [InputSanitizerService],
      });
      service = TestBed.inject(InputSanitizerService);

      expect(mockTT.createPolicy).not.toHaveBeenCalled();
      expect(service.getTrustedHtml('test')).toBe('reused');
    });

    it('should sanitize HTML in the Trusted Types policy', () => {
      TestBed.configureTestingModule({
        providers: [InputSanitizerService],
      });
      service = TestBed.inject(InputSanitizerService);

      const policy = createdPolicies.get('@angular-helpers/security');
      const createHTMLSpy = vi.spyOn(policy, 'createHTML');

      const dirty = '<script>alert(1)</script><b>hello</b>';
      const res = service.getTrustedHtml(dirty);

      expect(createHTMLSpy).toHaveBeenCalledWith(dirty);
      expect(res.toString()).toBe('<b>hello</b>');
    });
  });
});
