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
  styleUrl: './worker-http-entry-detail.component.css',
  templateUrl: './worker-http-entry-detail.component.html',
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
