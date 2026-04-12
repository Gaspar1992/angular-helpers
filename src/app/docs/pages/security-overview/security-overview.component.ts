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

      <section class="mb-8">
        <h2 class="text-xl font-bold text-base-content mb-4">Installation</h2>
        <app-code-block language="bash" [code]="'npm install @angular-helpers/security'" />
      </section>

      <section class="mb-8">
        <h2 class="text-xl font-bold text-base-content mb-4">Quick Start</h2>
        <p class="text-sm text-base-content/70 mb-4">
          Register all security providers in your application bootstrap:
        </p>
        <app-code-block [code]="providerExample" />
      </section>

      <section class="mb-8">
        <h2 class="text-xl font-bold text-base-content mb-4">Individual Providers</h2>
        <p class="text-sm text-base-content/70 mb-4">
          Use only the services you need for smaller bundle size:
        </p>
        <app-code-block [code]="individualProvidersExample" />
      </section>

      <section class="mb-8">
        <h2 class="text-xl font-bold text-base-content mb-6">Services</h2>

        <!-- ReDoS Protection -->
        <div class="mb-6">
          <h3 class="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-3">
            🛡️ ReDoS Protection
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            <a
              [routerLink]="'/docs/security/regex-security'"
              class="bg-base-200 border border-base-300 rounded-xl p-4 flex flex-col gap-1 hover:border-primary hover:bg-primary/5 transition-colors no-underline"
            >
              <span class="text-sm font-semibold text-base-content font-mono"
                >RegexSecurityService</span
              >
              <span class="text-xs text-base-content/60"
                >Safe regex execution in Web Workers with timeout protection</span
              >
            </a>
            <a
              [routerLink]="'/docs/security/regex-security-builder'"
              class="bg-base-200 border border-base-300 rounded-xl p-4 flex flex-col gap-1 hover:border-primary hover:bg-primary/5 transition-colors no-underline"
            >
              <span class="text-sm font-semibold text-base-content font-mono"
                >RegexSecurityBuilder</span
              >
              <span class="text-xs text-base-content/60"
                >Fluent API for building secure regular expressions</span
              >
            </a>
          </div>
        </div>

        <!-- Web Crypto -->
        <div class="mb-6">
          <h3 class="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-3">
            🔐 Web Crypto
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            <a
              [routerLink]="'/docs/security/web-crypto'"
              class="bg-base-200 border border-base-300 rounded-xl p-4 flex flex-col gap-1 hover:border-primary hover:bg-primary/5 transition-colors no-underline"
            >
              <span class="text-sm font-semibold text-base-content font-mono"
                >WebCryptoService</span
              >
              <span class="text-xs text-base-content/60"
                >AES-GCM encryption, HMAC signing, SHA hashing</span
              >
            </a>
          </div>
        </div>

        <!-- Storage Security -->
        <div class="mb-6">
          <h3 class="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-3">
            🗄️ Storage Security
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            <a
              [routerLink]="'/docs/security/secure-storage'"
              class="bg-base-200 border border-base-300 rounded-xl p-4 flex flex-col gap-1 hover:border-primary hover:bg-primary/5 transition-colors no-underline"
            >
              <span class="text-sm font-semibold text-base-content font-mono"
                >SecureStorageService</span
              >
              <span class="text-xs text-base-content/60"
                >Encrypted localStorage with PBKDF2 key derivation</span
              >
            </a>
          </div>
        </div>

        <!-- Input Validation -->
        <div class="mb-6">
          <h3 class="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-3">
            ✓ Input Validation
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            <a
              [routerLink]="'/docs/security/input-sanitizer'"
              class="bg-base-200 border border-base-300 rounded-xl p-4 flex flex-col gap-1 hover:border-primary hover:bg-primary/5 transition-colors no-underline"
            >
              <span class="text-sm font-semibold text-base-content font-mono"
                >InputSanitizerService</span
              >
              <span class="text-xs text-base-content/60"
                >XSS prevention, URL validation, HTML escaping</span
              >
            </a>
            <a
              [routerLink]="'/docs/security/password-strength'"
              class="bg-base-200 border border-base-300 rounded-xl p-4 flex flex-col gap-1 hover:border-primary hover:bg-primary/5 transition-colors no-underline"
            >
              <span class="text-sm font-semibold text-base-content font-mono"
                >PasswordStrengthService</span
              >
              <span class="text-xs text-base-content/60"
                >Entropy-based password strength evaluation</span
              >
            </a>
          </div>
        </div>
      </section>

      <!-- Risk Levels -->
      <section class="mb-8">
        <h2 class="text-xl font-bold text-base-content mb-6">Risk Levels</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <!-- Low -->
          <div class="bg-success/10 border border-success/30 rounded-xl p-4">
            <div class="flex items-start gap-3">
              <span class="w-2.5 h-2.5 rounded-full bg-success mt-1.5 flex-shrink-0"></span>
              <div>
                <strong class="block text-sm font-semibold text-success mb-1">Low</strong>
                <p class="text-xs text-base-content/70 leading-relaxed">
                  Simple, safe patterns with no backtracking risks.
                </p>
              </div>
            </div>
          </div>
          <!-- Medium -->
          <div class="bg-warning/10 border border-warning/30 rounded-xl p-4">
            <div class="flex items-start gap-3">
              <span class="w-2.5 h-2.5 rounded-full bg-warning mt-1.5 flex-shrink-0"></span>
              <div>
                <strong class="block text-sm font-semibold text-warning mb-1">Medium</strong>
                <p class="text-xs text-base-content/70 leading-relaxed">
                  Patterns with lookahead / lookbehind assertions.
                </p>
              </div>
            </div>
          </div>
          <!-- High -->
          <div class="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
            <div class="flex items-start gap-3">
              <span class="w-2.5 h-2.5 rounded-full bg-orange-500 mt-1.5 flex-shrink-0"></span>
              <div>
                <strong class="block text-sm font-semibold text-orange-500 mb-1">High</strong>
                <p class="text-xs text-base-content/70 leading-relaxed">
                  Complex quantifiers that may cause slow matching.
                </p>
              </div>
            </div>
          </div>
          <!-- Critical -->
          <div class="bg-error/10 border border-error/30 rounded-xl p-4">
            <div class="flex items-start gap-3">
              <span class="w-2.5 h-2.5 rounded-full bg-error mt-1.5 flex-shrink-0"></span>
              <div>
                <strong class="block text-sm font-semibold text-error mb-1">Critical</strong>
                <p class="text-xs text-base-content/70 leading-relaxed">
                  Catastrophic backtracking — blocked in safe mode.
                </p>
              </div>
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
