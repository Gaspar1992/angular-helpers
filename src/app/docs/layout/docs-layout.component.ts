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
import { DOCS_NAV_LIBRARIES } from '../config/docs-nav.data';

@Component({
  selector: 'app-docs-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div
      class="flex h-[calc(100vh-60px)] overflow-hidden bg-base-100 text-base-content font-sans selection:bg-primary/30"
    >
      <!-- First Sidebar - Libraries -->
      <aside
        class="fixed lg:sticky lg:top-0 h-full w-16 lg:w-56 z-50 bg-base-100 border-r border-base-300 flex flex-col overflow-y-auto transition-all duration-300 -left-72 lg:left-0 shadow-2xl lg:shadow-none"
        [class.-left-72]="!sidebarOpen()"
        [class.left-0]="sidebarOpen()"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between px-4 py-4 border-b border-base-300 bg-base-200/50"
        >
          <a
            routerLink="/docs"
            class="font-black text-sm text-base-content no-underline tracking-tighter hover:text-primary transition-colors hidden lg:flex items-center gap-2"
            (click)="closeSidebar()"
          >
            <span
              class="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(59,130,246,0.5)]"
            ></span>
            Angular Helpers
          </a>
          <a
            routerLink="/docs"
            class="font-black text-lg text-base-content no-underline hover:text-primary transition-colors lg:hidden mx-auto"
            (click)="closeSidebar()"
          >
            AH
          </a>
          <button
            class="bg-transparent border-none text-base-content/40 cursor-pointer text-base p-1.5 rounded-md hover:text-base-content hover:bg-base-content/5 transition-all lg:hidden"
            (click)="closeSidebar()"
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        <!-- Library Navigation -->
        <nav class="flex-1 py-3 px-2 flex flex-col gap-1.5" aria-label="Library navigation">
          @for (lib of libraries; track lib.id) {
            <a
              [routerLink]="lib.overviewRoute"
              routerLinkActive="bg-base-200 text-base-content shadow-sm ring-1 ring-base-content/5"
              [routerLinkActiveOptions]="{ exact: false }"
              class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-base-content/50 hover:text-base-content hover:bg-base-content/5 transition-all duration-300 no-underline group"
              [title]="lib.label"
            >
              <span class="text-lg opacity-70 group-hover:opacity-100 transition-opacity">{{
                getLibraryIcon(lib.id)
              }}</span>
              <span class="hidden lg:block truncate font-bold">{{ lib.label }}</span>
            </a>
          }
        </nav>
      </aside>

      <!-- Second Sidebar - Library Sections -->
      @if (activeLibrary(); as lib) {
        <aside
          class="fixed lg:sticky lg:top-0 h-full w-64 z-40 bg-base-200/50 backdrop-blur-md border-r border-base-300 flex flex-col overflow-y-auto transition-all duration-300 shadow-xl lg:shadow-none"
          [class.-left-72]="!sidebarOpen()"
          [class.left-16]="sidebarOpen()"
        >
          <!-- Library Header -->
          <div class="flex items-center gap-3 px-5 py-5 border-b border-base-300 bg-base-200/80">
            <span class="text-xl drop-shadow-md">{{ getLibraryIcon(lib.id) }}</span>
            <span class="font-black text-sm text-base-content tracking-tight">{{ lib.label }}</span>
          </div>

          <!-- Sections Navigation -->
          <nav class="flex-1 py-4 px-4 no-scrollbar" aria-label="Documentation sections">
            <!-- Overview Link -->
            <a
              [routerLink]="lib.overviewRoute"
              routerLinkActive="bg-primary/10 text-primary border-primary/20"
              [routerLinkActiveOptions]="{ exact: true }"
              class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-base-content/50 hover:text-base-content hover:bg-base-content/5 border border-transparent transition-all duration-200 no-underline mb-4 font-bold"
              (click)="closeSidebar()"
            >
              <span class="text-base opacity-70">📋</span>
              <span>Overview</span>
            </a>

            <!-- Sections -->
            @for (section of lib.sections; track section.title) {
              <div class="mt-6 mb-2">
                <div
                  class="px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-base-content/30 mb-3"
                >
                  {{ section.title }}
                </div>

                <ul class="list-none p-0 m-0 flex flex-col gap-0.5">
                  @for (item of section.items; track item.route) {
                    <li>
                      <a
                        [routerLink]="item.route"
                        routerLinkActive="bg-base-300 text-base-content font-bold"
                        [routerLinkActiveOptions]="{ exact: true }"
                        class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-base-content/60 hover:text-base-content hover:bg-base-content/5 transition-all duration-200 no-underline group"
                        (click)="closeSidebar()"
                      >
                        <span
                          class="truncate transition-transform duration-200 group-hover:translate-x-0.5"
                          >{{ item.label }}</span
                        >
                        @if (item.experimental) {
                          <span
                            class="text-[9px] font-black tracking-wider px-1.5 py-0.5 rounded-md bg-warning/10 text-warning/80 ml-auto border border-warning/20"
                            >EXP</span
                          >
                        }
                        @if (item.hasFn) {
                          <span
                            class="text-[9px] font-black tracking-wider px-1.5 py-0.5 rounded-md bg-info/10 text-info/80 ml-auto border border-info/20"
                            >FN</span
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
          class="fixed inset-0 bg-base-content/20 backdrop-blur-sm z-30 lg:hidden transition-opacity"
          (click)="closeSidebar()"
          aria-hidden="true"
        ></div>
      }

      <!-- Main Content -->
      <div class="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-base-100">
        <!-- Topbar -->
        <header
          class="flex-none flex items-center gap-3 px-5 py-3.5 bg-base-100/80 backdrop-blur-xl border-b border-base-300 sticky top-0 z-20"
        >
          <button
            class="p-1.5 rounded-md text-base-content/60 hover:text-base-content hover:bg-base-content/10 transition-colors lg:hidden"
            (click)="toggleSidebar()"
            aria-label="Toggle sidebar"
            [attr.aria-expanded]="sidebarOpen()"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <nav class="flex items-center gap-2 text-sm font-bold flex-1" aria-label="Breadcrumb">
            <a
              routerLink="/docs"
              class="text-base-content/40 hover:text-base-content transition-colors no-underline"
              >docs</a
            >
            @if (activeLibrary(); as lib) {
              <span class="text-base-content/20">/</span>
              <a
                [routerLink]="lib.overviewRoute"
                class="text-base-content/60 hover:text-base-content transition-colors truncate max-w-[150px] no-underline"
                >{{ lib.label }}</a
              >
              @if (activeItem(); as item) {
                <span class="text-base-content/20">/</span>
                <span class="text-base-content truncate max-w-[150px] drop-shadow-sm">{{
                  item.label
                }}</span>
              }
            }
          </nav>
        </header>

        <!-- Page Content -->
        <main
          id="main-content"
          class="flex-1 overflow-y-auto no-scrollbar p-6 sm:p-10 lg:p-12"
          tabindex="-1"
        >
          <div
            class="max-w-4xl mx-auto prose prose-base-content prose-pre:m-0 prose-pre:bg-base-200 prose-pre:border prose-pre:border-base-300 prose-headings:font-black prose-a:text-primary"
          >
            <router-outlet />
          </div>
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
