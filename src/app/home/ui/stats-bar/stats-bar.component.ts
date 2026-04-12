import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import type { Stat } from '../../models/stat.model';

@Component({
  selector: 'app-stats-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div role="list" class="grid grid-cols-2 sm:grid-cols-4 border-b border-base-300">
      @for (s of stats(); track s.label; let i = $index) {
        <div
          role="listitem"
          class="flex flex-col items-center py-6 px-4 gap-1 border-r border-base-300 even:border-r-0 sm:even:border-r sm:[&:last-child]:border-r-0 [&:nth-child(n+3)]:border-t border-base-300 sm:[&:nth-child(n+3)]:border-t-0"
        >
          <span class="text-3xl font-extrabold text-base-content tracking-tight leading-none">
            {{ s.value }}
          </span>
          <span class="text-xs text-base-content/40 font-medium text-center leading-snug">
            {{ s.label }}
          </span>
        </div>
      }
    </div>
  `,
})
export class StatsBarComponent {
  readonly stats = input.required<readonly Stat[]>();
}
