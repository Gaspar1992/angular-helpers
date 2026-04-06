import { Component, inject, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { CodeBlockComponent } from '../../shared/code-block/code-block.component';
import { DocsPageHeaderComponent } from '../../shared/page-header/docs-page-header.component';
import { DocsApiTableComponent } from '../../shared/api-table/docs-api-table.component';
import { DocsTabsComponent, type DocTab } from '../../shared/tabs/docs-tabs.component';
import { WORKER_HTTP_ENTRIES, WORKER_HTTP_INTERFACES } from '../../data/worker-http.data';
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
  selector: 'app-worker-http-entry-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    DocsPageHeaderComponent,
    DocsApiTableComponent,
    CodeBlockComponent,
    DocsTabsComponent,
  ],
  template: `
    @if (entry()) {
      <div class="docs-page">
        <app-docs-page-header
          [breadcrumbs]="breadcrumbs()"
          [title]="entry()!.name"
          [titleMono]="true"
          [badge]="badge()"
          badgeVariant="import"
          [lead]="entry()!.description"
          [scope]="entry()!.scope"
        />

        <section class="docs-section">
          <app-docs-tabs
            [tabs]="contentTabs"
            [activeTab]="activeTab()"
            ariaLabel="Entry point documentation"
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
              <app-code-block [code]="entry()!.example" />
            }
          </div>
        </section>
      </div>
    } @else {
      <div class="not-found">
        <h1 class="docs-page-title">Entry point not found</h1>
        <p class="docs-page-lead" style="max-width: none">
          The requested entry point does not exist in this package.
        </p>
        <a routerLink="/docs/worker-http">← Back to worker-http</a>
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
export class WorkerHttpEntryDetailComponent {
  private route = inject(ActivatedRoute);

  protected readonly methodsColumns = METHODS_COLUMNS;
  protected readonly fieldsColumns = FIELDS_COLUMNS;
  protected readonly contentTabs = CONTENT_TABS;
  protected activeTab = signal<string>('api');

  private entryId = toSignal(this.route.paramMap.pipe(map((p) => p.get('entry') ?? '')), {
    initialValue: '',
  });

  protected entry = computed<ServiceDoc | undefined>(() =>
    WORKER_HTTP_ENTRIES.find((e) => e.id === this.entryId()),
  );

  protected breadcrumbs = computed<BreadcrumbItem[]>(() => [
    { label: 'Docs', route: '/docs' },
    { label: 'worker-http', route: '/docs/worker-http' },
    { label: this.entry()?.name ?? '' },
  ]);

  protected badge = computed(() => {
    const e = this.entry();
    return e ? `import { ${e.name} } from '${e.importPath}'` : '';
  });

  protected methodRows = computed<ApiRow[]>(
    () => (this.entry()?.methods ?? []) as unknown as ApiRow[],
  );

  protected interfaces = computed(() => {
    const id = this.entryId();
    switch (id) {
      case 'transport':
        return WORKER_HTTP_INTERFACES.filter((i) =>
          ['WorkerTransportConfig', 'WorkerInterceptorFn'].includes(i.name),
        );
      case 'interceptors':
        return WORKER_HTTP_INTERFACES.filter((i) =>
          ['RetryConfig', 'CacheConfig', 'HmacSigningConfig'].includes(i.name),
        );
      case 'serializer':
        return WORKER_HTTP_INTERFACES.filter((i) => i.name === 'AutoSerializerConfig');
      default:
        return [];
    }
  });
}
