import { Component, input } from '@angular/core';

@Component({
  selector: 'app-docs-page-header',
  imports: [],
  template: `
    <header class="docs-page-header">
      <div class="header-top">
        <h1 [class]="'docs-page-title' + (titleMono() ? ' title-mono' : '')">
          {{ title() }}
        </h1>

        @if (badge()) {
          <span class="badge badge-primary font-mono ml-3 select-none">
            {{ badge() }}
          </span>
        }
      </div>

      <p class="docs-page-lead" [innerHTML]="lead()"></p>

      @if (scope() || requiresSecureContext()) {
        <div class="header-meta flex gap-3 mt-6">
          @if (scope()) {
            <span class="badge badge-primary font-mono select-none">providedIn: {{ scope() }}</span>
          }
          @if (requiresSecureContext()) {
            <span class="badge badge-warning font-mono select-none">🔒 Requires HTTPS</span>
          }
        </div>
      }
    </header>
  `,
  styles: [
    `
      @reference "../../../../styles.css";

      .docs-page-header {
        margin-block-end: var(--spacing-10);

        .header-top {
          display: flex;
          align-items: center;
          gap: var(--spacing-4);
          flex-wrap: wrap;
        }

        .docs-page-title {
          margin-block-end: 0;
          font-size: var(--fs-h1);
          @apply text-base-content;

          &.title-mono {
            font-family: var(--font-mono);
            font-weight: 700;
          }
        }

        .docs-page-lead {
          margin-block-start: var(--spacing-4);
          color: var(--c-text-secondary);
          font-size: var(--fs-lg);
          max-inline-size: 65ch;
          line-height: 1.6;
          text-wrap: pretty;
        }
      }
    `,
  ],
})
export class DocsPageHeaderComponent {
  readonly title = input.required<string>();
  readonly titleMono = input(false);
  readonly badge = input<string>();
  readonly badgeVariant = input<'npm' | 'import'>('npm');
  readonly lead = input.required<string>();
  readonly scope = input<string>();
  readonly requiresSecureContext = input(false);
}
