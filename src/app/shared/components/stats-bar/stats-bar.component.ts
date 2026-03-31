import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import type { Stat } from '../../models/stat.model';

@Component({
  selector: 'app-stats-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './stats-bar.component.css',
  template: `
    <div class="stats-bar" role="list">
      @for (s of stats(); track s.label) {
        <div class="stat" role="listitem">
          <span class="stat-value">{{ s.value }}</span>
          <span class="stat-label">{{ s.label }}</span>
        </div>
      }
    </div>
  `,
})
export class StatsBarComponent {
  readonly stats = input.required<readonly Stat[]>();
}
