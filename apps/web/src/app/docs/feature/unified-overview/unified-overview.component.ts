import { Component, effect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../../core/services/seo.service';
import { CodeBlockComponent } from '../../../docs/shared/code-block/code-block.component';
import { DocsPageHeaderComponent } from '../../../docs/shared/page-header/docs-page-header.component';
import { PackageManagerSwitcherComponent } from '../../../docs/shared/package-manager-switcher/package-manager-switcher.component';

export interface ServiceGroupItem {
  id: string;
  name: string;
  description: string;
  experimental?: boolean;
}

export interface ServiceGroup {
  label: string;
  icon: string;
  items: ServiceGroupItem[];
}

export interface OverviewConfig {
  packageName: string;
  npmPackage: string;
  lead: string;
  providerExample: string;
  serviceGroups: ServiceGroup[];
}

@Component({
  selector: 'app-unified-overview',
  imports: [
    RouterLink,
    CodeBlockComponent,
    DocsPageHeaderComponent,
    PackageManagerSwitcherComponent,
  ],
  template: `
    <div class="max-w-[900px] mx-auto py-12 sm:py-16">
      <app-docs-page-header
        [title]="config().packageName"
        badge="npm"
        badgeVariant="npm"
        [lead]="config().lead"
      />

      <div class="mt-6 mb-8">
        <app-package-manager-switcher [pkg]="config().npmPackage" />
      </div>

      @if (config().serviceGroups.length > 1) {
        <nav
          aria-label="On this page"
          class="flex flex-wrap items-center gap-2 mb-8 text-xs font-bold"
        >
          <span class="uppercase tracking-widest text-base-content/50 mr-1">On this page:</span>
          @for (group of config().serviceGroups; track group.label) {
            <a
              [href]="'#group-' + groupId(group.label)"
              class="px-3 py-1 rounded-full bg-base-200 border border-border-subtle text-base-content/70 hover:text-primary hover:border-primary/40 no-underline transition-colors"
            >
              {{ group.icon }} {{ group.label }}
            </a>
          }
        </nav>
      }

      <div class="my-10">
        <app-code-block language="ts" filename="main.ts" [code]="config().providerExample" />
      </div>

      @for (group of config().serviceGroups; track group.label) {
        <section class="mt-16 scroll-mt-20" [id]="'group-' + groupId(group.label)">
          <h2
            class="text-2xl font-black text-base-content flex items-center gap-4 mb-8 tracking-tight"
          >
            <div
              class="p-3 bg-base-content/5 rounded-xl border border-base-content/10 shadow-inner"
            >
              <span class="text-2xl leading-none">{{ group.icon }}</span>
            </div>
            {{ group.label }}
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            @for (service of group.items; track service.id) {
              <a
                [routerLink]="[service.id]"
                queryParamsHandling="merge"
                class="flex flex-col p-8 bg-base-200 border border-base-content/5 rounded-[2rem] transition-all hover:border-primary/40 hover:shadow-2xl group no-underline shadow-sm"
              >
                <h3
                  class="text-lg font-black text-base-content m-0 mb-3 tracking-tight group-hover:text-primary transition-colors"
                >
                  {{ service.name }}
                </h3>
                <p
                  class="text-sm text-base-content/50 leading-relaxed m-0 flex-1 font-medium"
                  [innerHTML]="service.description"
                ></p>
                <div
                  class="flex items-center gap-1.5 text-primary text-sm font-bold mt-6 group-hover:translate-x-1 transition-transform"
                >
                  <span>Explore API</span>
                  <span>→</span>
                </div>
              </a>
            }
          </div>
        </section>
      }
    </div>
  `,
  styles: [],
})
export class UnifiedOverviewComponent {
  readonly config = input.required<OverviewConfig>();
  private readonly seo = inject(SeoService);

  constructor() {
    effect(() => {
      const cfg = this.config();
      this.seo.updateMetadata({
        title: cfg.packageName,
        description: cfg.lead,
      });
    });
  }

  protected groupId(label: string): string {
    return label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }
}
