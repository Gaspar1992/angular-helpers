import { Component, input, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DocsHistoryService } from '../../services/docs-history.service';

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

        <button
          class="btn btn-ghost btn-circle bookmark-btn"
          (click)="toggleBookmark()"
          [attr.aria-label]="isBookmarked() ? 'Remove from bookmarks' : 'Add to bookmarks'"
          id="bookmark-toggle"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            [class.filled]="isBookmarked()"
            class="star-icon"
          >
            <path
              d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
            />
          </svg>
        </button>
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
          width: 100%;
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

        .bookmark-btn {
          margin-inline-start: auto;
          color: var(--c-warning, #f59e0b);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 9999px;
          background: transparent;
          border: none;
          transition: background-color 0.2s;

          &:hover {
            background-color: var(--c-bg-hover, rgba(0, 0, 0, 0.05));
          }
        }

        .star-icon {
          width: var(--spacing-6);
          height: var(--spacing-6);
          fill: none;
          stroke: currentColor;
          stroke-width: 2;
          transition:
            fill 0.2s,
            transform 0.2s;

          &.filled {
            fill: currentColor;
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

  private readonly router = inject(Router);
  private readonly historyService = inject(DocsHistoryService);

  private getCleanPath(): string {
    return this.router.url.split(/[?#]/)[0];
  }

  isBookmarked(): boolean {
    return this.historyService.isBookmarked(this.getCleanPath());
  }

  toggleBookmark(): void {
    this.historyService.toggleBookmark(this.getCleanPath());
  }
}
