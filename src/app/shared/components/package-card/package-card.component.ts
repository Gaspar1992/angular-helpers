import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { PackageInfo } from '../../models/package-info.model';

@Component({
  selector: 'app-package-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  styleUrl: './package-card.component.css',
  template: `
    <div class="split-card">
      <div class="split-card-header">
        <span class="split-icon" aria-hidden="true">{{ pkg().icon }}</span>
        <div>
          <h3>
            {{ pkg().name }}
            @if (pkg().badge) {
              <span class="preview-badge">{{ pkg().badge }}</span>
            }
          </h3>
          <code class="pkg-pill">{{ pkg().npmPackage }}</code>
        </div>
      </div>
      <p class="split-card-body">{{ pkg().description }}</p>
      <ul class="feature-list" [attr.aria-label]="pkg().highlightsLabel">
        @for (item of pkg().highlights; track item) {
          <li>{{ item }}</li>
        }
      </ul>
      <div class="card-actions">
        <div class="install-chip">
          <code>{{ pkg().installCmd }}</code>
        </div>
        @if (pkg().docsLink) {
          <a [routerLink]="pkg().docsLink" class="card-link">Documentation →</a>
        } @else {
          <span class="card-link card-link-muted">Docs coming soon</span>
        }
      </div>
    </div>
  `,
})
export class PackageCardComponent {
  readonly pkg = input.required<PackageInfo>();
}
