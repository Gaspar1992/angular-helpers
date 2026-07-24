import { TestBed } from '@angular/core/testing';
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
        providers: [InputSanitizerService],
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
