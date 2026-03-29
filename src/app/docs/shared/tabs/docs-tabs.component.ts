import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';

export interface DocTab {
  id: string;
  label: string;
}

@Component({
  selector: 'app-docs-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-tab-bar" role="tablist" [attr.aria-label]="ariaLabel()">
      @for (tab of tabs(); track tab.id) {
        <button
          role="tab"
          type="button"
          class="docs-tab-btn"
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
      .docs-tab-bar {
        display: flex;
        border-bottom: 2px solid var(--border);
        margin-bottom: var(--sp-5);
      }

      .docs-tab-btn {
        padding: 0.6rem 1.2rem;
        background: none;
        border: none;
        border-bottom: 2px solid transparent;
        margin-bottom: -2px;
        cursor: pointer;
        font-size: var(--text-base);
        font-family: inherit;
        font-weight: 500;
        color: var(--text-muted);
        transition:
          color var(--transition),
          border-color var(--transition);
        white-space: nowrap;
      }

      .docs-tab-btn:hover {
        color: var(--text-primary);
      }

      .docs-tab-btn:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: -2px;
        border-radius: 2px;
      }

      .docs-tab-btn.active {
        color: var(--accent);
        border-bottom-color: var(--accent);
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
