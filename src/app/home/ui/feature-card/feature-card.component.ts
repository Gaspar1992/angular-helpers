import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import type { Feature } from '../../models/feature.model';

@Component({
  selector: 'app-feature-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="flex flex-col gap-4 p-5 bg-base-200 border border-base-300 rounded-xl h-full transition-all duration-150 hover:-translate-y-0.5 hover:border-primary/35"
    >
      <span class="text-2xl leading-none" aria-hidden="true">{{ feature().icon }}</span>
      <div>
        <h3 class="text-sm font-bold text-base-content m-0 mb-2">{{ feature().title }}</h3>
        <p class="text-xs text-base-content/60 leading-relaxed m-0">{{ feature().desc }}</p>
      </div>
    </div>
  `,
})
export class FeatureCardComponent {
  readonly feature = input.required<Feature>();
}
