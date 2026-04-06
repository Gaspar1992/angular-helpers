import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CodeBlockComponent } from '../../shared/code-block/code-block.component';
import { DocsPageHeaderComponent } from '../../shared/page-header/docs-page-header.component';
import { DocsApiTableComponent } from '../../shared/api-table/docs-api-table.component';
import { WORKER_HTTP_ENTRIES, WORKER_HTTP_INTERFACES } from '../../data/worker-http.data';
import {
  BreadcrumbItem,
  ApiRow,
  METHODS_COLUMNS_SHORT,
  FIELDS_COLUMNS,
} from '../../models/doc-meta.model';

const PROVIDER_EXAMPLE = `import { createWorkerTransport } from '@angular-helpers/worker-http/transport';
import { createWorkerPipeline } from '@angular-helpers/worker-http/interceptors';
import {
  loggingInterceptor,
  retryInterceptor,
  hmacSigningInterceptor,
} from '@angular-helpers/worker-http/interceptors';

// Create transport (main thread)
const transport = createWorkerTransport({
  workerUrl: new URL('./workers/api.worker', import.meta.url),
  maxInstances: 2,
});

// In worker: create pipeline
createWorkerPipeline([
  loggingInterceptor(),
  retryInterceptor({ maxRetries: 3 }),
  hmacSigningInterceptor({ keyMaterial }),
]);`;

@Component({
  selector: 'app-worker-http-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlockComponent, DocsPageHeaderComponent, DocsApiTableComponent],
  styleUrl: './worker-http-overview.component.css',
  templateUrl: './worker-http-overview.component.html',
})
export class WorkerHttpOverviewComponent {
  protected readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Docs', route: '/docs' },
    { label: 'worker-http' },
  ];
  protected readonly methodsShortColumns = METHODS_COLUMNS_SHORT;
  protected readonly fieldsColumns = FIELDS_COLUMNS;
  protected readonly entries = WORKER_HTTP_ENTRIES;
  protected readonly interfaces = WORKER_HTTP_INTERFACES;
  protected readonly providerExample = PROVIDER_EXAMPLE;

  protected toRows(
    methods: { name: string; signature: string; returns: string; description: string }[],
  ): ApiRow[] {
    return methods as unknown as ApiRow[];
  }
}
