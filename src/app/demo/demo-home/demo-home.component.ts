import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PUBLIC_DEMO_SECTIONS } from '../config/demo.config';

@Component({
  selector: 'app-demo-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="py-8 sm:py-12">
      <header class="text-center mb-12 px-4">
        <p class="text-xs font-bold uppercase tracking-[0.1em] text-primary m-0 mb-3">
          Interactive Demos
        </p>
        <h1
          class="text-[2rem] sm:text-[2.5rem] font-black text-base-content tracking-tight leading-snug m-0 mb-4"
        >
          Explore Angular Helpers
        </h1>
        <p class="text-base text-base-content/60 leading-relaxed max-w-[520px] mx-auto m-0 mb-6">
          Live, interactive demonstrations built with signals, OnPush, and modern Angular patterns.
        </p>
        <div class="flex gap-3 justify-center flex-wrap">
          <span class="badge badge-primary badge-md font-semibold">Angular 20+</span>
          <span class="badge badge-secondary badge-md font-semibold">Signals</span>
          <span class="badge badge-accent badge-md font-semibold">OnPush</span>
        </div>
      </header>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4 sm:px-6">
        @for (section of sections; track section.path) {
          <a
            [routerLink]="section.path"
            class="flex flex-col gap-4 p-6 bg-base-200 border border-base-300 rounded-xl no-underline text-base-content transition-all duration-150 hover:-translate-y-1 hover:border-primary/35 hover:shadow-[0_8px_24px_oklch(69%_0.18_254_/_0.1)] focus-visible:outline-2 focus-visible:outline-primary"
          >
            <span class="text-4xl leading-none">{{ section.icon }}</span>

            <div>
              <h2 class="text-lg font-bold text-base-content m-0 mb-1">{{ section.title }}</h2>
              <code class="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                {{ section.packageName }}
              </code>
            </div>

            <p class="text-sm text-base-content/60 leading-relaxed m-0 flex-1">
              {{ section.description }}
            </p>

            <span class="text-xs font-semibold text-primary flex items-center gap-1 mt-auto">
              Open demo
              <span class="transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
            </span>
          </a>
        }
      </div>
    </div>
  `,
})
export class DemoHomeComponent {
  protected readonly sections = PUBLIC_DEMO_SECTIONS;
}
