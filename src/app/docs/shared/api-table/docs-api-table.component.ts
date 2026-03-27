import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { ApiColumn, ApiRow } from '../../models/doc-meta.model';

@Component({
  selector: 'app-docs-api-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-table-wrapper" role="region" [attr.aria-label]="ariaLabel()">
      <table class="docs-table">
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
                    <span class="docs-cell-desc">{{ row[col.key] }}</span>
                  }
                </td>
              }
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class DocsApiTableComponent {
  readonly columns = input.required<ApiColumn[]>();
  readonly rows = input.required<ApiRow[]>();
  readonly ariaLabel = input('API reference');
}
