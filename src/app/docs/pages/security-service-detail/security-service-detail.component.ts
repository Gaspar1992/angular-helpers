import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { CodeBlockComponent } from '../../shared/code-block/code-block.component';
import { DocsPageHeaderComponent } from '../../shared/page-header/docs-page-header.component';
import { DocsApiTableComponent } from '../../shared/api-table/docs-api-table.component';
import { SECURITY_SERVICES, SECURITY_INTERFACES } from '../../data/security.data';
import {
  ServiceDoc,
  BreadcrumbItem,
  ApiRow,
  METHODS_COLUMNS,
  FIELDS_COLUMNS,
} from '../../models/doc-meta.model';

@Component({
  selector: 'app-security-service-detail',
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
        />

        <section class="docs-section">
          <h2 class="docs-section-title">API reference</h2>
          <app-docs-api-table
            [columns]="methodsColumns"
            [rows]="methodRows()"
            ariaLabel="API methods"
          />
        </section>

        @if (interfaces().length) {
          <section class="docs-section">
            <h2 class="docs-section-title">Related interfaces</h2>
            @for (iface of interfaces(); track $index) {
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
        }

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
        <a routerLink="/docs/security">← Back to security</a>
      </div>
    }
  `,
  styles: [
    `
      .iface-block {
        margin-bottom: var(--sp-8);
      }
      h3.iface-name {
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
