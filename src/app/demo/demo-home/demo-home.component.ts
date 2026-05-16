import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PUBLIC_DEMO_SECTIONS } from '../config/demo.config';

@Component({
  selector: 'app-demo-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="max-width-container py-12 sm:py-20">
      <header class="text-center mb-16 px-4">
        <p class="text-xs font-black uppercase tracking-[0.2em] text-primary m-0 mb-4">
          Interactive Demos
        </p>
        <h1
          class="text-[2.5rem] sm:text-[3.5rem] font-black text-base-content tracking-tighter leading-none m-0 mb-6"
        >
          Explore Angular Helpers
        </h1>
        <p
          class="text-lg text-base-content/50 leading-relaxed max-w-[520px] mx-auto m-0 mb-10 font-medium"
        >
          Live, interactive demonstrations built with signals, OnPush, and modern Angular patterns.
        </p>
        <div class="flex gap-3 justify-center flex-wrap">
          <span class="badge badge-primary font-bold px-4">Angular 20+</span>
          <span class="badge badge-secondary font-bold px-4">Signals</span>
          <span class="badge badge-accent font-bold px-4">OnPush</span>
        </div>
      </header>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 px-4 sm:px-6">
        @for (section of sections; track section.path) {
          <a
            [routerLink]="section.path"
            class="flex flex-col gap-6 p-8 bg-base-200 border border-base-content/5 rounded-3xl no-underline text-base-content transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-2xl focus-visible:outline-2 focus-visible:outline-primary relative overflow-hidden group shadow-sm"
          >
            <div
              class="p-4 bg-base-content/5 rounded-2xl border border-base-content/10 shadow-inner w-fit group-hover:scale-110 transition-transform duration-300"
            >
              <span class="text-4xl leading-none shrink-0 drop-shadow-md">{{ section.icon }}</span>
            </div>

            <div>
              <h2
                class="text-xl font-black text-base-content m-0 mb-2 tracking-tight group-hover:text-primary transition-colors"
              >
                {{ section.title }}
              </h2>
              <code
                class="text-[10px] font-mono text-primary/90 bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-lg"
              >
                {{ section.packageName }}
              </code>
            </div>

            <p class="text-sm text-base-content/50 leading-relaxed m-0 flex-1 font-medium">
              {{ section.description }}
            </p>

            <span
              class="text-sm font-bold text-primary flex items-center gap-1.5 mt-6 group-hover:translate-x-1 transition-transform"
            >
              <span>Open demo</span>
              <span aria-hidden="true">→</span>
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
