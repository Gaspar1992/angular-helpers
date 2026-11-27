import { Component, signal, effect, inject, computed } from '@angular/core';
import {
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
  Router,
  ActivatedRoute,
  NavigationEnd,
} from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { map, filter } from 'rxjs/operators';
import { getNavLibrariesForVersion } from '../config/docs-nav.data';
import { PACKAGES } from '../../core/config/packages.data';
import { WINDOW } from '@angular-helpers/browser-web-apis';
import { DocsVersionService, AngularVersion } from '../services/docs-version.service';
import { VersionDropdownComponent } from '../shared/version-dropdown.component';
import { DocsHistoryService } from '../services/docs-history.service';
import { VitalsPanelComponent } from './vitals-panel.component';

@Component({
  selector: 'app-docs-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    VersionDropdownComponent,
    VitalsPanelComponent,
  ],
  template: `
    <div
      class="flex h-[calc(100dvh-56px)] overflow-hidden bg-base-100 text-base-content font-sans selection:bg-primary/30"
    >
      <!-- First Sidebar - Libraries -->
      <aside
        class="fixed lg:sticky lg:top-0 h-full w-16 lg:w-56 z-50 bg-base-100 border-r border-border-subtle flex flex-col overflow-y-auto transition-all duration-300 -left-72 lg:left-0 shadow-2xl lg:shadow-none"
        [class.-left-72]="!sidebarOpen()"
        [class.left-0]="sidebarOpen()"
      >
        <!-- Header -->
        <div
          class="flex-none flex items-center justify-between px-4 h-[57px] border-b border-border-subtle bg-base-200/50"
        >
          <a
            routerLink="/docs"
            queryParamsHandling="merge"
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
            queryParamsHandling="merge"
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
          @for (lib of libraries(); track lib.id) {
            <a
              [routerLink]="lib.overviewRoute"
              queryParamsHandling="merge"
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
          class="fixed lg:sticky lg:top-0 h-full w-64 z-40 bg-base-200/50 backdrop-blur-md border-r border-border-subtle flex flex-col overflow-y-auto transition-all duration-300 shadow-xl lg:shadow-none"
          [class.-left-72]="!sidebarOpen()"
          [class.left-16]="sidebarOpen()"
        >
          <!-- Library Header -->
          <div
            class="flex-none flex items-center gap-3 px-5 h-[57px] border-b border-border-subtle bg-base-200/80"
          >
            <span class="text-xl drop-shadow-md">{{ getLibraryIcon(lib.id) }}</span>
            <span class="font-black text-sm text-base-content tracking-tight">{{ lib.label }}</span>
          </div>

          <!-- Sections Navigation -->
          <nav class="flex-1 py-4 px-4 no-scrollbar" aria-label="Documentation sections">
            <!-- Overview Link -->
            <a
              [routerLink]="lib.overviewRoute"
              queryParamsHandling="merge"
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
                  class="px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-base-content/70 mb-3"
                >
                  {{ section.title }}
                </div>

                <ul class="list-none p-0 m-0 flex flex-col gap-0.5">
                  @for (item of section.items; track item.route) {
                    <li>
                      <a
                        [routerLink]="item.route"
                        queryParamsHandling="merge"
                        routerLinkActive="active bg-base-300 text-base-content font-bold"
                        [routerLinkActiveOptions]="{ exact: true }"
                        class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-base-content/60 hover:text-base-content hover:bg-base-content/5 transition-all duration-200 no-underline group"
                        (click)="closeSidebar()"
                      >
                        <span
                          class="truncate transition-transform duration-200 group-hover:translate-x-0.5"
                          >{{ item.label }}</span
                        >
                        @if (item.experimental) {
                          <span class="badge badge-warning text-[9px] ml-auto select-none"
                            >EXP</span
                          >
                        }
                        @if (item.hasFn) {
                          <span class="badge badge-info text-[9px] ml-auto select-none">FN</span>
                        }
                      </a>
                    </li>
                  }
                </ul>
              </div>
            }

            <!-- Bookmarks Section -->
            @if (bookmarkedItems().length > 0) {
              <div class="mt-6 mb-2" id="sidebar-bookmarks">
                <div
                  class="px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-base-content/70 mb-3"
                >
                  ⭐ Bookmarks
                </div>
                <ul class="list-none p-0 m-0 flex flex-col gap-0.5">
                  @for (item of bookmarkedItems(); track item.route) {
                    <li>
                      <a
                        [routerLink]="item.route"
                        queryParamsHandling="merge"
                        routerLinkActive="active bg-base-300 text-base-content font-bold"
                        [routerLinkActiveOptions]="{ exact: true }"
                        class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-base-content/60 hover:text-base-content hover:bg-base-content/5 transition-all duration-200 no-underline group"
                        (click)="closeSidebar()"
                      >
                        <span
                          class="truncate transition-transform duration-200 group-hover:translate-x-0.5"
                          >{{ item.label }}</span
                        >
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
          class="flex-none flex items-center gap-3 px-5 h-[57px] bg-base-100/80 backdrop-blur-xl border-b border-border-subtle sticky top-0 z-20"
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
              queryParamsHandling="merge"
              class="text-base-content/40 hover:text-base-content transition-colors no-underline"
              >docs</a
            >
            @if (activeLibrary(); as lib) {
              <span class="text-base-content/20">/</span>
              <a
                [routerLink]="lib.overviewRoute"
                queryParamsHandling="merge"
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
          <div class="flex items-center gap-2">
            @if (activeDemoLink(); as demoUrl) {
              <a
                [routerLink]="demoUrl"
                class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 no-underline transition-colors"
              >
                <span>▶</span>
                <span>Live Demo</span>
              </a>
            }
            <button
              type="button"
              class="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-base-content/70 hover:text-base-content hover:bg-base-content/5 border border-border-subtle transition-colors cursor-pointer"
              (click)="copyPageMarkdown()"
              [attr.aria-label]="copiedMd() ? 'Markdown copied' : 'Copy page as Markdown'"
            >
              <span>{{ copiedMd() ? '✓ Copied MD' : 'Copy MD' }}</span>
            </button>
            <a
              href="llms.txt"
              target="_blank"
              rel="noopener noreferrer"
              class="hidden xl:inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold text-base-content/60 hover:text-primary hover:bg-base-content/5 no-underline transition-colors"
              title="LLM-friendly full documentation index"
            >
              llms.txt
            </a>
            <app-version-dropdown />
          </div>
        </header>

        <!-- Page Content -->
        <main
          id="main-content"
          class="flex-1 overflow-y-auto no-scrollbar p-6 sm:p-10 lg:p-12"
          tabindex="-1"
        >
          <div class="w-full">
            @boundary {
              <router-outlet />
            } @error (let err) {
              <div class="py-12 px-4 max-w-2xl mx-auto">
                <div class="p-6 bg-error/10 border border-error/20 rounded-2xl flex flex-col gap-3">
                  <div class="flex items-center gap-3 text-error">
                    <span class="text-2xl">⚠️</span>
                    <h3 class="text-lg font-bold">Failed to load documentation page</h3>
                  </div>
                  <p class="text-sm text-base-content/80">
                    A runtime exception occurred while rendering this section:
                    <code class="px-2 py-0.5 bg-base-300 rounded font-mono text-xs">{{
                      err.message || err
                    }}</code>
                  </p>
                  <div class="mt-2 flex gap-3">
                    <a routerLink="/docs" class="btn btn-sm btn-outline">Back to Docs Overview</a>
                    <button type="button" (click)="reload()" class="btn btn-sm btn-primary">
                      Retry
                    </button>
                  </div>
                </div>
              </div>
            }
            @if (activeLibrary(); as lib) {
              <footer
                class="max-w-[900px] mx-auto mt-12 pt-8 border-t border-border-subtle flex flex-col gap-6"
              >
                @if (prevNextItems(); as nav) {
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    @if (nav.prev; as prev) {
                      <a
                        [routerLink]="prev.route"
                        queryParamsHandling="merge"
                        class="flex flex-col gap-1 p-4 rounded-2xl bg-base-200/60 border border-border-subtle hover:border-primary/40 no-underline transition-colors"
                      >
                        <span
                          class="text-[10px] font-black uppercase tracking-widest text-base-content/50"
                        >
                          ← Previous
                        </span>
                        <span class="text-sm font-bold text-base-content">{{ prev.label }}</span>
                      </a>
                    } @else {
                      <div></div>
                    }
                    @if (nav.next; as next) {
                      <a
                        [routerLink]="next.route"
                        queryParamsHandling="merge"
                        class="flex flex-col items-end gap-1 p-4 rounded-2xl bg-base-200/60 border border-border-subtle hover:border-primary/40 no-underline transition-colors text-right"
                      >
                        <span
                          class="text-[10px] font-black uppercase tracking-widest text-base-content/50"
                        >
                          Next →
                        </span>
                        <span class="text-sm font-bold text-base-content">{{ next.label }}</span>
                      </a>
                    }
                  </div>
                }

                <div
                  class="flex flex-wrap items-center justify-between gap-4 text-xs text-base-content/60"
                >
                  <a
                    [href]="editOnGithubUrl()"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="hover:text-primary no-underline font-medium transition-colors"
                  >
                    Edit this page on GitHub ↗
                  </a>
                  <a
                    href="llms.txt"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="hover:text-primary no-underline font-mono transition-colors"
                  >
                    View llms.txt
                  </a>
                </div>
              </footer>
            }
          </div>
        </main>
      </div>
      <app-vitals-panel />
    </div>
  `,
})
export class DocsLayoutComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly window = inject(WINDOW);

  private readonly versionService = inject(DocsVersionService);
  private readonly historyService = inject(DocsHistoryService);

  readonly bookmarkedItems = this.historyService.bookmarkedItems;
  readonly libraries = computed(() => getNavLibrariesForVersion(this.versionService.version()));

  // Reactive signal that updates on every navigation
  private currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  readonly activeLibrary = computed(() => {
    const url = this.currentUrl().split(/[?#]/)[0];
    return this.libraries().find((lib) => url.startsWith(lib.overviewRoute)) ?? null;
  });

  /** Find the active item within the current library based on URL */
  readonly activeItem = computed(() => {
    const url = this.currentUrl().split(/[?#]/)[0];
    const lib = this.activeLibrary();
    if (!lib) return null;

    for (const section of lib.sections) {
      const item = section.items.find((i) => url === i.route);
      if (item) return item;
    }
    return null;
  });

  protected sidebarOpen = signal(false);
  protected copiedMd = signal(false);

  readonly activeDemoLink = computed(() => {
    const lib = this.activeLibrary();
    if (!lib) return null;
    const pkg = PACKAGES.find((p) => p.docsLink === lib.overviewRoute);
    return pkg?.demoLink ?? null;
  });

  readonly prevNextItems = computed(() => {
    const lib = this.activeLibrary();
    if (!lib) return null;
    const url = this.currentUrl().split(/[?#]/)[0];
    const items = [
      { label: `${lib.label} Overview`, route: lib.overviewRoute },
      ...lib.sections.flatMap((s) => s.items.map((i) => ({ label: i.label, route: i.route }))),
    ];
    const idx = items.findIndex((item) => item.route === url);
    if (idx === -1) return null;
    return {
      prev: idx > 0 ? items[idx - 1] : null,
      next: idx < items.length - 1 ? items[idx + 1] : null,
    };
  });

  readonly editOnGithubUrl = computed(() => {
    const lib = this.activeLibrary();
    const base = 'https://github.com/Gaspar1992/angular-helpers/edit/main';
    if (!lib) return `${base}/apps/web/src/app/docs`;
    return `${base}/apps/web/src/app/docs/data/${lib.id}.data.ts`;
  });

  protected copyPageMarkdown(): void {
    const lib = this.activeLibrary();
    const item = this.activeItem();
    const title = item ? `${lib?.label ?? ''} — ${item.label}` : (lib?.label ?? 'Documentation');
    const url = this.window?.location?.href ?? this.currentUrl();
    const pkgName = lib ? `@angular-helpers/${lib.id}` : '@angular-helpers/core';
    const md = `# ${title}\n\n- Package: \`${pkgName}\`\n- URL: ${url}\n\n\`\`\`bash\npnpm add ${pkgName}\n\`\`\`\n`;

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(md).then(() => {
        this.copiedMd.set(true);
        setTimeout(() => this.copiedMd.set(false), 1800);
      });
    }
  }

  constructor() {
    this.route.queryParams.pipe(takeUntilDestroyed()).subscribe((params) => {
      const v = params['v'];
      if (v === '21') {
        this.versionService.setVersion(AngularVersion.v21);
      } else if (v === '22') {
        this.versionService.setVersion(AngularVersion.v22);
      }
    });

    effect(() => {
      this.currentUrl();
      // Wait for DOM update after navigation
      queueMicrotask(() => {
        this.scrollToActiveItem();
      });
    });
  }

  private scrollToActiveItem(): void {
    if (!this.window.document) return;
    const sidebars = this.window.document.querySelectorAll('aside');
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
      core: '⚡',
      'browser-web-apis': '🌐',
      security: '🛡️',
      'worker-http': '🚀',
      openlayers: '🗺️',
      storage: '💾',
      yjs: '🤝',
      testing: '🧪',
      schematics: '🛠️',
    };
    return icons[id] ?? '📦';
  }

  protected reload(): void {
    if (this.window?.location) {
      this.window.location.reload();
    }
  }

  protected toggleSidebar() {
    this.sidebarOpen.update((v) => !v);
  }

  protected closeSidebar() {
    this.sidebarOpen.set(false);
  }
}
