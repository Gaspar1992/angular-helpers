import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { DocsVersionService, AngularVersion } from '../services/docs-version.service';

@Component({
  selector: 'app-version-dropdown',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onClickOutside($event)',
  },
  template: `
    <div class="relative inline-block text-left" #container>
      <button
        type="button"
        id="version-combobox-trigger"
        role="combobox"
        aria-haspopup="listbox"
        [attr.aria-expanded]="isOpen()"
        [attr.aria-controls]="isOpen() ? 'version-listbox' : null"
        (click)="toggleDropdown()"
        (keydown)="onKeydown($event)"
        class="flex items-center justify-between gap-2 bg-base-200/50 backdrop-blur-md text-base-content text-xs font-bold py-1.5 px-3 rounded-lg border border-border-subtle hover:border-border transition-all duration-200 cursor-pointer shadow-sm select-none"
        style="border-radius: var(--rounded-btn, 0.5rem); transition: all var(--t-fast, 150ms);"
      >
        <span>Angular {{ currentVersionDisplay() }}</span>
        <span class="text-[10px] opacity-60">▼</span>
      </button>

      @if (isOpen()) {
        <ul
          id="version-listbox"
          role="listbox"
          aria-labelledby="version-combobox-trigger"
          class="absolute right-0 mt-2 w-48 z-50 border border-border-subtle shadow-2xl py-1 focus:outline-none"
          style="
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%);
            backdrop-filter: blur(16px) saturate(180%);
            -webkit-backdrop-filter: blur(16px) saturate(180%);
            border-radius: var(--rounded-box, 0.75rem);
            border-color: var(--c-border-subtle);
          "
        >
          @for (option of options; track option.value; let idx = $index) {
            <li
              role="option"
              [id]="'version-option-' + option.value"
              [attr.aria-selected]="versionService.version() === option.value"
              (click)="selectOption(option.value)"
              [class.bg-primary/20]="highlightedIndex() === idx"
              [class.text-primary]="versionService.version() === option.value"
              class="px-4 py-2 text-xs font-bold cursor-pointer hover:bg-base-content/10 transition-colors select-none flex items-center justify-between"
            >
              <span>{{ option.label }}</span>
              @if (versionService.version() === option.value) {
                <span class="text-[10px]">✓</span>
              }
            </li>
          }
        </ul>
      }
    </div>
  `,
})
export class VersionDropdownComponent {
  protected readonly versionService = inject(DocsVersionService);
  protected readonly isOpen = signal(false);
  protected readonly highlightedIndex = signal(0);

  @ViewChild('container') container!: ElementRef;

  protected readonly options: { value: AngularVersion; label: string }[] = [
    { value: 'v22', label: 'Angular v22 (Latest)' },
    { value: 'v21', label: 'Angular v21' },
  ];

  protected currentVersionDisplay() {
    const current = this.versionService.version();
    return current === 'v22' ? 'v22 (Latest)' : 'v21';
  }

  protected toggleDropdown() {
    this.isOpen.update((v) => !v);
    if (this.isOpen()) {
      const currentVal = this.versionService.version();
      const currentIdx = this.options.findIndex((o) => o.value === currentVal);
      this.highlightedIndex.set(currentIdx >= 0 ? currentIdx : 0);
    }
  }

  protected selectOption(value: AngularVersion) {
    this.versionService.setVersion(value);
    this.isOpen.set(false);
  }

  protected onKeydown(event: KeyboardEvent) {
    if (!this.isOpen()) {
      if (event.key === 'ArrowDown' || event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        this.isOpen.set(true);
        const currentVal = this.versionService.version();
        const currentIdx = this.options.findIndex((o) => o.value === currentVal);
        this.highlightedIndex.set(currentIdx >= 0 ? currentIdx : 0);
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.highlightedIndex.update((i) => (i + 1) % this.options.length);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.highlightedIndex.update((i) => (i - 1 + this.options.length) % this.options.length);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.selectOption(this.options[this.highlightedIndex()].value);
        break;
      case 'Escape':
        event.preventDefault();
        this.isOpen.set(false);
        break;
    }
  }

  protected onClickOutside(event: Event) {
    if (this.isOpen() && this.container && !this.container.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }
}
