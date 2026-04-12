import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-2 focus:z-[9999] focus:bg-primary focus:text-primary-content focus:px-4 focus:py-2 focus:rounded-b focus:font-semibold focus:no-underline"
    >
      Skip to content
    </a>
    <header
      class="flex items-center justify-between px-4 sm:px-6 h-[52px] sm:h-[56px] bg-[rgba(10,10,20,0.94)] backdrop-blur-[14px] border-b border-base-300 sticky top-0 z-[100]"
      role="banner"
    >
      <a
        routerLink="/"
        class="flex items-center gap-2 no-underline text-base-content transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-primary focus-visible:rounded-sm"
        aria-label="Angular Helpers home"
      >
        <img src="icon.webp" alt="" class="w-7 h-7 object-contain" aria-hidden="true" />
        <span class="font-bold text-[0.9rem] sm:text-base tracking-[-0.02em]">Angular Helpers</span>
      </a>

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
  protected readonly navItems = [
    { label: 'Docs', path: '/docs' },
    { label: 'Demo', path: '/demo' },
    { label: 'Blog', path: '/blog' },
  ] as const;
}
