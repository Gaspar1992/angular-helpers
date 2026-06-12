import { Injectable, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';

export interface CspDirectives {
  'default-src'?: string[];
  'script-src'?: string[];
  'style-src'?: string[];
  'img-src'?: string[];
  'connect-src'?: string[];
  'font-src'?: string[];
  'frame-src'?: string[];
  'object-src'?: string[];
  'media-src'?: string[];
  'child-src'?: string[];
  'worker-src'?: string[];
  'manifest-src'?: string[];
  'base-uri'?: string[];
  'form-action'?: string[];
  'frame-ancestors'?: string[];
  'report-uri'?: string[];
  'report-to'?: string[];
  sandbox?: string[];
  'upgrade-insecure-requests'?: boolean | string[];
  'block-all-mixed-content'?: boolean | string[];
  [key: string]: string[] | boolean | undefined;
}

export interface CspAuditIssue {
  severity: 'error' | 'warning' | 'info';
  directive?: string;
  message: string;
}

export interface CspAuditReport {
  isValid: boolean;
  issues: CspAuditIssue[];
}

/**
 * Serializes a CspDirectives object into a standard CSP policy string.
 */
export function serializeCsp(directives: CspDirectives): string {
  const parts: string[] = [];
  for (const [key, val] of Object.entries(directives)) {
    if (val === undefined || val === null) {
      continue;
    }
    if (typeof val === 'boolean') {
      if (val) {
        parts.push(key);
      }
    } else if (Array.isArray(val)) {
      if (val.length > 0) {
        parts.push(`${key} ${val.join(' ')}`);
      } else {
        parts.push(key);
      }
    } else if (typeof val === 'string') {
      parts.push(`${key} ${val}`);
    }
  }
  return parts.join('; ');
}

/**
 * Parses a CSP policy string into a CspDirectives object.
 */
export function parseCsp(policy: string): CspDirectives {
  const directives: CspDirectives = {};
  const tokens = policy
    .split(';')
    .map((t) => t.trim())
    .filter(Boolean);
  for (const token of tokens) {
    const spaceIndex = token.indexOf(' ');
    if (spaceIndex === -1) {
      const key = token;
      if (key === 'upgrade-insecure-requests' || key === 'block-all-mixed-content') {
        directives[key] = true;
      } else {
        directives[key] = [];
      }
    } else {
      const key = token.substring(0, spaceIndex);
      const val = token
        .substring(spaceIndex + 1)
        .split(/\s+/)
        .filter(Boolean);
      directives[key] = val;
    }
  }
  return directives;
}

/**
 * Fluent builder for creating Content Security Policy (CSP) directives.
 */
export class CspPolicyBuilder {
  private directives: CspDirectives = {};

  defaultSrc(values: string[] | string): this {
    this.directives['default-src'] = Array.isArray(values) ? values : [values];
    return this;
  }

  scriptSrc(values: string[] | string): this {
    this.directives['script-src'] = Array.isArray(values) ? values : [values];
    return this;
  }

  styleSrc(values: string[] | string): this {
    this.directives['style-src'] = Array.isArray(values) ? values : [values];
    return this;
  }

  imgSrc(values: string[] | string): this {
    this.directives['img-src'] = Array.isArray(values) ? values : [values];
    return this;
  }

  connectSrc(values: string[] | string): this {
    this.directives['connect-src'] = Array.isArray(values) ? values : [values];
    return this;
  }

  fontSrc(values: string[] | string): this {
    this.directives['font-src'] = Array.isArray(values) ? values : [values];
    return this;
  }

  frameSrc(values: string[] | string): this {
    this.directives['frame-src'] = Array.isArray(values) ? values : [values];
    return this;
  }

  objectSrc(values: string[] | string): this {
    this.directives['object-src'] = Array.isArray(values) ? values : [values];
    return this;
  }

  mediaSrc(values: string[] | string): this {
    this.directives['media-src'] = Array.isArray(values) ? values : [values];
    return this;
  }

  childSrc(values: string[] | string): this {
    this.directives['child-src'] = Array.isArray(values) ? values : [values];
    return this;
  }

  workerSrc(values: string[] | string): this {
    this.directives['worker-src'] = Array.isArray(values) ? values : [values];
    return this;
  }

  manifestSrc(values: string[] | string): this {
    this.directives['manifest-src'] = Array.isArray(values) ? values : [values];
    return this;
  }

  baseUri(values: string[] | string): this {
    this.directives['base-uri'] = Array.isArray(values) ? values : [values];
    return this;
  }

  formAction(values: string[] | string): this {
    this.directives['form-action'] = Array.isArray(values) ? values : [values];
    return this;
  }

  frameAncestors(values: string[] | string): this {
    this.directives['frame-ancestors'] = Array.isArray(values) ? values : [values];
    return this;
  }

  reportUri(values: string[] | string): this {
    this.directives['report-uri'] = Array.isArray(values) ? values : [values];
    return this;
  }

  reportTo(values: string[] | string): this {
    this.directives['report-to'] = Array.isArray(values) ? values : [values];
    return this;
  }

  sandbox(values: string[] | string): this {
    this.directives['sandbox'] = Array.isArray(values) ? values : [values];
    return this;
  }

  upgradeInsecureRequests(value = true): this {
    this.directives['upgrade-insecure-requests'] = value;
    return this;
  }

  blockAllMixedContent(value = true): this {
    this.directives['block-all-mixed-content'] = value;
    return this;
  }

  set(directive: string, values: string[] | string | boolean): this {
    if (typeof values === 'boolean') {
      this.directives[directive] = values;
    } else {
      this.directives[directive] = Array.isArray(values) ? values : [values];
    }
    return this;
  }

  build(): CspDirectives {
    return { ...this.directives };
  }

  toString(): string {
    return serializeCsp(this.directives);
  }
}

/**
 * Service for dynamically applying and auditing Content Security Policies (CSP).
 */
@Injectable({
  providedIn: 'root',
})
export class CspService {
  private readonly meta = inject(Meta);

  /**
   * Applies the CSP policy dynamically by adding or updating a <meta http-equiv="Content-Security-Policy"> tag.
   */
  applyPolicy(policy: string | CspDirectives): void {
    const content = typeof policy === 'string' ? policy : serializeCsp(policy);

    this.meta.updateTag({
      'http-equiv': 'Content-Security-Policy',
      content,
    });
  }

  /**
   * Performs static analysis on a CSP policy and reports potential vulnerabilities or errors.
   */
  auditPolicy(policy: string | CspDirectives): CspAuditReport {
    const directives = typeof policy === 'string' ? parseCsp(policy) : policy;
    const issues: CspAuditIssue[] = [];

    // 1. Missing default-src
    const defaultSrc = directives['default-src'];
    if (!defaultSrc || defaultSrc.length === 0) {
      issues.push({
        severity: 'error',
        directive: 'default-src',
        message:
          "CSP policy is missing 'default-src' directive. It is recommended to set 'default-src \\'none\\'' and selectively override.",
      });
    }

    // 2. Wildcards in sensitive directives
    const sensitiveDirectives = [
      'default-src',
      'script-src',
      'style-src',
      'connect-src',
      'img-src',
      'font-src',
      'object-src',
      'frame-src',
    ];
    for (const dir of sensitiveDirectives) {
      const val = directives[dir];
      if (Array.isArray(val) && val.includes('*')) {
        if (['default-src', 'script-src', 'connect-src'].includes(dir)) {
          issues.push({
            severity: 'error',
            directive: dir,
            message: `Directive '${dir}' contains the wildcard '*'. This allows loading or executing resources from any external origin.`,
          });
        } else {
          issues.push({
            severity: 'warning',
            directive: dir,
            message: `Directive '${dir}' contains the wildcard '*'. Consider restricting this to trusted origins.`,
          });
        }
      }
    }

    // 3. 'unsafe-inline' without safety fallback (nonces or hashes or strict-dynamic)
    const inlineSensitiveDirectives = ['default-src', 'script-src', 'style-src'];
    for (const dir of inlineSensitiveDirectives) {
      const val = directives[dir];
      if (Array.isArray(val) && val.includes("'unsafe-inline'")) {
        const hasNonce = val.some((v) => v.startsWith("'nonce-"));
        const hasHash = val.some(
          (v) => v.startsWith("'sha256-") || v.startsWith("'sha384-") || v.startsWith("'sha512-"),
        );
        const hasStrictDynamic = dir === 'script-src' && val.includes("'strict-dynamic'");

        if (!hasNonce && !hasHash && !hasStrictDynamic) {
          issues.push({
            severity: 'error',
            directive: dir,
            message: `Directive '${dir}' allows 'unsafe-inline' without nonces, hashes, or 'strict-dynamic'. This renders your application vulnerable to Cross-Site Scripting (XSS).`,
          });
        }
      }
    }

    // 4. Directives not supported in meta tags
    const unsupportedMetaDirectives = ['frame-ancestors', 'sandbox', 'report-uri', 'report-to'];
    for (const dir of unsupportedMetaDirectives) {
      if (directives[dir] !== undefined) {
        issues.push({
          severity: 'warning',
          directive: dir,
          message: `Directive '${dir}' is defined in the policy, but it is not supported or ignored when delivered via HTML <meta> tags.`,
        });
      }
    }

    // 5. Always add the general dynamic meta warning/info
    issues.push({
      severity: 'info',
      message:
        'Policies applied dynamically via <meta http-equiv="Content-Security-Policy"> only affect resources loaded after the tag is inserted.',
    });

    const isValid = !issues.some((issue) => issue.severity === 'error');

    return {
      isValid,
      issues,
    };
  }
}
