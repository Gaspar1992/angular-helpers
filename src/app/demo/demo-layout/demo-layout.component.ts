import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

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
  { path: '/demo/storage', label: 'Storage', icon: '💾' },
  { path: '/demo/library-services', label: 'Library', icon: '📦' },
];

@Component({
  selector: 'app-demo-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div
      class="min-h-screen bg-base-100 text-base-content flex flex-col font-sans selection:bg-primary/30"
    >
      <!-- Header -->
      <header class="demo-header sticky top-0 z-[100]">
        <div class="max-width-container h-[60px] flex items-center justify-between gap-4">
          <!-- Logo -->
          <a routerLink="/" class="demo-logo-link group">
            <div class="demo-logo-icon">
              <span class="text-xl">⚡</span>
            </div>
            <span
              class="font-black text-base tracking-tighter text-base-content group-hover:text-primary transition-colors"
            >
              Angular Helpers
            </span>
          </a>

          <!-- Desktop Nav -->
          <nav class="hidden md:flex gap-1 flex-1 justify-center" aria-label="Demo sections">
            @for (group of groups; track group.label) {
              @if (group.items) {
                <!-- Dropdown Group -->
                <div
                  class="relative"
                  (mouseenter)="openDropdown(group.label)"
                  (mouseleave)="scheduleClose(group.label)"
                >
                  <button
                    type="button"
                    class="demo-nav-item"
                    [class.demo-nav-item--active]="isActiveGroup(group)"
                  >
                    <span>{{ group.icon }}</span>
                    <span>{{ group.label }}</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="3"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      class="ml-0.5 opacity-30 transition-transform"
                      [class.rotate-180]="dropdownOpen() === group.label"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                  @if (dropdownOpen() === group.label) {
                    <div
                      class="absolute top-full left-1/2 -translate-x-1/2 pt-3 z-[110]"
                      (mouseenter)="cancelClose()"
                      (mouseleave)="scheduleClose(group.label)"
                    >
                      <div class="demo-dropdown">
                        <div class="demo-dropdown__label">{{ group.label }}</div>
                        @for (item of group.items; track item.path) {
                          <a
                            [routerLink]="item.path"
                            routerLinkActive="demo-dropdown__item--active"
                            class="demo-dropdown__item"
                            (click)="dropdownOpen.set(null)"
                          >
                            <span class="demo-dropdown__dot"></span>
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
                  routerLinkActive="demo-nav-item--active"
                  [routerLinkActiveOptions]="{ exact: group.path === '/demo' }"
                  class="demo-nav-item"
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
            class="hidden sm:flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-primary hover:text-primary-active no-underline transition-colors"
          >
            <span>Docs</span>
            <span>→</span>
          </a>
        </div>

        <!-- Mobile Bottom Nav -->
        <nav
          class="fixed bottom-0 left-0 right-0 bg-base-200/90 backdrop-blur-lg border-t border-base-content/10 md:hidden z-[100] px-2 py-1 shadow-2xl"
        >
          <div class="flex justify-around py-1 overflow-x-auto no-scrollbar">
            @for (group of groups; track group.label) {
              @if (group.path) {
                <a
                  [routerLink]="group.path"
                  routerLinkActive="text-primary bg-primary/10 rounded-xl"
                  [routerLinkActiveOptions]="{ exact: group.path === '/demo' }"
                  class="flex flex-col items-center gap-1 px-4 py-2 text-[10px] font-black uppercase tracking-tighter text-base-content/40 hover:text-base-content no-underline whitespace-nowrap transition-all"
                >
                  <span class="text-xl">{{ group.icon }}</span>
                  <span>{{ group.label }}</span>
                </a>
              }
            }
          </div>
        </nav>
      </header>

      <!-- Main Content -->
      <main class="flex-1 w-full pb-24 md:pb-12 overflow-x-hidden">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [
    `
      .demo-header {
        background: color-mix(in oklch, var(--c-bg-main), transparent 15%);
        backdrop-filter: blur(20px) saturate(1.4);
        border-block-end: 1px solid var(--c-border-subtle);
        box-shadow:
          0 1px 0 color-mix(in oklch, white, transparent 97%),
          0 4px 20px rgba(0, 0, 0, 0.3);
      }

      .demo-logo-link {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        text-decoration: none;
        transition: transform 150ms ease;
      }
      .demo-logo-link:active {
        transform: scale(0.95);
      }

      .demo-logo-icon {
        padding: 0.25rem;
        background: var(--c-primary-dim);
        border-radius: var(--r-lg);
        border: 1px solid color-mix(in oklch, var(--c-primary), transparent 70%);
        box-shadow: 0 0 12px color-mix(in oklch, var(--c-primary), transparent 80%);
        transition:
          border-color 150ms ease,
          box-shadow 150ms ease;
      }
      .demo-logo-link:hover .demo-logo-icon {
        border-color: color-mix(in oklch, var(--c-primary), transparent 40%);
        box-shadow: 0 0 20px color-mix(in oklch, var(--c-primary), transparent 60%);
      }

      /* ─── Nav Items ───────────────────── */
      .demo-nav-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.4rem 1rem;
        border-radius: 99px;
        font-size: 0.875rem;
        font-weight: 700;
        color: var(--c-text-muted);
        text-decoration: none;
        border: 1px solid transparent;
        background: transparent;
        cursor: pointer;
        transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
        white-space: nowrap;
      }

      .demo-nav-item:hover {
        color: var(--c-text-main);
        background: color-mix(in oklch, var(--c-text-main), transparent 94%);
        border-color: var(--c-border-subtle);
      }

      .demo-nav-item--active {
        color: var(--c-primary) !important;
        background: var(--c-primary-dim) !important;
        border-color: color-mix(in oklch, var(--c-primary), transparent 70%) !important;
        box-shadow:
          0 0 16px color-mix(in oklch, var(--c-primary), transparent 80%),
          inset 0 1px 0 color-mix(in oklch, white, transparent 92%);
      }

      /* ─── Dropdown ───────────────────── */
      .demo-dropdown {
        min-width: 220px;
        padding: 0.5rem;
        background: color-mix(in oklch, var(--c-bg-surface), black 3%);
        backdrop-filter: blur(24px) saturate(1.5);
        border: 1px solid var(--c-border);
        border-radius: var(--r-2xl);
        box-shadow:
          0 24px 48px -12px rgba(0, 0, 0, 0.5),
          0 0 0 1px color-mix(in oklch, white, transparent 96%),
          0 0 40px color-mix(in oklch, var(--c-primary), transparent 92%);
        animation: dropdown-enter 200ms cubic-bezier(0.16, 1, 0.3, 1);
      }

      @keyframes dropdown-enter {
        from {
          opacity: 0;
          transform: translateY(-4px) scale(0.98);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      .demo-dropdown__label {
        padding: 0.5rem 1rem 0.4rem;
        font-size: 0.6rem;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.15em;
        color: var(--c-text-muted);
        pointer-events: none;
      }

      .demo-dropdown__item {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        padding: 0.65rem 1rem;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--c-text-secondary);
        text-decoration: none;
        border-radius: var(--r-xl);
        transition: all 150ms ease;
      }

      .demo-dropdown__item:hover {
        color: var(--c-text-main);
        background: color-mix(in oklch, var(--c-text-main), transparent 93%);
      }

      .demo-dropdown__dot {
        width: 5px;
        height: 5px;
        border-radius: 99px;
        background: var(--c-border);
        transition: all 150ms ease;
        flex-shrink: 0;
      }

      .demo-dropdown__item:hover .demo-dropdown__dot {
        background: var(--c-primary);
        box-shadow: 0 0 8px color-mix(in oklch, var(--c-primary), transparent 50%);
      }

      .demo-dropdown__item--active {
        color: var(--c-primary) !important;
        background: var(--c-primary-dim) !important;
      }

      .demo-dropdown__item--active .demo-dropdown__dot {
        background: var(--c-primary);
        box-shadow: 0 0 8px color-mix(in oklch, var(--c-primary), transparent 50%);
      }
    `,
  ],
})
export class DemoLayoutComponent {
  protected readonly groups = DEMO_GROUPS;
  protected dropdownOpen = signal<string | null>(null);
  private closeTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly router = inject(Router);

  protected openDropdown(label: string): void {
    this.cancelClose();
    this.dropdownOpen.set(label);
  }

  protected scheduleClose(_label: string): void {
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
    const url = this.router.url;
    return group.items.some((item) => url.startsWith(item.path));
  }
}
