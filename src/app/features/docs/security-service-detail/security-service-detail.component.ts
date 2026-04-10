import { Component, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { CodeBlockComponent } from '../../../ui/code-block/code-block.component';
import { DocsPageHeaderComponent } from '../../../ui/page-header/docs-page-header.component';
import { DocsApiTableComponent } from '../../../ui/api-table/docs-api-table.component';
import { DocsTabsComponent, type DocTab } from '../../../ui/tabs/docs-tabs.component';
import { SECURITY_SERVICES, SECURITY_INTERFACES } from '../../../docs/data/security.data';
import { RegexSecurityDemoComponent } from '../../../demo/services/regex-security/regex-security-demo.component';
import { WebCryptoDemoComponent } from '../../../demo/services/web-crypto/web-crypto-demo.component';
import { SecureStorageDemoComponent } from '../../../demo/services/secure-storage/secure-storage-demo.component';
import { InputSanitizerDemoComponent } from '../../../demo/services/input-sanitizer/input-sanitizer-demo.component';
import { PasswordStrengthDemoComponent } from '../../../demo/services/password-strength/password-strength-demo.component';
import { ApiRow, METHODS_COLUMNS, FN_FIELDS_COLUMNS } from '../../../docs/models/doc-meta.model';
import { ServiceDetailConfig } from '../unified-service-detail/unified-service-detail.component';
import { CONTENT_TABS_WITH_DEMO } from '../base/detail-page-base.component';

@Component({
  selector: 'app-security-service-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    DocsPageHeaderComponent,
    DocsApiTableComponent,
    CodeBlockComponent,
    DocsTabsComponent,
    RegexSecurityDemoComponent,
    WebCryptoDemoComponent,
    SecureStorageDemoComponent,
    InputSanitizerDemoComponent,
    PasswordStrengthDemoComponent,
  ],
  templateUrl: './security-service-detail.component.html',
  styles: [
    `
      .iface-section {
        margin-top: var(--sp-6);
      }
      .iface-section-title {
        font-size: 0.82rem;
        font-weight: 700;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.07em;
        margin: 0 0 var(--sp-4);
      }
      .iface-block {
        margin-bottom: var(--sp-8);
      }
      h4.iface-name {
        font-size: 0.95rem;
        font-weight: 700;
        color: #c0c8e0;
        margin: 0 0 var(--sp-2);
        font-family: var(--font-mono);
      }
      .iface-desc {
        color: var(--text-muted);
        font-size: var(--text-base);
        margin: 0 0 var(--sp-3);
      }
      .not-found {
        padding-top: var(--sp-8);
      }
      .not-found a {
        color: var(--accent);
        text-decoration: none;
        font-size: 0.9rem;
      }
      .not-found a:hover {
        text-decoration: underline;
      }
    `,
  ],
})
export class SecurityServiceDetailComponent {
  private route = inject(ActivatedRoute);

  protected readonly methodsColumns = METHODS_COLUMNS;
  protected readonly fieldsColumns = FN_FIELDS_COLUMNS;
  protected readonly contentTabs: DocTab[] = CONTENT_TABS_WITH_DEMO;
  protected activeTab = signal<string>('api');

  // Resolved data from route
  protected resolved = toSignal(
    this.route.data.pipe(map((d) => d['config'] as ServiceDetailConfig)),
    { initialValue: null },
  );

  // Expose for template
  protected get service() {
    return this.resolved()?.service;
  }

  protected get serviceId() {
    return this.route.snapshot.paramMap.get('service') ?? '';
  }

  protected get breadcrumbs() {
    const r = this.resolved();
    return [
      { label: 'Docs', route: '/docs' },
      { label: r?.backLabel ?? '', route: r?.backRoute ?? '' },
      { label: r?.service?.name ?? '' },
    ];
  }

  protected get badge() {
    const item = this.service;
    return item ? `import { ${item.name} } from '${item.importPath}'` : '';
  }

  protected methodRows: ApiRow[] = (this.service?.methods ?? []) as unknown as ApiRow[];

  protected interfaces = SECURITY_INTERFACES.filter(() => this.serviceId === 'regex-security');
}
