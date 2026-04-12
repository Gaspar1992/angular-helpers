import { Component, signal, ChangeDetectionStrategy, effect, inject } from '@angular/core';
import {
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
  Router,
  ActivatedRoute,
} from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import type { NavSection } from '../config/docs-nav.data';

@Component({
  selector: 'app-docs-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="flex min-h-screen bg-base-100 text-base-content font-sans">
      <!-- Sidebar -->
      <aside
        class="fixed lg:static top-0 bottom-0 w-64 z-50 bg-base-200 border-r border-base-300 flex flex-col overflow-y-auto max-h-screen lg:max-h-none transition-all duration-250 -left-72 lg:left-0"
        [class.-left-72]="!sidebarOpen()"
        [class.left-0]="sidebarOpen()"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-base-300">
          <a
            routerLink="/docs"
            class="font-bold text-sm text-base-content no-underline tracking-tight hover:text-primary transition-colors"
            (click)="closeSidebar()"
          >
            Angular Helpers
          </a>
          <button
            class="bg-transparent border-none text-base-content/50 cursor-pointer text-base p-1 rounded hover:text-base-content transition-colors lg:hidden"
            (click)="closeSidebar()"
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 py-2" aria-label="Documentation navigation">
          @for (section of navSections(); track section.label) {
            <div class="border-t border-base-300 first:border-t-0">
              <!-- Section Label -->
              <div
                class="flex items-center gap-2 px-5 py-2 text-xs font-bold uppercase tracking-wider text-base-content/50"
              >
                <span class="badge badge-xs badge-primary">pkg</span>
                {{ section.label }}
              </div>

              <!-- Overview Link -->
              <ul class="list-none p-0 m-0">
                <li>
                  <a
                    [routerLink]="section.overviewRoute"
                    routerLinkActive="bg-base-300 text-primary font-medium"
                    [routerLinkActiveOptions]="{ exact: true }"
                    class="block px-5 py-2 text-sm text-base-content/70 hover:text-base-content hover:bg-base-300/50 transition-colors no-underline"
                    (click)="closeSidebar()"
                  >
                    Overview
                  </a>
                </li>
              </ul>

              <!-- Services Group -->
              <div class="mt-1">
                <button
                  class="w-full flex items-center gap-2 px-5 py-2 text-sm font-medium text-base-content/70 hover:text-base-content hover:bg-base-300/30 transition-colors bg-transparent border-none cursor-pointer"
                  type="button"
                  [attr.aria-expanded]="isSectionExpanded(section.label)"
                  (click)="toggleSection(section.label)"
                >
                  <span
                    class="text-base transition-transform duration-200"
                    [class.rotate-90]="isSectionExpanded(section.label)"
                    >›</span
                  >
                  {{ section.servicesLabel }}
                </button>

                @if (isSectionExpanded(section.label)) {
                  <ul class="list-none p-0 m-0" role="list">
                    @for (item of section.serviceItems; track item.route) {
                      <li>
                        <a
                          [routerLink]="item.route"
                          routerLinkActive="bg-base-300 text-primary font-medium"
                          [routerLinkActiveOptions]="{ exact: true }"
                          class="flex items-center gap-2 px-5 py-1.5 pl-8 text-sm text-base-content/70 hover:text-base-content hover:bg-base-300/50 transition-colors no-underline"
                          (click)="closeSidebar()"
                        >
                          {{ item.label }}
                          @if (item.hasFn) {
                            <span class="badge badge-xs badge-info" aria-label="Signal Fn available"
                              >fn</span
                            >
                          }
                        </a>
                      </li>
                    }
                  </ul>
                }
              </div>
            </div>
          }
        </nav>
      </aside>

      <!-- Backdrop -->
      @if (sidebarOpen()) {
        <div
          class="fixed inset-0 bg-black/50 z-40 lg:hidden"
          (click)="closeSidebar()"
          aria-hidden="true"
        ></div>
      }

      <!-- Main Content -->
      <div class="flex-1 flex flex-col min-w-0">
        <!-- Topbar -->
        <header
          class="sticky top-0 z-30 flex items-center gap-3 px-5 py-4 bg-base-200/80 backdrop-blur border-b border-base-300 lg:px-6"
        >
          <button
            class="btn btn-ghost btn-square btn-sm lg:hidden"
            (click)="toggleSidebar()"
            aria-label="Toggle sidebar"
            [attr.aria-expanded]="sidebarOpen()"
          >
            <span class="text-lg">☰</span>
          </button>
          <span class="text-sm font-semibold text-base-content">Documentation</span>
        </header>

        <!-- Page Content -->
        <main id="main-content" class="flex-1 p-4 lg:p-6" tabindex="-1">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class DocsLayoutComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly navSections = toSignal(
    this.route.data.pipe(map((d) => (d['navSections'] as NavSection[]) ?? [])),
    { initialValue: [] as NavSection[] },
  );

  protected sidebarOpen = signal(false);
  private expandedSections = signal<Set<string>>(new Set());

  constructor() {
    effect(() => {
      const url = this.router.url;
      // Auto-expand section containing active route
      for (const section of this.navSections()) {
        if (url.startsWith(section.overviewRoute)) {
          this.expandedSections.set(new Set([section.label]));
          break;
        }
      }
      // Wait for DOM update after navigation
      queueMicrotask(() => {
        this.scrollToActiveItem();
      });
    });
  }

  private scrollToActiveItem(): void {
    const sidebar = document.querySelector('.sidebar');
    const activeItem = sidebar?.querySelector('a.active');
    if (sidebar && activeItem) {
      const sidebarRect = sidebar.getBoundingClientRect();
      const itemRect = activeItem.getBoundingClientRect();
      const scrollTop =
        itemRect.top - sidebarRect.top - sidebarRect.height / 2 + itemRect.height / 2;
      sidebar.scrollBy({ top: scrollTop, behavior: 'smooth' });
    }
  }

  protected isSectionExpanded(label: string): boolean {
    return this.expandedSections().has(label);
  }

  protected toggleSection(label: string): void {
    this.expandedSections.update((set) => {
      // Accordion behavior: if opening, close others; if closing, just close this one
      if (set.has(label)) {
        return new Set(); // Close all
      } else {
        return new Set([label]); // Open only this one, close others
      }
    });
  }

  protected toggleSidebar() {
    this.sidebarOpen.update((v) => !v);
  }

  protected closeSidebar() {
    this.sidebarOpen.set(false);
  }
}
