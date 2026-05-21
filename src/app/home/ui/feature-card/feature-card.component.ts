import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import type { Feature } from '../../models/feature.model';

@Component({
  selector: 'app-feature-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="flex flex-col gap-6 p-8 bg-base-200 border border-base-content/5 rounded-3xl h-full transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-2xl group shadow-sm"
    >
      <div
        class="w-14 h-14 flex items-center justify-center bg-base-content/5 rounded-2xl border border-base-content/10 shadow-inner group-hover:scale-110 transition-transform duration-300"
      >
        <span class="text-3xl leading-none" aria-hidden="true">{{ feature().icon }}</span>
      </div>
      <div>
        <h3 class="text-lg font-black text-base-content m-0 mb-3 tracking-tight">
          {{ feature().title }}
        </h3>
        <p
          class="text-sm text-base-content/50 leading-relaxed m-0 font-medium"
          [innerHTML]="feature().desc"
        ></p>
      </div>
    </div>
  `,
})
export class FeatureCardComponent {
  readonly feature = input.required<Feature>();
}
