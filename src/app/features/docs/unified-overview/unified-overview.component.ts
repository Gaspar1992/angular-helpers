import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CodeBlockComponent } from '../../../docs/shared/code-block/code-block.component';
import { DocsPageHeaderComponent } from '../../../docs/shared/page-header/docs-page-header.component';
import { BreadcrumbItem, ServiceDoc } from '../../../docs/models/doc-meta.model';

export interface ServiceGroup {
  label: string;
  icon: string;
  items: ServiceDoc[];
}

export interface OverviewConfig {
  packageName: string;
  npmPackage: string;
  lead: string;
  providerExample: string;
  serviceGroups: ServiceGroup[];
}

@Component({
  selector: 'app-unified-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CodeBlockComponent, DocsPageHeaderComponent],
  template: `
    <div class="unified-overview">
      <app-docs-page-header
        [breadcrumbs]="breadcrumbs"
        [title]="config().packageName"
        badge="npm"
        badgeVariant="npm"
        [lead]="config().lead"
      />

      <app-code-block language="ts" filename="main.ts" [code]="config().providerExample" />

      @for (group of config().serviceGroups; track group.label) {
        <section class="service-group">
          <h2 class="group-title">
            <span class="group-icon">{{ group.icon }}</span>
            {{ group.label }}
          </h2>
          <div class="service-grid">
            @for (service of group.items; track service.id) {
              <a [routerLink]="[service.id]" class="service-card">
                <h3 class="service-name">{{ service.name }}</h3>
                <p class="service-desc">{{ service.description }}</p>
                <span class="service-arrow">→</span>
              </a>
            }
          </div>
        </section>
      }
    </div>
  `,
  styles: [
    `
      .unified-overview {
        padding: var(--sp-6) 0;
      }

      .lead {
        font-size: var(--text-lg);
        color: var(--text-muted);
        margin: var(--sp-4) 0 var(--sp-6);
        line-height: 1.6;
      }

      .service-group {
        margin-top: var(--sp-8);
      }

      .group-title {
        display: flex;
        align-items: center;
        gap: var(--sp-2);
        font-size: var(--text-xl);
        font-weight: 700;
        margin: 0 0 var(--sp-4);
        color: var(--text);
      }

      .group-icon {
        font-size: 1.2em;
      }

      .service-grid {
        display: grid;
        gap: var(--sp-4);
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      }

      .service-card {
        display: flex;
        flex-direction: column;
        padding: var(--sp-4);
        background: var(--bg-elevated);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        text-decoration: none;
        color: var(--text);
        transition: all var(--transition);
      }

      .service-card:hover {
        border-color: var(--accent);
        transform: translateY(-2px);
      }

      .service-name {
        font-size: var(--text-base);
        font-weight: 600;
        margin: 0 0 var(--sp-2);
      }

      .service-desc {
        font-size: var(--text-sm);
        color: var(--text-muted);
        margin: 0;
        flex: 1;
      }

      .service-arrow {
        align-self: flex-end;
        color: var(--accent);
        font-weight: 600;
      }
    `,
  ],
})
export class UnifiedOverviewComponent {
  readonly config = input.required<OverviewConfig>();

  protected get breadcrumbs(): BreadcrumbItem[] {
    return [{ label: 'docs', route: '/docs' }, { label: this.config().packageName }];
  }
}
