import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import type { Feature } from '../../models/feature.model';

@Component({
  selector: 'app-feature-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './feature-card.component.css',
  template: `
    <div class="feature-card">
      <span class="feature-icon" aria-hidden="true">{{ feature().icon }}</span>
      <h3>{{ feature().title }}</h3>
      <p>{{ feature().desc }}</p>
    </div>
  `,
})
export class FeatureCardComponent {
  readonly feature = input.required<Feature>();
}
