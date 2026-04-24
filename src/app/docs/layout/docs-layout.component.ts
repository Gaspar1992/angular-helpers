import {
  Component,
  signal,
  ChangeDetectionStrategy,
  effect,
  inject,
  computed,
} from '@angular/core';
import {
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
  Router,
  ActivatedRoute,
  NavigationEnd,
} from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, filter } from 'rxjs/operators';
import { DOCS_NAV_LIBRARIES, type LibraryNav, type NavSection } from '../config/docs-nav.data';

@Component({
  selector: 'app-docs-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div
      class="flex h-[calc(100vh-52px)] sm:h-[calc(100vh-56px)] overflow-hidden bg-base-100 text-base-content font-sans"
    >
      <!-- First Sidebar - Libraries -->
      <aside
        class="fixed lg:sticky lg:top-0 h-full w-16 lg:w-56 z-50 bg-base-200 border-r border-base-300 flex flex-col overflow-y-auto transition-all duration-250 -left-72 lg:left-0"
        [class.-left-72]="!sidebarOpen()"
        [class.left-0]="sidebarOpen()"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-4 border-b border-base-300">
          <a
            routerLink="/docs"
            class="font-bold text-sm text-base-content no-underline tracking-tight hover:text-primary transition-colors hidden lg:block"
            (click)="closeSidebar()"
          >
            Angular Helpers
          </a>
          <a
            routerLink="/docs"
            class="font-bold text-lg text-base-content no-underline hover:text-primary transition-colors lg:hidden mx-auto"
            (click)="closeSidebar()"
          >
            AH
          </a>
          <button
            class="bg-transparent border-none text-base-content/50 cursor-pointer text-base p-1 rounded hover:text-base-content transition-colors lg:hidden"
            (click)="closeSidebar()"
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        <!-- Library Navigation -->
        <nav class="flex-1 py-2" aria-label="Library navigation">
          @for (lib of libraries; track lib.id) {
            <a
              [routerLink]="lib.overviewRoute"
              routerLinkActive="bg-base-300 text-primary font-medium border-l-2 border-primary"
              [routerLinkActiveOptions]="{ exact: false }"
              class="flex items-center gap-3 px-4 py-3 text-sm text-base-content/70 hover:text-base-content hover:bg-base-300/50 transition-colors no-underline border-l-2 border-transparent"
              [title]="lib.label"
            >
              <span class="text-lg">{{ getLibraryIcon(lib.id) }}</span>
              <span class="hidden lg:block truncate">{{ lib.label }}</span>
            </a>
          }
        </nav>
      </aside>

      <!-- Second Sidebar - Library Sections (shown when library selected) -->
      @if (activeLibrary(); as lib) {
        <aside
          class="fixed lg:sticky lg:top-0 h-full w-64 z-40 bg-base-200 border-r border-base-300 flex flex-col overflow-y-auto transition-all duration-250"
          [class.-left-72]="!sidebarOpen()"
          [class.left-16]="sidebarOpen()"
        >
          <!-- Library Header -->
          <div class="flex items-center gap-2 px-4 py-4 border-b border-base-300">
            <span class="text-lg">{{ getLibraryIcon(lib.id) }}</span>
            <span class="font-semibold text-sm text-base-content">{{ lib.label }}</span>
          </div>

          <!-- Sections Navigation -->
          <nav class="flex-1 py-2" aria-label="Documentation sections">
            <!-- Overview Link -->
            <a
              [routerLink]="lib.overviewRoute"
              routerLinkActive="bg-base-300 text-primary font-medium"
              [routerLinkActiveOptions]="{ exact: true }"
              class="flex items-center gap-2 px-4 py-2 mx-2 rounded-lg text-sm text-base-content/70 hover:text-base-content hover:bg-base-300/50 transition-colors no-underline"
              (click)="closeSidebar()"
            >
              <span class="text-base">📋</span>
              <span>Overview</span>
            </a>

            <!-- Sections -->
            @for (section of lib.sections; track section.title) {
              <div class="mt-3">
                <!-- Section Title (non-clickable) -->
                <div
                  class="px-4 py-2 text-sm font-bold uppercase tracking-wider text-base-content/80 border-l-2 border-transparent mt-3 first:mt-0 border-b border-base-300/50 pb-2 mb-1"
                >
                  {{ section.title }}
                </div>

                <!-- Section Items -->
                <ul class="list-none p-0 m-0">
                  @for (item of section.items; track item.route) {
                    <li>
                      <a
                        [routerLink]="item.route"
                        routerLinkActive="bg-base-300 text-primary font-medium"
                        [routerLinkActiveOptions]="{ exact: true }"
                        class="flex items-center gap-2 px-4 py-1.5 pl-6 text-sm text-base-content/70 hover:text-base-content hover:bg-base-300/50 transition-colors no-underline"
                        (click)="closeSidebar()"
                      >
                        <span class="truncate">{{ item.label }}</span>
                        @if (item.experimental) {
                          <span
                            class="badge badge-xs badge-warning flex-shrink-0"
                            aria-label="Experimental API"
                            >exp</span
                          >
                        }
                        @if (item.hasFn) {
                          <span
                            class="badge badge-xs badge-info flex-shrink-0"
                            aria-label="Signal Fn available"
                            >fn</span
                          >
                        }
                      </a>
                    </li>
                  }
                </ul>
              </div>
            }
          </nav>
        </aside>
      }

      <!-- Backdrop -->
      @if (sidebarOpen()) {
        <div
          class="fixed inset-0 bg-black/50 z-30 lg:hidden"
          (click)="closeSidebar()"
          aria-hidden="true"
        ></div>
      }

      <!-- Main Content -->
      <div class="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <!-- Topbar -->
        <header
          class="flex-none flex items-center gap-3 px-5 py-4 bg-base-200/80 backdrop-blur border-b border-base-300 lg:px-6"
        >
          <button
            class="btn btn-ghost btn-square btn-sm lg:hidden"
            (click)="toggleSidebar()"
            aria-label="Toggle sidebar"
            [attr.aria-expanded]="sidebarOpen()"
          >
            <span class="text-lg">☰</span>
          </button>
          <nav class="flex items-center gap-1 text-sm" aria-label="Breadcrumb">
            <a routerLink="/docs" class="text-base-content/60 hover:text-primary transition-colors"
              >docs</a
            >
            @if (activeLibrary(); as lib) {
              <span class="text-base-content/40">/</span>
              <a
                [routerLink]="lib.overviewRoute"
                class="text-base-content/60 hover:text-primary transition-colors truncate max-w-[150px]"
                >{{ lib.label }}</a
              >
              @if (activeItem(); as item) {
                <span class="text-base-content/40">/</span>
                <span class="text-base-content truncate max-w-[150px]">{{ item.label }}</span>
              }
            }
          </nav>
        </header>

        <!-- Page Content -->
        <main id="main-content" class="flex-1 overflow-y-auto p-4 lg:p-6" tabindex="-1">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class DocsLayoutComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly libraries = DOCS_NAV_LIBRARIES;

  // Reactive signal that updates on every navigation
  private currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  readonly activeLibrary = computed(() => {
    const url = this.currentUrl();
    return this.libraries.find((lib) => url.startsWith(lib.overviewRoute)) ?? null;
  });

  /** Find the active item within the current library based on URL */
  readonly activeItem = computed(() => {
    const url = this.currentUrl();
    const lib = this.activeLibrary();
    if (!lib) return null;

    for (const section of lib.sections) {
      const item = section.items.find((i) => url === i.route);
      if (item) return item;
    }
    return null;
  });

  protected sidebarOpen = signal(false);

  constructor() {
    effect(() => {
      // Wait for DOM update after navigation
      queueMicrotask(() => {
        this.scrollToActiveItem();
      });
    });
  }

  private scrollToActiveItem(): void {
    const sidebars = document.querySelectorAll('aside');
    for (const sidebar of sidebars) {
      const activeItem = sidebar.querySelector('a.active');
      if (sidebar && activeItem) {
        const sidebarRect = sidebar.getBoundingClientRect();
        const itemRect = activeItem.getBoundingClientRect();
        if (itemRect.top < sidebarRect.top || itemRect.bottom > sidebarRect.bottom) {
          const scrollTop =
            itemRect.top - sidebarRect.top - sidebarRect.height / 2 + itemRect.height / 2;
          sidebar.scrollBy({ top: scrollTop, behavior: 'smooth' });
        }
      }
    }
  }

  protected getLibraryIcon(id: string): string {
    const icons: Record<string, string> = {
      'browser-web-apis': '🌐',
      security: '🛡️',
      'worker-http': '🚀',
      openlayers: '🗺️',
    };
    return icons[id] ?? '📦';
  }

  protected toggleSidebar() {
    this.sidebarOpen.update((v) => !v);
  }

  protected closeSidebar() {
    this.sidebarOpen.set(false);
  }
}
