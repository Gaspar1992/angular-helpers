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
  styles: [
    `
      .service-group {
        margin-bottom: var(--sp-6);
      }

      h3.group-label {
        font-size: 0.82rem;
        font-weight: 700;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.07em;
        margin: 0 0 var(--sp-3);
      }

      .services-list {
        display: grid;
        grid-template-columns: 1fr;
        gap: var(--sp-2);
      }

      @media (min-width: 480px) {
        .services-list {
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        }
      }

      .service-card {
        display: flex;
        flex-direction: column;
        gap: var(--sp-1);
        padding: var(--sp-3) var(--sp-4);
        background: var(--bg-surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        text-decoration: none;
        transition:
          border-color var(--transition),
          background var(--transition);
      }

      .service-card:hover {
        border-color: var(--accent);
        background: var(--accent-hover);
      }

      .service-card:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 2px;
      }

      .service-card .svc-name {
        font-size: var(--text-base);
        font-weight: 600;
        color: #c0c8e0;
        font-family: var(--font-mono);
      }

      .service-card .svc-desc {
        font-size: var(--text-sm);
        color: var(--text-muted);
        line-height: 1.5;
      }

      /* Risk grid */
      .risk-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: var(--sp-3);
      }

      @media (min-width: 480px) {
        .risk-grid {
          grid-template-columns: repeat(2, 1fr);
          gap: var(--sp-4);
        }
      }

      @media (min-width: 768px) {
        .risk-grid {
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        }
      }

      .risk-card {
        display: flex;
        align-items: flex-start;
        gap: var(--sp-3);
        padding: var(--sp-4);
        border-radius: var(--radius-lg);
        border: 1px solid;
      }

      .risk-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        flex-shrink: 0;
        margin-top: 0.35rem;
      }

      .risk-card strong {
        display: block;
        font-size: 0.9rem;
        margin-bottom: var(--sp-1);
      }

      .risk-card p {
        font-size: var(--text-sm);
        margin: 0;
        color: var(--text-secondary);
        line-height: 1.5;
      }

      .risk-card.low {
        background: rgba(80, 200, 120, 0.06);
        border-color: rgba(80, 200, 120, 0.2);
      }
      .risk-card.low .risk-dot {
        background: #50c878;
      }
      .risk-card.low strong {
        color: #50c878;
      }

      .risk-card.medium {
        background: rgba(255, 200, 0, 0.06);
        border-color: rgba(255, 200, 0, 0.2);
      }
      .risk-card.medium .risk-dot {
        background: #ffc800;
      }
      .risk-card.medium strong {
        color: #ffc800;
      }

      .risk-card.high {
        background: rgba(255, 140, 0, 0.06);
        border-color: rgba(255, 140, 0, 0.2);
      }
      .risk-card.high .risk-dot {
        background: #ff8c00;
      }
      .risk-card.high strong {
        color: #ff8c00;
      }

      .risk-card.critical {
        background: rgba(255, 60, 60, 0.06);
        border-color: rgba(255, 60, 60, 0.2);
      }
      .risk-card.critical .risk-dot {
        background: #ff3c3c;
      }
      .risk-card.critical strong {
        color: #ff3c3c;
      }
    `,
  ],
})
export class SecurityOverviewComponent {
  protected readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Docs', route: '/docs' },
    { label: 'security' },
  ];
  protected readonly providerExample = PROVIDER_EXAMPLE;
  protected readonly individualProvidersExample = INDIVIDUAL_PROVIDERS_EXAMPLE;
}
