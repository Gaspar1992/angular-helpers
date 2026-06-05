import { Component, input } from '@angular/core';
import type { Stat } from '../../models/stat.model';

@Component({
  selector: 'app-stats-bar',
  template: `
    <div
      role="list"
      class="grid grid-cols-2 sm:grid-cols-4 border-b border-base-content/5 bg-base-content/5"
    >
      @for (s of stats(); track s.label; let i = $index) {
        <div
          role="listitem"
          class="flex flex-col items-center py-10 px-4 gap-2 border-r border-base-content/5 even:border-r-0 sm:even:border-r sm:[&:last-child]:border-r-0 [&:nth-child(n+3)]:border-t border-base-content/5 sm:[&:nth-child(n+3)]:border-t-0"
        >
          <span class="text-4xl font-black text-base-content tracking-tighter leading-none">
            {{ s.value }}
          </span>
          <span
            class="text-[11px] font-black uppercase tracking-[0.2em] text-base-content/30 text-center leading-snug"
          >
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
