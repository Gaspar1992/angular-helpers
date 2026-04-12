import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { PackageInfo } from '../../../core/config/packages.data';

@Component({
  selector: 'app-package-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div
      class="flex flex-col gap-5 bg-base-200 border border-base-300 rounded-xl p-6 h-full transition-colors duration-150 hover:border-primary/35"
    >
      <div class="flex items-start gap-4">
        <span class="text-4xl leading-none shrink-0 mt-0.5" aria-hidden="true">{{ pkg().icon }}</span>
        <div>
          <h3 class="text-lg font-bold text-base-content m-0 mb-1 flex items-center gap-2">
            {{ pkg().name }}
            @if (pkg().badge) {
              <span class="badge badge-warning badge-sm">{{ pkg().badge }}</span>
            }
          </h3>
          <code class="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
            {{ pkg().npmPackage }}
          </code>
        </div>
      </div>

      <p class="text-sm text-base-content/60 leading-relaxed m-0">{{ pkg().description }}</p>

      <ul class="list-none p-0 m-0 flex flex-col gap-2" [attr.aria-label]="pkg().highlightsLabel">
        @for (item of pkg().highlights; track item) {
          <li class="text-xs text-base-content/40 flex items-center gap-2">
            <span class="w-1 h-1 rounded-full bg-primary shrink-0" aria-hidden="true"></span>
            {{ item }}
          </li>
        }
      </ul>

      <div class="flex flex-col gap-3 mt-auto">
        <div class="bg-base-100 border border-base-300 rounded-lg px-3 py-2 overflow-x-auto">
          <code class="font-mono text-xs text-success whitespace-nowrap">{{ pkg().installCmd }}</code>
        </div>
        @if (pkg().docsLink) {
          <a
            [routerLink]="pkg().docsLink"
            class="text-xs font-semibold text-primary hover:text-primary/80 no-underline transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:rounded-sm"
          >
            Documentation →
          </a>
        } @else {
          <span class="text-xs text-base-content/30 italic">Docs coming soon</span>
        }
      </div>
    </div>
  `,
})
export class PackageCardComponent {
  readonly pkg = input.required<PackageInfo>();
}
