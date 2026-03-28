import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { CodeBlockComponent } from '../../shared/code-block/code-block.component';
import { DocsPageHeaderComponent } from '../../shared/page-header/docs-page-header.component';
import { DocsApiTableComponent } from '../../shared/api-table/docs-api-table.component';
import { BROWSER_WEB_APIS_SERVICES } from '../../data/browser-web-apis.data';
import { ServiceDoc, BreadcrumbItem, ApiRow, METHODS_COLUMNS } from '../../models/doc-meta.model';

@Component({
  selector: 'app-service-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DocsPageHeaderComponent, DocsApiTableComponent, CodeBlockComponent],
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
          [requiresSecureContext]="service()!.requiresSecureContext"
        />

        <section class="docs-section">
          <h2 class="docs-section-title">Browser support</h2>
          <p class="docs-support-text">{{ service()!.browserSupport }}</p>
        </section>

        @if (service()!.notes.length) {
          <section class="docs-section">
            <h2 class="docs-section-title">Notes</h2>
            <ul class="docs-note-list">
              @for (note of service()!.notes; track $index) {
                <li>{{ note }}</li>
              }
            </ul>
          </section>
        }

        <section class="docs-section">
          <h2 class="docs-section-title">API reference</h2>
          <app-docs-api-table
            [columns]="methodsColumns"
            [rows]="methodRows()"
            ariaLabel="API methods"
          />
        </section>

        <section class="docs-section">
          <h2 class="docs-section-title">Example</h2>
          <app-code-block [code]="service()!.example" />
        </section>
      </div>
    } @else {
      <div class="not-found">
        <h1 class="docs-page-title">Service not found</h1>
        <p class="docs-page-lead" style="max-width: none">
          The requested service does not exist in this package.
        </p>
        <a routerLink="/docs/browser-web-apis">← Back to browser-web-apis</a>
      </div>
    }
  `,
  styles: [
    `
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
export class ServiceDetailComponent {
  private route = inject(ActivatedRoute);

  protected readonly methodsColumns = METHODS_COLUMNS;

  private serviceId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('service') ?? '')),
    { initialValue: '' },
  );

  protected service = computed<ServiceDoc | undefined>(() =>
    BROWSER_WEB_APIS_SERVICES.find((s) => s.id === this.serviceId()),
  );

  protected breadcrumbs = computed<BreadcrumbItem[]>(() => [
    { label: 'Docs', route: '/docs' },
    { label: 'browser-web-apis', route: '/docs/browser-web-apis' },
    { label: this.service()?.name ?? '' },
  ]);

  protected badge = computed(() => {
    const s = this.service();
    return s ? `import { ${s.name} } from '${s.importPath}'` : '';
  });

  protected methodRows = computed<ApiRow[]>(
    () => (this.service()?.methods ?? []) as unknown as ApiRow[],
  );
}
