import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';

export interface DocTab {
  id: string;
  label: string;
}

@Component({
  selector: 'app-docs-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tabs-container" role="tablist" [attr.aria-label]="ariaLabel()">
      @for (tab of tabs(); track tab.id) {
        <button
          role="tab"
          type="button"
          class="tab-btn"
          [class.active]="activeTab() === tab.id"
          [attr.aria-selected]="activeTab() === tab.id"
          [id]="'tab-' + tab.id"
          [attr.aria-controls]="'panel-' + tab.id"
          (click)="tabChange.emit(tab.id)"
        >
          {{ tab.label }}
        </button>
      }
    </div>
  `,
  styles: [
    `
      .tabs-container {
        display: flex;
        align-items: center;
        gap: var(--space-1);
        border-block-end: 2px solid var(--c-border-subtle);
        margin-block-end: var(--space-8);

        .tab-btn {
          padding: var(--space-2) var(--space-4);
          font-size: var(--fs-sm);
          font-weight: 600;
          color: var(--c-text-muted);
          background: transparent;
          border: none;
          border-block-end: 2px solid transparent;
          margin-block-end: -2px;
          cursor: pointer;
          transition: all var(--t-fast);
          white-space: nowrap;

          &:hover {
            color: var(--c-text-main);
            background-color: var(--c-border-subtle);
          }

          &.active {
            color: var(--c-text-main);
            border-block-end-color: var(--c-primary);
          }

          &:focus-visible {
            outline: 2px solid var(--c-primary);
            outline-offset: -2px;
            border-radius: 4px;
          }
        }
      }
    `,
  ],
})
export class DocsTabsComponent {
  readonly tabs = input.required<DocTab[]>();
  readonly activeTab = input.required<string>();
  readonly ariaLabel = input('Content tabs');
  readonly tabChange = output<string>();
}
