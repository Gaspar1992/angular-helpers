import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CodeBlockComponent } from '../../shared/code-block/code-block.component';
import { DocsPageHeaderComponent } from '../../shared/page-header/docs-page-header.component';
import { BreadcrumbItem } from '../../models/doc-meta.model';

const PROVIDER_EXAMPLE = `import { provideSecurity } from '@angular-helpers/security';

bootstrapApplication(AppComponent, {
  providers: [
    provideSecurity({
      // Core services (enabled by default)
      enableRegexSecurity: true,
      enableWebCrypto: true,

      // Additional services (opt-in)
      enableSecureStorage: true,
      enableInputSanitizer: true,
      enablePasswordStrength: true,

      // Global settings
      defaultTimeout: 5000,
      safeMode: false,
    }),
  ],
});`;

const INDIVIDUAL_PROVIDERS_EXAMPLE = `import {
  provideRegexSecurity,
  provideWebCrypto,
  provideSecureStorage,
  provideInputSanitizer,
  providePasswordStrength,
} from '@angular-helpers/security';

// Use only the services you need
bootstrapApplication(AppComponent, {
  providers: [
    provideSecureStorage({ storage: 'session', pbkdf2Iterations: 600_000 }),
    provideInputSanitizer({ allowedTags: ['b', 'i', 'em', 'strong'] }),
    providePasswordStrength(),
  ],
});`;

@Component({
  selector: 'app-security-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CodeBlockComponent, DocsPageHeaderComponent],
  styleUrl: './security-overview.component.css',
  template: `
    <div class="docs-page">
      <app-docs-page-header
        [breadcrumbs]="breadcrumbs"
        title="security"
        badge="@angular-helpers/security"
        badgeVariant="npm"
        lead="Comprehensive security toolkit for Angular applications. ReDoS-safe regex execution, WebCrypto utilities, encrypted storage, input sanitization, and password strength evaluation — all built with signals and tree-shakable providers."
      />

      <section class="docs-section">
        <h2 class="docs-section-title">Installation</h2>
        <app-code-block language="bash" [code]="'npm install @angular-helpers/security'" />
      </section>

      <section class="docs-section">
        <h2 class="docs-section-title">Quick Start</h2>
        <p class="docs-section-text">Register all security providers in your application bootstrap:</p>
        <app-code-block [code]="providerExample" />
      </section>

      <section class="docs-section">
        <h2 class="docs-section-title">Individual Providers</h2>
        <p class="docs-section-text">Use only the services you need for smaller bundle size:</p>
        <app-code-block [code]="individualProvidersExample" />
      </section>

      <section class="docs-section">
        <h2 class="docs-section-title">Services</h2>
        <div class="service-group">
          <h3 class="group-label">🛡️ ReDoS Protection</h3>
          <div class="services-list">
            <a [routerLink]="'/docs/security/regex-security'" class="service-card">
              <span class="svc-name">RegexSecurityService</span>
              <span class="svc-desc">Safe regex execution in Web Workers with timeout protection</span>
            </a>
            <a [routerLink]="'/docs/security/regex-security-builder'" class="service-card">
              <span class="svc-name">RegexSecurityBuilder</span>
              <span class="svc-desc">Fluent API for building secure regular expressions</span>
            </a>
          </div>
        </div>

        <div class="service-group">
          <h3 class="group-label">🔐 Web Crypto</h3>
          <div class="services-list">
            <a [routerLink]="'/docs/security/web-crypto'" class="service-card">
              <span class="svc-name">WebCryptoService</span>
              <span class="svc-desc"
                >AES-GCM encryption, HMAC signing, SHA hashing, key management</span
              >
            </a>
          </div>
        </div>

        <div class="service-group">
          <h3 class="group-label">🗄️ Storage Security</h3>
          <div class="services-list">
            <a [routerLink]="'/docs/security/secure-storage'" class="service-card">
              <span class="svc-name">SecureStorageService</span>
              <span class="svc-desc"
                >Encrypted localStorage/sessionStorage with PBKDF2 key derivation</span
              >
            </a>
          </div>
        </div>

        <div class="service-group">
          <h3 class="group-label">✓ Input Validation</h3>
          <div class="services-list">
            <a [routerLink]="'/docs/security/input-sanitizer'" class="service-card">
              <span class="svc-name">InputSanitizerService</span>
              <span class="svc-desc"
                >XSS prevention, URL validation, HTML escaping, safe JSON parsing</span
              >
            </a>
            <a [routerLink]="'/docs/security/password-strength'" class="service-card">
              <span class="svc-name">PasswordStrengthService</span>
              <span class="svc-desc">Entropy-based password strength with pattern detection</span>
            </a>
          </div>
        </div>
      </section>

      <section class="docs-section risk-section">
        <h2 class="docs-section-title">Risk Levels</h2>
        <div class="risk-grid">
          <div class="risk-card low">
            <span class="risk-dot"></span>
            <div>
              <strong>Low</strong>
              <p>Simple, safe patterns with no backtracking risks.</p>
            </div>
          </div>
          <div class="risk-card medium">
            <span class="risk-dot"></span>
            <div>
              <strong>Medium</strong>
              <p>Patterns with lookahead / lookbehind assertions.</p>
            </div>
          </div>
          <div class="risk-card high">
            <span class="risk-dot"></span>
            <div>
              <strong>High</strong>
              <p>Complex quantifiers that may cause slow matching.</p>
            </div>
          </div>
          <div class="risk-card critical">
            <span class="risk-dot"></span>
            <div>
              <strong>Critical</strong>
              <p>Catastrophic backtracking — blocked in safe mode.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
})
export class SecurityOverviewComponent {
  protected readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Docs', route: '/docs' },
    { label: 'security' },
  ];
  protected readonly providerExample = PROVIDER_EXAMPLE;
  protected readonly individualProvidersExample = INDIVIDUAL_PROVIDERS_EXAMPLE;
}
