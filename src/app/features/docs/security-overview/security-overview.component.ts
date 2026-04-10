import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CodeBlockComponent } from '../../../ui/code-block/code-block.component';
import { DocsPageHeaderComponent } from '../../../ui/page-header/docs-page-header.component';
import { BreadcrumbItem } from '../../../docs/models/doc-meta.model';
import { SECURITY_SERVICES } from '../../../docs/data/security.data';

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
  templateUrl: './security-overview.component.html',
})
export class SecurityOverviewComponent {
  protected readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Docs', route: '/docs' },
    { label: 'security' },
  ];
  protected readonly providerExample = PROVIDER_EXAMPLE;
  protected readonly individualProvidersExample = INDIVIDUAL_PROVIDERS_EXAMPLE;
}
