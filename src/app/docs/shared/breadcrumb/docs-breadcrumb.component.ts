import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BreadcrumbItem } from '../../models/doc-meta.model';

@Component({
  selector: 'app-docs-breadcrumb',
  imports: [RouterLink],
  template: `
    <nav class="docs-breadcrumb" aria-label="Breadcrumb">
      @for (item of items(); track $index) {
        @if (item.route) {
          <a [routerLink]="item.route">{{ item.label }}</a>
        } @else {
          <span>{{ item.label }}</span>
        }
        @if (!$last) {
          <span aria-hidden="true">›</span>
        }
      }
    </nav>
  `,
})
export class DocsBreadcrumbComponent {
  readonly items = input.required<BreadcrumbItem[]>();
}
