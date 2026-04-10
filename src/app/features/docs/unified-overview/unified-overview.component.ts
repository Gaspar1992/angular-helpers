import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CodeBlockComponent } from '../../../ui/code-block/code-block.component';
import { DocsPageHeaderComponent } from '../../../ui/page-header/docs-page-header.component';
import { BreadcrumbItem, ServiceDoc } from '../../../docs/models/doc-meta.model';

export interface OverviewConfig {
  /** Package name shown in title and badge */
  packageName: string;
  /** NPM package name for badge */
  npmPackage: string;
  /** Description lead text */
  lead: string;
  /** Provider setup example code */
  providerExample: string;
  /** Service groups for display */
  serviceGroups: ServiceGroup[];
  /** Base route for service links (e.g., '/docs/browser-web-apis') */
  baseRoute: string;
}

export interface ServiceGroup {
  label: string;
  icon: string;
  /** Service items - can be partial ServiceDoc with at least id, name, description */
  items: Array<Pick<ServiceDoc, 'id' | 'name' | 'description'>>;
}

@Component({
  selector: 'app-unified-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CodeBlockComponent, DocsPageHeaderComponent],
  template: `
    <div class="docs-page">
      <app-docs-page-header
        [breadcrumbs]="breadcrumbs()"
        [title]="config().packageName"
        [badge]="config().npmPackage"
        badgeVariant="npm"
        [lead]="config().lead"
      />

      <section class="docs-section">
        <h2 class="docs-section-title">Installation</h2>
        <app-code-block language="bash" [code]="'npm install ' + config().npmPackage" />
      </section>

      <section class="docs-section">
        <h2 class="docs-section-title">Setup</h2>
        <p class="docs-section-text">Register the providers once in your application bootstrap:</p>
        <app-code-block [code]="config().providerExample" />
      </section>

      <section class="docs-section">
        <h2 class="docs-section-title">Services</h2>
        @for (group of config().serviceGroups; track group.label) {
          <div class="service-group">
            <h3 class="group-label">{{ group.icon }} {{ group.label }}</h3>
            <div class="services-list">
              @for (svc of group.items; track svc.id) {
                <a [routerLink]="config().baseRoute + '/' + svc.id" class="service-card">
                  <span class="svc-name">{{ svc.name }}</span>
                  <span class="svc-desc">{{ svc.description }}</span>
                </a>
              }
            </div>
          </div>
        }
      </section>
    </div>
  `,
  styles: [
    `
      .service-group {
        margin-bottom: var(--sp-6);
      }

      h3.group-label {
        font-size: 0.82rem;
        font-weight: 700;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.07em;
        margin: 0 0 var(--sp-3);
      }

      .services-list {
        display: grid;
        grid-template-columns: 1fr;
        gap: var(--sp-2);
      }

      @media (min-width: 480px) {
        .services-list {
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        }
      }

      .service-card {
        display: flex;
        flex-direction: column;
        gap: var(--sp-1);
        padding: var(--sp-3) var(--sp-4);
        background: var(--bg-surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        text-decoration: none;
        transition:
          border-color var(--transition),
          background var(--transition);
      }

      .service-card:hover {
        border-color: var(--accent);
        background: var(--accent-hover);
      }

      .service-card:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 2px;
      }

      .svc-name {
        font-size: var(--text-base);
        font-weight: 600;
        color: #c0c8e0;
        font-family: var(--font-mono);
      }

      .svc-desc {
        font-size: var(--text-sm);
        color: var(--text-muted);
        line-height: 1.5;
      }
    `,
  ],
})
export class UnifiedOverviewComponent {
  /** Resolved config from router */
  readonly config = input.required<OverviewConfig>();

  /** Breadcrumbs computed from config */
  protected breadcrumbs = (): BreadcrumbItem[] => [
    { label: 'Docs', route: '/docs' },
    { label: this.config().packageName },
  ];
}
