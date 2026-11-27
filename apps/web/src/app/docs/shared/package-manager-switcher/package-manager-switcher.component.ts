import { Component, computed, inject, input, signal } from '@angular/core';
import {
  PackageManagerService,
  type PackageManager,
} from '../../../core/services/package-manager.service';

@Component({
  selector: 'app-package-manager-switcher',
  template: `
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-base-200 border border-border-subtle"
    >
      <div class="flex items-center gap-1.5" role="tablist" aria-label="Package manager">
        @for (pm of managers; track pm) {
          <button
            type="button"
            role="tab"
            [attr.aria-selected]="pmService.current() === pm"
            class="px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            [class.bg-primary]="pmService.current() === pm"
            [class.text-primary-content]="pmService.current() === pm"
            [class.text-base-content/60]="pmService.current() !== pm"
            [class.hover:text-base-content]="pmService.current() !== pm"
            (click)="pmService.setPackageManager(pm)"
          >
            {{ pm }}
          </button>
        }
      </div>

      <div
        class="flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl bg-base-100 border border-base-300 font-mono text-xs sm:text-sm"
      >
        <code class="text-base-content/90 select-all">{{ command() }}</code>
        <button
          type="button"
          class="btn btn-xs btn-ghost font-bold"
          [class.text-success]="copied()"
          (click)="copy()"
          [attr.aria-label]="copied() ? 'Install command copied' : 'Copy install command'"
        >
          {{ copied() ? 'Copied' : 'Copy' }}
        </button>
      </div>
    </div>
  `,
})
export class PackageManagerSwitcherComponent {
  readonly pkg = input.required<string>();
  protected readonly pmService = inject(PackageManagerService);
  protected readonly managers: readonly PackageManager[] = ['pnpm', 'npm', 'yarn', 'bun'];
  protected readonly copied = signal(false);
  protected readonly command = computed(() => this.pmService.getInstallCommand(this.pkg()));

  protected copy(): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(this.command()).then(() => {
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), 1800);
      });
    }
  }
}
