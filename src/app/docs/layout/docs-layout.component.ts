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
  templateUrl: './docs-layout.component.html',
  styleUrl: './docs-layout.component.css',
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
