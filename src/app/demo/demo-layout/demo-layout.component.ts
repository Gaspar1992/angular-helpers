import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

interface DemoTab {
  path: string;
  label: string;
  icon: string;
}

const DEMO_TABS: DemoTab[] = [
  { path: '/demo', label: 'Home', icon: '🏠' },
  { path: '/demo/browser-apis', label: 'Browser APIs', icon: '🌐' },
  { path: '/demo/security', label: 'Security', icon: '🔐' },
  { path: '/demo/worker-http', label: 'Worker HTTP', icon: '⚡' },
  { path: '/demo/library-services', label: 'Library', icon: '📦' },
];

@Component({
  selector: 'app-demo-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="min-h-screen bg-base-100 text-base-content flex flex-col font-sans">
      <!-- Header -->
      <header class="sticky top-0 z-50 bg-base-200 border-b border-base-300">
        <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3 md:gap-6">
          <!-- Logo -->
          <a routerLink="/" class="flex items-center gap-2 no-underline group">
            <span class="text-2xl">⚡</span>
            <span
              class="font-semibold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
            >
              Angular Helpers
            </span>
          </a>

          <!-- Desktop Nav -->
          <nav class="hidden md:flex gap-1 flex-1 justify-center">
            @for (tab of tabs; track tab.path) {
              <a
                [routerLink]="tab.path"
                routerLinkActive="bg-primary text-primary-content"
                [routerLinkActiveOptions]="{ exact: tab.path === '/demo' }"
                class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-base-content/80 hover:text-base-content hover:bg-base-300/50 transition-colors no-underline"
              >
                <span>{{ tab.icon }}</span>
                <span>{{ tab.label }}</span>
              </a>
            }
          </nav>

          <!-- Docs Link -->
          <a
            routerLink="/docs"
            class="hidden sm:block text-sm font-medium text-primary hover:underline whitespace-nowrap"
          >
            Documentation →
          </a>
        </div>

        <!-- Mobile Bottom Nav -->
        <nav
          class="fixed bottom-0 left-0 right-0 bg-base-200 border-t border-base-300 md:hidden z-50"
        >
          <div class="flex justify-around py-2">
            @for (tab of tabs; track tab.path) {
              <a
                [routerLink]="tab.path"
                routerLinkActive="text-primary"
                [routerLinkActiveOptions]="{ exact: tab.path === '/demo' }"
                class="flex flex-col items-center gap-1 px-3 py-1 text-xs text-base-content/80 hover:text-base-content no-underline"
              >
                <span class="text-lg">{{ tab.icon }}</span>
                <span class="text-xs">{{ tab.label }}</span>
              </a>
            }
          </div>
        </nav>
      </header>

      <!-- Main -->
      <main class="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full pb-20 md:pb-6">
        <router-outlet />
      </main>
    </div>
  `,
})
export class DemoLayoutComponent {
  protected readonly tabs = DEMO_TABS;
}
