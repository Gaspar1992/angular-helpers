import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { ApiColumn, ApiRow } from '../../models/doc-meta.model';

@Component({
  selector: 'app-docs-api-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="api-table-container no-scrollbar" role="region" [attr.aria-label]="ariaLabel()">
      <table>
        <thead>
          <tr>
            @for (col of columns(); track col.key) {
              <th scope="col">{{ col.header }}</th>
            }
          </tr>
        </thead>
        <tbody>
          @for (row of rows(); track $index) {
            <tr>
              @for (col of columns(); track col.key) {
                <td>
                  @if (col.cellClass !== 'docs-cell-desc') {
                    <code [class]="col.cellClass">{{ row[col.key] }}</code>
                  } @else {
                    <span class="docs-cell-desc" [innerHTML]="row[col.key]"></span>
                  }
                </td>
              }
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: [
    `
      .api-table-container {
        overflow-x: auto;
        border: 1px solid var(--c-border);
        border-radius: var(--r-xl);
        background-color: var(--c-bg-surface);

        table {
          inline-size: 100%;
          border-collapse: collapse;
          font-size: var(--fs-base);

          thead {
            background-color: color-mix(in oklch, var(--c-bg-surface), white 3%);

            th {
              padding-inline: var(--spacing-4);
              padding-block: var(--spacing-3);
              text-align: start;
              font-size: var(--fs-xs);
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.1em;
              color: var(--c-text-muted);
              border-block-end: 1px solid var(--c-border);
            }
          }

          tbody td {
            padding: var(--spacing-4);
            border-block-end: 1px solid var(--c-border-subtle);
            vertical-align: top;

            code {
              background-color: rgba(255, 255, 255, 0.04);
              color: var(--c-primary);
              border: 1px solid rgba(255, 255, 255, 0.06);
              padding-inline: 0.5rem;
              padding-block: 0.2rem;
              border-radius: var(--r-md);
              font-size: 0.8rem;
              font-family: var(--font-mono);
              font-weight: 600;
              letter-spacing: normal;
            }

            .docs-cell-desc {
              font-size: var(--fs-sm);
              color: var(--c-text-secondary);
              line-height: 1.6;
            }
          }

          tr:last-child td {
            border-block-end: none;
          }
          tr:hover td {
            background-color: color-mix(in oklch, var(--c-text-main), transparent 97%);
          }
        }
      }
    `,
  ],
})
export class DocsApiTableComponent {
  readonly columns = input.required<ApiColumn[]>();
  readonly rows = input.required<ApiRow[]>();
  readonly ariaLabel = input('API reference');
}
