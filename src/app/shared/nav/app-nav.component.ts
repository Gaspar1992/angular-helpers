import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { SearchService } from '../../core/services/search.service';

@Component({
  selector: 'app-nav',
  imports: [RouterLink, RouterLinkActive, NgOptimizedImage],
  template: `
    <header
      class="flex items-center justify-between px-4 sm:px-6 h-[52px] sm:h-[56px] bg-[rgba(10,10,20,0.94)] backdrop-blur-[14px] border-b border-base-300 sticky top-0 z-[100]"
      role="banner"
    >
      <a
        routerLink="/"
        class="flex items-center gap-2 no-underline text-base-content transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-primary focus-visible:rounded-sm"
        aria-label="Angular Helpers home"
      >
        <img
          ngSrc="icon.webp"
          alt=""
          width="28"
          height="28"
          class="object-contain"
          aria-hidden="true"
        />
        <span class="font-bold text-[0.9rem] sm:text-base tracking-[-0.02em]">Angular Helpers</span>
      </a>

      <!-- Search Trigger Button -->
      <button
        type="button"
        class="group flex items-center gap-2 px-2.5 py-1.5 text-xs text-base-content/40 hover:text-base-content/85 bg-white/[0.02] hover:bg-white/[0.06] border border-base-content/5 hover:border-base-content/15 rounded-lg transition-all duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
        (click)="search.open()"
        aria-label="Open search modal"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="text-base-content/30 group-hover:text-primary transition-colors duration-200"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <span class="font-bold tracking-tight hidden sm:inline">Search...</span>
        <kbd
          class="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-base-content/5 border border-base-content/5 text-[9px] font-black text-base-content/30"
        >
          <span>Ctrl</span><span>K</span>
        </kbd>
      </button>

      <nav aria-label="Main navigation">
        <ul role="list" class="list-none m-0 p-0 flex gap-1">
          @for (item of navItems; track item.path) {
            <li>
              <a
                [routerLink]="item.path"
                routerLinkActive="bg-primary/10 text-base-content"
                [routerLinkActiveOptions]="{ exact: false }"
                class="inline-block px-3 py-1.5 text-sm font-medium text-base-content/60 no-underline rounded-md transition-colors hover:text-base-content hover:bg-white/[0.04] focus-visible:outline-2 focus-visible:outline-primary"
              >
                {{ item.label }}
              </a>
            </li>
          }
        </ul>
      </nav>
    </header>
  `,
})
export class AppNavComponent {
  protected readonly search = inject(SearchService);
  protected readonly navItems = [
    { label: 'Docs', path: '/docs' },
    { label: 'Demo', path: '/demo' },
    { label: 'Blog', path: '/blog' },
  ] as const;
}
