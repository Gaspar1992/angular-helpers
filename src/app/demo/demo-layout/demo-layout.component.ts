import { Component, ChangeDetectionStrategy, signal, inject, NgZone } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

interface DemoSubItem {
  path: string;
  label: string;
}

interface DemoGroup {
  path?: string;
  label: string;
  icon: string;
  items?: DemoSubItem[];
}

const DEMO_GROUPS: DemoGroup[] = [
  { path: '/demo', label: 'Home', icon: '🏠' },
  {
    path: '/demo/browser-apis',
    label: 'Browser APIs',
    icon: '🌐',
  },
  {
    label: 'Security',
    icon: '🛡️',
    items: [
      { path: '/demo/security', label: 'Security Core' },
      { path: '/demo/security-utilities', label: 'Utilities' },
      { path: '/demo/security-signal-forms', label: 'Signal Forms' },
    ],
  },
  {
    label: 'Worker HTTP',
    icon: '⚡',
    items: [
      { path: '/demo/worker-http', label: 'Worker HTTP' },
      { path: '/demo/worker-http-benchmark', label: 'Benchmarks' },
    ],
  },
  { path: '/demo/openlayers', label: 'OpenLayers', icon: '🗺️' },
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
            @for (group of groups; track group.label) {
              @if (group.items) {
                <!-- Dropdown Group -->
                <div
                  class="relative group"
                  (mouseenter)="openDropdown(group.label)"
                  (mouseleave)="scheduleClose(group.label)"
                >
                  <button
                    type="button"
                    class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-base-content/80 hover:text-base-content hover:bg-base-300/50 transition-colors"
                    [class.bg-primary/10]="isActiveGroup(group)"
                    [class.text-primary]="isActiveGroup(group)"
                  >
                    <span>{{ group.icon }}</span>
                    <span>{{ group.label }}</span>
                    <span class="text-xs ml-1">▾</span>
                  </button>
                  @if (dropdownOpen() === group.label) {
                    <div
                      class="absolute top-full left-0 pt-1 z-50"
                      (mouseenter)="cancelClose()"
                      (mouseleave)="scheduleClose(group.label)"
                    >
                      <div
                        class="py-1 min-w-[160px] bg-base-200 border border-base-300 rounded-lg shadow-lg"
                      >
                        @for (item of group.items; track item.path) {
                          <a
                            [routerLink]="item.path"
                            routerLinkActive="bg-primary/10 text-primary"
                            class="block px-4 py-2 text-sm text-base-content/80 hover:text-base-content hover:bg-base-300/30 transition-colors no-underline"
                          >
                            {{ item.label }}
                          </a>
                        }
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <!-- Simple Link -->
                <a
                  [routerLink]="group.path"
                  routerLinkActive="bg-primary/10 text-primary"
                  [routerLinkActiveOptions]="{ exact: group.path === '/demo' }"
                  class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-base-content/80 hover:text-base-content hover:bg-base-300/50 transition-colors no-underline"
                >
                  <span>{{ group.icon }}</span>
                  <span>{{ group.label }}</span>
                </a>
              }
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
          <div class="flex justify-around py-2 overflow-x-auto">
            @for (group of groups; track group.label) {
              @if (group.path) {
                <a
                  [routerLink]="group.path"
                  routerLinkActive="text-primary"
                  [routerLinkActiveOptions]="{ exact: group.path === '/demo' }"
                  class="flex flex-col items-center gap-1 px-3 py-1 text-xs text-base-content/80 hover:text-base-content no-underline whitespace-nowrap"
                >
                  <span class="text-lg">{{ group.icon }}</span>
                  <span class="text-xs">{{ group.label }}</span>
                </a>
              }
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
  protected readonly groups = DEMO_GROUPS;
  protected dropdownOpen = signal<string | null>(null);
  private closeTimeout: ReturnType<typeof setTimeout> | null = null;

  protected openDropdown(label: string): void {
    this.cancelClose();
    this.dropdownOpen.set(label);
  }

  protected scheduleClose(label: string): void {
    this.cancelClose();
    this.closeTimeout = setTimeout(() => {
      this.dropdownOpen.set(null);
    }, 150);
  }

  protected cancelClose(): void {
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = null;
    }
  }

  protected isActiveGroup(group: DemoGroup): boolean {
    if (!group.items) return false;
    // Check if any item in the group is active
    return group.items.some((item) => {
      // This will be handled by routerLinkActive in the dropdown items
      return false;
    });
  }
}
