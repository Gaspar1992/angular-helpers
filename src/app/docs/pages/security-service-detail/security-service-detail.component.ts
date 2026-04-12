import { Component, inject, computed, signal, ChangeDetectionStrategy, Type } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { CodeBlockComponent } from '../../shared/code-block/code-block.component';
import { DocsPageHeaderComponent } from '../../shared/page-header/docs-page-header.component';
import { DocsApiTableComponent } from '../../shared/api-table/docs-api-table.component';
import { DocsTabsComponent, type DocTab } from '../../shared/tabs/docs-tabs.component';
import { SECURITY_SERVICES, SECURITY_INTERFACES } from '../../data/security.data';
import {
  ServiceDoc,
  BreadcrumbItem,
  ApiRow,
  METHODS_COLUMNS,
  FIELDS_COLUMNS,
} from '../../models/doc-meta.model';
import { RegexSecurityDemoComponent } from '../../../demo/security/services/regex-security/regex-security-demo.component';
import { WebCryptoDemoComponent } from '../../../demo/security/services/web-crypto/web-crypto-demo.component';
import { SecureStorageDemoComponent } from '../../../demo/security/services/secure-storage/secure-storage-demo.component';

const SERVICE_DEMO_MAP: Record<string, Type<unknown>> = {
  'regex-security': RegexSecurityDemoComponent,
  'web-crypto': WebCryptoDemoComponent,
  'secure-storage': SecureStorageDemoComponent,
};

const CONTENT_TABS: DocTab[] = [
  { id: 'api', label: 'API Reference' },
  { id: 'example', label: 'Example' },
  { id: 'demo', label: 'Demo' },
];

@Component({
  selector: 'app-security-service-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    NgComponentOutlet,
    DocsPageHeaderComponent,
    DocsApiTableComponent,
    CodeBlockComponent,
    DocsTabsComponent,
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
  protected readonly fieldsColumns = FIELDS_COLUMNS;
  protected readonly contentTabs = CONTENT_TABS;
  protected activeTab = signal<string>('api');

  protected serviceId = toSignal(this.route.paramMap.pipe(map((p) => p.get('service') ?? '')), {
    initialValue: '',
  });

  protected service = computed<ServiceDoc | undefined>(() =>
    SECURITY_SERVICES.find((s) => s.id === this.serviceId()),
  );

  protected breadcrumbs = computed<BreadcrumbItem[]>(() => [
    { label: 'Docs', route: '/docs' },
    { label: 'security', route: '/docs/security' },
    { label: this.service()?.name ?? '' },
  ]);

  protected badge = computed(() => {
    const s = this.service();
    return s ? `import { ${s.name} } from '${s.importPath}'` : '';
  });

  protected methodRows = computed<ApiRow[]>(
    () => (this.service()?.methods ?? []) as unknown as ApiRow[],
  );

  protected interfaces = computed(() => {
    const id = this.serviceId();
    return id === 'regex-security' ? SECURITY_INTERFACES : [];
  });

  protected demoComponent = computed<Type<unknown> | null>(
    () => SERVICE_DEMO_MAP[this.serviceId()] ?? null,
  );
}
