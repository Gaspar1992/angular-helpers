import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  viewChildren,
} from '@angular/core';

export interface DocTab {
  id: string;
  label: string;
}

@Component({
  selector: 'app-docs-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tabs-container" role="tablist" [attr.aria-label]="ariaLabel()">
      @for (tab of tabs(); track tab.id; let i = $index) {
        <button
          #tabBtn
          role="tab"
          type="button"
          class="tab-btn"
          [class.active]="activeTab() === tab.id"
          [attr.aria-selected]="activeTab() === tab.id"
          [attr.tabindex]="activeTab() === tab.id ? 0 : -1"
          [id]="'tab-' + tab.id"
          [attr.aria-controls]="'panel-' + tab.id"
          (click)="tabChange.emit(tab.id)"
          (keydown)="onKeydown($event, i)"
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

  private readonly tabButtons = viewChildren<ElementRef<HTMLButtonElement>>('tabBtn');

  protected onKeydown(event: KeyboardEvent, index: number): void {
    const list = this.tabs();
    if (!list.length) return;

    let nextIndex = -1;
    if (event.key === 'ArrowRight') {
      nextIndex = (index + 1) % list.length;
    } else if (event.key === 'ArrowLeft') {
      nextIndex = (index - 1 + list.length) % list.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = list.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    const targetTab = list[nextIndex];
    this.tabChange.emit(targetTab.id);
    this.tabButtons()[nextIndex]?.nativeElement.focus();
  }
}
