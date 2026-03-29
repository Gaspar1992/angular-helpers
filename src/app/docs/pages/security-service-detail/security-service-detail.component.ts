import { Component, inject, computed, signal, ChangeDetectionStrategy } from '@angular/core';
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

const CONTENT_TABS: DocTab[] = [
  { id: 'api', label: 'API Reference' },
  { id: 'example', label: 'Example' },
];

@Component({
  selector: 'app-security-service-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    DocsPageHeaderComponent,
    DocsApiTableComponent,
    CodeBlockComponent,
    DocsTabsComponent,
  ],
  template: `
    @if (service()) {
      <div class="docs-page">
        <app-docs-page-header
          [breadcrumbs]="breadcrumbs()"
          [title]="service()!.name"
          [titleMono]="true"
          [badge]="badge()"
          badgeVariant="import"
          [lead]="service()!.description"
          [scope]="service()!.scope"
        />

        <section class="docs-section">
          <app-docs-tabs
            [tabs]="contentTabs"
            [activeTab]="activeTab()"
            ariaLabel="Service documentation"
            (tabChange)="activeTab.set($event)"
          />
          <div
            role="tabpanel"
            [id]="'panel-' + activeTab()"
            [attr.aria-labelledby]="'tab-' + activeTab()"
          >
            @if (activeTab() === 'api') {
              <app-docs-api-table
                [columns]="methodsColumns"
                [rows]="methodRows()"
                ariaLabel="API methods"
              />
              @if (interfaces().length) {
                <div class="iface-section">
                  <h3 class="iface-section-title">Related interfaces</h3>
                  @for (iface of interfaces(); track $index) {
                    <div class="iface-block">
                      <h4 class="iface-name">{{ iface.name }}</h4>
                      <p class="iface-desc">{{ iface.description }}</p>
                      <app-docs-api-table
                        [columns]="fieldsColumns"
                        [rows]="iface.fields"
                        [ariaLabel]="iface.name + ' fields'"
                      />
                    </div>
                  }
                </div>
              }
            }
            @if (activeTab() === 'example') {
              <app-code-block [code]="service()!.example" />
            }
          </div>
        </section>
      </div>
    } @else {
      <div class="not-found">
        <h1 class="docs-page-title">Service not found</h1>
        <p class="docs-page-lead" style="max-width: none">
          The requested service does not exist in this package.
        </p>
        <a routerLink="/docs/security">← Back to security</a>
      </div>
    }
  `,
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

  private serviceId = toSignal(this.route.paramMap.pipe(map((p) => p.get('service') ?? '')), {
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
}
