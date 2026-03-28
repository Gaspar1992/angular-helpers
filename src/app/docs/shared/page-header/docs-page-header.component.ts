import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { BreadcrumbItem } from '../../models/doc-meta.model';
import { DocsBreadcrumbComponent } from '../breadcrumb/docs-breadcrumb.component';

@Component({
  selector: 'app-docs-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DocsBreadcrumbComponent],
  template: `
    <div class="docs-page-header">
      <app-docs-breadcrumb [items]="breadcrumbs()" />

      <h1 [class]="'docs-page-title' + (titleMono() ? ' title-mono' : '')">
        {{ title() }}
      </h1>

      @if (badge()) {
        <code [class]="'docs-badge docs-badge--' + badgeVariant()">
          {{ badge() }}
        </code>
      }

      <p class="docs-page-lead">{{ lead() }}</p>

      @if (scope() || requiresSecureContext()) {
        <div class="docs-meta-chips">
          @if (scope()) {
            <span class="docs-chip docs-chip--scope">providedIn: {{ scope() }}</span>
          }
          @if (requiresSecureContext()) {
            <span class="docs-chip docs-chip--secure">🔒 Requires HTTPS</span>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .title-mono {
        font-family: var(--font-mono);
      }
    `,
  ],
})
export class DocsPageHeaderComponent {
  readonly breadcrumbs = input.required<BreadcrumbItem[]>();
  readonly title = input.required<string>();
  readonly titleMono = input(false);
  readonly badge = input<string>();
  readonly badgeVariant = input<'npm' | 'import'>('npm');
  readonly lead = input.required<string>();
  readonly scope = input<string>();
  readonly requiresSecureContext = input(false);
}
