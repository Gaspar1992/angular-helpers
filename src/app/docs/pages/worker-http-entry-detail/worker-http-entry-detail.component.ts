import { Component, inject, computed, signal, ChangeDetectionStrategy, Type } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
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
import { TransportDemoComponent } from '../../../demo/worker-http/services/transport/transport-demo.component';
import { HmacDemoComponent } from '../../../demo/worker-http/services/hmac/hmac-demo.component';
import { HashingDemoComponent } from '../../../demo/worker-http/services/hashing/hashing-demo.component';
import { InterceptorsDemoComponent } from '../../../demo/worker-http/services/interceptors/interceptors-demo.component';
import { SerializerDemoComponent } from '../../../demo/worker-http/services/serializer/serializer-demo.component';
import { BackendDemoComponent } from '../../../demo/worker-http/services/backend/backend-demo.component';

const ENTRY_DEMO_MAP: Record<string, Type<unknown>> = {
  transport: TransportDemoComponent,
  interceptors: InterceptorsDemoComponent,
  serializer: SerializerDemoComponent,
  backend: BackendDemoComponent,
  crypto: HmacDemoComponent,
};

const CONTENT_TABS: DocTab[] = [
  { id: 'api', label: 'API Reference' },
  { id: 'example', label: 'Example' },
  { id: 'demo', label: 'Demo' },
];

@Component({
  selector: 'app-worker-http-entry-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    NgComponentOutlet,
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

        <section class="mb-8">
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
                <div class="mt-6">
                  <h3 class="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-4">
                    Related interfaces
                  </h3>
                  @for (iface of interfaces(); track $index) {
                    <div class="mb-8">
                      <h4 class="text-sm font-bold text-base-content/80 mb-2 font-mono">
                        {{ iface.name }}
                      </h4>
                      <p class="text-sm text-base-content/60 mb-3">{{ iface.description }}</p>
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
            @if (activeTab() === 'demo') {
              @if (demoComponent()) {
                <ng-container *ngComponentOutlet="demoComponent()!" />
              } @else {
                <p class="text-sm text-base-content/60">
                  No interactive demo available for this entry point yet.
                </p>
              }
            }
          </div>
        </section>
      </div>
    } @else {
      <div class="pt-8">
        <h1 class="text-2xl font-bold text-base-content mb-2">Entry point not found</h1>
        <p class="text-base text-base-content/70 mb-4">
          The requested entry point does not exist in this package.
        </p>
        <a routerLink="/docs/worker-http" class="text-primary hover:underline text-sm"
          >← Back to worker-http</a
        >
      </div>
    }
  `,
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

  protected demoComponent = computed<Type<unknown> | null>(
    () => ENTRY_DEMO_MAP[this.entryId()] ?? null,
  );
}
