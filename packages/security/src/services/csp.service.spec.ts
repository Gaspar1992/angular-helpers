import '@angular/compiler';

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Meta } from '@angular/platform-browser';
import { CspService, CspPolicyBuilder, parseCsp, serializeCsp } from './csp.service';

describe('CSP Helpers & Service', () => {
  describe('parseCsp and serializeCsp', () => {
    it('should serialize CspDirectives to string', () => {
      const directives = {
        'default-src': ["'self'"],
        'script-src': ["'self'", 'https://apis.google.com'],
        'upgrade-insecure-requests': true,
        'block-all-mixed-content': false,
      };
      const result = serializeCsp(directives);
      expect(result).toBe(
        "default-src 'self'; script-src 'self' https://apis.google.com; upgrade-insecure-requests",
      );
    });

    it('should serialize CspDirectives with various value types', () => {
      const directives = {
        'default-src': ["'self'"],
        'script-src': [],
        'style-src': "'unsafe-inline'",
        'img-src': null,
        'font-src': undefined,
        'upgrade-insecure-requests': true,
      };
      const result = serializeCsp(directives);
      expect(result).toBe(
        "default-src 'self'; script-src; style-src 'unsafe-inline'; upgrade-insecure-requests",
      );
    });

    it('should parse CSP string to CspDirectives', () => {
      const policy =
        "default-src 'self'; script-src 'self' https://apis.google.com; upgrade-insecure-requests";
      const result = parseCsp(policy);
      expect(result['default-src']).toEqual(["'self'"]);
      expect(result['script-src']).toEqual(["'self'", 'https://apis.google.com']);
      expect(result['upgrade-insecure-requests']).toBe(true);
    });

    it('should parse CSP string with different directive structures', () => {
      const policy =
        "upgrade-insecure-requests; block-all-mixed-content; sandbox; default-src 'self'";
      const result = parseCsp(policy);
      expect(result['upgrade-insecure-requests']).toBe(true);
      expect(result['block-all-mixed-content']).toBe(true);
      expect(result['sandbox']).toEqual([]);
      expect(result['default-src']).toEqual(["'self'"]);
    });
  });

  describe('CspPolicyBuilder', () => {
    it('should build directives fluently', () => {
      const directives = new CspPolicyBuilder()
        .defaultSrc("'none'")
        .scriptSrc(["'self'", "'unsafe-eval'"])
        .styleSrc("'self'")
        .imgSrc(['*', 'data:'])
        .connectSrc("'self'")
        .fontSrc("'self'")
        .frameSrc("'none'")
        .objectSrc("'none'")
        .mediaSrc("'self'")
        .childSrc("'self'")
        .workerSrc("'self'")
        .manifestSrc("'self'")
        .baseUri("'self'")
        .formAction("'self'")
        .frameAncestors("'none'")
        .reportUri('/csp-report')
        .reportTo('default')
        .sandbox('allow-scripts')
        .upgradeInsecureRequests()
        .blockAllMixedContent()
        .set('custom-directive', 'value')
        .build();

      expect(directives['default-src']).toEqual(["'none'"]);
      expect(directives['script-src']).toEqual(["'self'", "'unsafe-eval'"]);
      expect(directives['style-src']).toEqual(["'self'"]);
      expect(directives['img-src']).toEqual(['*', 'data:']);
      expect(directives['connect-src']).toEqual(["'self'"]);
      expect(directives['font-src']).toEqual(["'self'"]);
      expect(directives['frame-src']).toEqual(["'none'"]);
      expect(directives['object-src']).toEqual(["'none'"]);
      expect(directives['media-src']).toEqual(["'self'"]);
      expect(directives['child-src']).toEqual(["'self'"]);
      expect(directives['worker-src']).toEqual(["'self'"]);
      expect(directives['manifest-src']).toEqual(["'self'"]);
      expect(directives['base-uri']).toEqual(["'self'"]);
      expect(directives['form-action']).toEqual(["'self'"]);
      expect(directives['frame-ancestors']).toEqual(["'none'"]);
      expect(directives['report-uri']).toEqual(['/csp-report']);
      expect(directives['report-to']).toEqual(['default']);
      expect(directives['sandbox']).toEqual(['allow-scripts']);
      expect(directives['upgrade-insecure-requests']).toBe(true);
      expect(directives['block-all-mixed-content']).toBe(true);
      expect(directives['custom-directive']).toEqual(['value']);
    });

    it('should convert to string representation', () => {
      const builder = new CspPolicyBuilder().defaultSrc("'self'").upgradeInsecureRequests();

      expect(builder.toString()).toBe("default-src 'self'; upgrade-insecure-requests");
    });

    it('should support setting boolean custom directives', () => {
      const directives = new CspPolicyBuilder().set('custom-bool', true).build();
      expect(directives['custom-bool']).toBe(true);
    });
  });

  describe('CspService', () => {
    let service: CspService;
    let metaSpy: { updateTag: any };

    beforeEach(() => {
      metaSpy = {
        updateTag: vi.fn(),
      };

      TestBed.configureTestingModule({
        providers: [CspService, { provide: Meta, useValue: metaSpy }],
      });

      service = TestBed.inject(CspService);
    });

    describe('applyPolicy', () => {
      it('should apply a policy string directly to Meta service', () => {
        service.applyPolicy("default-src 'self'");
        expect(metaSpy.updateTag).toHaveBeenCalledWith({
          'http-equiv': 'Content-Security-Policy',
          content: "default-src 'self'",
        });
      });

      it('should apply a policy built from CspDirectives object', () => {
        const policy = new CspPolicyBuilder().defaultSrc("'self'").build();
        service.applyPolicy(policy);
        expect(metaSpy.updateTag).toHaveBeenCalledWith({
          'http-equiv': 'Content-Security-Policy',
          content: "default-src 'self'",
        });
      });
    });

    describe('auditPolicy', () => {
      it('should pass on a secure policy', () => {
        const policy = new CspPolicyBuilder().defaultSrc("'none'").scriptSrc("'self'").build();

        const report = service.auditPolicy(policy);
        expect(report.isValid).toBe(true);
        // Should only have the default info message about dynamic meta tags
        expect(report.issues.length).toBe(1);
        expect(report.issues[0].severity).toBe('info');
      });

      it('should report error when default-src is missing', () => {
        const policy = new CspPolicyBuilder().scriptSrc("'self'").build();
        const report = service.auditPolicy(policy);

        expect(report.isValid).toBe(false);
        const error = report.issues.find((i) => i.severity === 'error');
        expect(error).toBeDefined();
        expect(error?.directive).toBe('default-src');
        expect(error?.message).toContain("missing 'default-src'");
      });

      it('should report error when wildcard * is used in script-src, default-src or connect-src', () => {
        const policy = new CspPolicyBuilder().defaultSrc("'self'").scriptSrc('*').build();

        const report = service.auditPolicy(policy);
        expect(report.isValid).toBe(false);
        const error = report.issues.find(
          (i) => i.directive === 'script-src' && i.severity === 'error',
        );
        expect(error).toBeDefined();
        expect(error?.message).toContain('wildcard');
      });

      it('should report warning when wildcard * is used in style-src, img-src, etc.', () => {
        const policy = new CspPolicyBuilder().defaultSrc("'self'").imgSrc('*').build();

        const report = service.auditPolicy(policy);
        expect(report.isValid).toBe(true); // Warning doesn't make it invalid
        const warning = report.issues.find(
          (i) => i.directive === 'img-src' && i.severity === 'warning',
        );
        expect(warning).toBeDefined();
        expect(warning?.message).toContain('wildcard');
      });

      it('should report error when unsafe-inline is used in script-src without nonce or hash', () => {
        const policy = new CspPolicyBuilder()
          .defaultSrc("'self'")
          .scriptSrc("'unsafe-inline'")
          .build();

        const report = service.auditPolicy(policy);
        expect(report.isValid).toBe(false);
        const error = report.issues.find(
          (i) => i.directive === 'script-src' && i.severity === 'error',
        );
        expect(error).toBeDefined();
        expect(error?.message).toContain("'unsafe-inline' without nonces");
      });

      it('should pass when unsafe-inline is used in script-src with a nonce', () => {
        const policy = new CspPolicyBuilder()
          .defaultSrc("'self'")
          .scriptSrc(["'unsafe-inline'", "'nonce-abc123xyz'"])
          .build();

        const report = service.auditPolicy(policy);
        expect(report.isValid).toBe(true);
      });

      it('should pass when unsafe-inline is used in script-src with strict-dynamic', () => {
        const policy = new CspPolicyBuilder()
          .defaultSrc("'self'")
          .scriptSrc(["'unsafe-inline'", "'strict-dynamic'", "'nonce-abc'"])
          .build();

        const report = service.auditPolicy(policy);
        expect(report.isValid).toBe(true);
      });

      it('should report warnings for directives unsupported in meta tags', () => {
        const policy = new CspPolicyBuilder()
          .defaultSrc("'self'")
          .frameAncestors("'none'")
          .sandbox('allow-scripts')
          .build();

        const report = service.auditPolicy(policy);
        expect(report.isValid).toBe(true); // Warnings only
        const metaWarnings = report.issues.filter((i) => i.severity === 'warning');
        expect(metaWarnings.length).toBe(2);
        expect(metaWarnings.some((w) => w.directive === 'frame-ancestors')).toBe(true);
        expect(metaWarnings.some((w) => w.directive === 'sandbox')).toBe(true);
      });

      it('should audit CSP policy from a raw string', () => {
        const rawPolicy = "script-src 'self' *; style-src 'unsafe-inline'";
        const report = service.auditPolicy(rawPolicy);

        expect(report.isValid).toBe(false);
        expect(
          report.issues.some((i) => i.directive === 'default-src' && i.severity === 'error'),
        ).toBe(true);
        expect(
          report.issues.some((i) => i.directive === 'script-src' && i.severity === 'error'),
        ).toBe(true);
        expect(
          report.issues.some((i) => i.directive === 'style-src' && i.severity === 'error'),
        ).toBe(true);
      });
    });
  });
});
