import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-docs-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <header class="docs-page-header">
      <div class="header-top">
        <h1 [class]="'docs-page-title' + (titleMono() ? ' title-mono' : '')">
          {{ title() }}
        </h1>

        @if (badge()) {
          <span class="docs-badge" [attr.data-variant]="badgeVariant()">
            {{ badge() }}
          </span>
        }
      </div>

      <p class="docs-page-lead">{{ lead() }}</p>

      @if (scope() || requiresSecureContext()) {
        <div class="header-meta">
          @if (scope()) {
            <span class="meta-chip scope">providedIn: {{ scope() }}</span>
          }
          @if (requiresSecureContext()) {
            <span class="meta-chip secure">🔒 Requires HTTPS</span>
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
          align-items: baseline;
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

        .docs-badge {
          @apply inline-block text-[0.7rem] font-bold px-3 py-1 rounded-md font-mono lowercase;

          &[data-variant='npm'] {
            @apply bg-primary/10 text-primary border border-primary/20;
          }

          &[data-variant='import'] {
            @apply bg-success/10 text-success border border-success/20;
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

        .header-meta {
          display: flex;
          gap: var(--spacing-2);
          margin-block-start: var(--spacing-6);
          flex-wrap: wrap;

          .meta-chip {
            font-size: var(--fs-xs);
            font-weight: 700;
            padding-inline: var(--spacing-2-5);
            padding-block: var(--spacing-1);
            border-radius: var(--r-sm);

            &.scope {
              background-color: var(--c-primary-dim);
              color: var(--c-primary);
              border: 1px solid color-mix(in oklch, var(--c-primary), transparent 80%);
            }

            &.secure {
              background-color: color-mix(in oklch, #f59e0b, transparent 90%);
              color: #f59e0b;
              border: 1px solid color-mix(in oklch, #f59e0b, transparent 80%);
            }
          }
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
