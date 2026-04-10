import { Component, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { CodeBlockComponent } from '../../../ui/code-block/code-block.component';
import { DocsPageHeaderComponent } from '../../../ui/page-header/docs-page-header.component';
import { DocsApiTableComponent } from '../../../ui/api-table/docs-api-table.component';
import { DocsTabsComponent, type DocTab } from '../../../ui/tabs/docs-tabs.component';
import { WORKER_HTTP_INTERFACES } from '../../../docs/data/worker-http.data';
import { ApiRow, METHODS_COLUMNS, FN_FIELDS_COLUMNS } from '../../../docs/models/doc-meta.model';
import { ServiceDetailConfig } from '../unified-service-detail/unified-service-detail.component';
import { CONTENT_TABS } from '../base/detail-page-base.component';

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
  protected readonly fieldsColumns = FN_FIELDS_COLUMNS;
  protected readonly contentTabs: DocTab[] = CONTENT_TABS;
  protected activeTab = signal<string>('api');

  // Resolved data from route
  protected resolved = toSignal(
    this.route.data.pipe(map((d) => d['config'] as ServiceDetailConfig)),
    { initialValue: null },
  );

  // Expose for template
  protected get entry() {
    return this.resolved()?.service;
  }

  protected get entryId() {
    return this.route.snapshot.paramMap.get('entry') ?? '';
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
    const item = this.entry;
    return item ? `import { ${item.name} } from '${item.importPath}'` : '';
  }

  protected methodRows: ApiRow[] = (this.entry?.methods ?? []) as unknown as ApiRow[];

  protected interfaces = this.getInterfaces();

  private getInterfaces() {
    switch (this.entryId) {
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
  }
}
