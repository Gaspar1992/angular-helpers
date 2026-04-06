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
  template: `
    <div class="docs-page">
      <app-docs-page-header
        [breadcrumbs]="breadcrumbs"
        title="worker-http"
        badge="@angular-helpers/worker-http"
        badgeVariant="npm"
        lead="Move HTTP requests off the main thread. Typed RPC bridge, worker-side interceptor pipelines, and pluggable serialization."
      />

      <section class="docs-section">
        <h2 class="docs-section-title">Installation</h2>
        <app-code-block language="bash" [code]="'npm install @angular-helpers/worker-http'" />
      </section>

      <section class="docs-section">
        <h2 class="docs-section-title">Quick Start</h2>
        <app-code-block [code]="providerExample" />
      </section>

      <section class="docs-section">
        <h2 class="docs-section-title">Entry Points</h2>
        <div class="services-grid">
          @for (entry of entries; track entry.id) {
            <div class="svc-card">
              <h3 class="svc-name">{{ entry.name }}</h3>
              <p class="svc-desc">{{ entry.description }}</p>
              <app-docs-api-table
                [columns]="methodsShortColumns"
                [rows]="toRows(entry.methods)"
                [ariaLabel]="entry.name + ' methods'"
              />
              <div class="example-label">Example</div>
              <app-code-block [code]="entry.example" />
            </div>
          }
        </div>
      </section>

      <section class="docs-section">
        <h2 class="docs-section-title">Interfaces</h2>
        @for (iface of interfaces; track $index) {
          <div class="iface-block">
            <h3 class="iface-name">{{ iface.name }}</h3>
            <p class="iface-desc">{{ iface.description }}</p>
            <app-docs-api-table
              [columns]="fieldsColumns"
              [rows]="iface.fields"
              [ariaLabel]="iface.name + ' fields'"
            />
          </div>
        }
      </section>

      <section class="docs-section">
        <h2 class="docs-section-title">Architecture</h2>
        <div class="arch-diagram">
          <pre><code>Main thread                          Web Worker
    ────────────────────────────         ──────────────────────────────────
    Angular HttpClient                   createWorkerPipeline([
      └─ WorkerHttpBackend                 loggingInterceptor(),
           └─ WorkerTransport              retryInterceptor(&#123; maxRetries: 3 &#125;),
                └─ postMessage   ───────►  hmacSigningInterceptor(&#123; keyMaterial &#125;),
                                 ◄───────  cacheInterceptor(&#123; ttl: 60000 &#125;),
                                 transfer ])
                                 (zero-copy)
                                         fetch() ──► API Server</code></pre>
        </div>
      </section>
    </div>
  `,
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
