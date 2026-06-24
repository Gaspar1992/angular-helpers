import { Component, inject, ElementRef, viewChild, effect, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SearchService, SearchResult } from '../../../core/services/search.service';

@Component({
  selector: 'app-search-modal',
  imports: [RouterLink, FormsModule, NgOptimizedImage],
  host: {
    '(window:keydown)': 'onWindowKeydown($event)',
  },
  template: `
    @if (search.isOpen()) {
      <div
        class="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4"
        (click)="close()"
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-label"
      >
        <!-- Backdrop -->
        <div
          class="fixed inset-0 bg-base-content/5 backdrop-blur-sm animate-in fade-in duration-300"
        ></div>

        <!-- Modal Container -->
        <div
          class="relative w-full max-w-[650px] bg-base-200 border border-base-content/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
          (click)="$event.stopPropagation()"
        >
          <!-- Search Input -->
          <div
            class="flex items-center gap-4 px-5 py-5 border-b border-base-content/5 bg-base-content/5"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-primary"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              #searchInput
              type="text"
              class="flex-1 bg-transparent border-none outline-none text-base-content text-lg font-bold placeholder:text-base-content/20"
              placeholder="Search documentation, blog, demos..."
              [ngModel]="search.query()"
              (ngModelChange)="search.query.set($event)"
              (keydown.esc)="close()"
              (keydown.enter)="selectActiveResult()"
              (keydown.arrowDown)="navigateResults(1)"
              (keydown.arrowUp)="navigateResults(-1)"
              id="search-label"
            />
            <div
              class="flex items-center gap-2 px-2 py-1 rounded bg-base-content/5 border border-base-content/10 text-[10px] font-black uppercase text-base-content/30 tracking-widest"
            >
              ESC
            </div>
          </div>

          @if (search.searching()) {
            <div class="search-progress-bar"></div>
          }

          <!-- Results List -->
          <div class="max-h-[450px] overflow-y-auto no-scrollbar py-2">
            @if (search.results().length > 0) {
              <div
                class="px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-base-content/20"
              >
                Found {{ search.results().length }} results
              </div>
              @for (res of search.results(); track res.url; let i = $index) {
                <a
                  [routerLink]="res.url"
                  class="flex items-start gap-4 px-4 py-4 mx-2 rounded-xl transition-all duration-200 no-underline hover:bg-primary/10 group relative border border-transparent hover:border-primary/20"
                  (click)="close()"
                  [class.bg-base-content/5]="i === activeIndex()"
                >
                  <div
                    class="p-3 bg-base-content/5 rounded-xl border border-base-content/10 group-hover:border-primary/30 transition-colors shadow-inner shrink-0"
                  >
                    <span class="text-2xl leading-none">{{ res.icon }}</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-3 mb-1">
                      <span
                        class="text-sm font-black text-base-content group-hover:text-primary transition-colors truncate"
                        >{{ res.title }}</span
                      >
                      <span
                        class="badge font-black opacity-60 group-hover:opacity-100 px-3 py-1 scale-90 origin-left"
                        [class]="getTypeClass(res.type)"
                      >
                        {{ res.type }}
                      </span>
                    </div>
                    <p
                      class="text-xs text-base-content/40 font-medium m-0 leading-relaxed line-clamp-1 group-hover:text-base-content/60"
                    >
                      {{ res.description }}
                    </p>
                  </div>
                  <span
                    class="text-base-content/10 group-hover:text-primary transition-colors text-xl font-bold"
                    >→</span
                  >
                </a>
              }
            } @else if (search.query()) {
              <div class="py-12 text-center flex flex-col items-center gap-4">
                <div
                  class="w-16 h-16 rounded-full bg-base-content/5 flex items-center justify-center text-2xl opacity-20 border border-base-content/10"
                >
                  🔍
                </div>
                <p class="text-sm text-base-content/30 font-black uppercase tracking-widest italic">
                  No results for "{{ search.query() }}"
                </p>
              </div>
            } @else {
              <div class="py-12 text-center flex flex-col items-center gap-4">
                <div
                  class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl text-primary animate-pulse border border-primary/20"
                >
                  ⌨️
                </div>
                <p class="text-sm text-base-content/30 font-black uppercase tracking-widest">
                  Type to search the ecosystem
                </p>
                <div class="flex gap-4 mt-2">
                  <div class="flex flex-col items-center gap-1">
                    <span
                      class="text-[9px] font-black text-base-content/20 uppercase tracking-widest"
                      >Select</span
                    >
                    <kbd
                      class="px-2 py-1 rounded bg-base-content/5 border border-base-content/5 text-[10px] text-base-content/40"
                      >ENTER</kbd
                    >
                  </div>
                  <div class="flex flex-col items-center gap-1">
                    <span
                      class="text-[9px] font-black text-base-content/20 uppercase tracking-widest"
                      >Navigate</span
                    >
                    <kbd
                      class="px-2 py-1 rounded bg-base-content/5 border border-base-content/5 text-[10px] text-base-content/40"
                      >↑↓</kbd
                    >
                  </div>
                </div>
              </div>
            }
          </div>

          <!-- Footer -->
          <div
            class="px-5 py-3 border-t border-base-content/5 bg-base-content/5 flex justify-between items-center"
          >
            <div class="flex items-center gap-2.5">
              <img ngSrc="icon.webp" alt="" width="16" height="16" class="opacity-30" />
              <span class="text-[10px] font-black text-base-content/20 uppercase tracking-widest"
                >Angular Helpers Search</span
              >
            </div>
            <div class="flex gap-4">
              <a
                routerLink="/docs"
                class="text-[10px] font-black text-primary/60 hover:text-primary no-underline uppercase tracking-widest"
                (click)="close()"
                >Full Documentation</a
              >
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: contents;
      }
      .search-progress-bar {
        height: 2px;
        width: 100%;
        background: linear-gradient(90deg, transparent, var(--color-primary), transparent);
        background-size: 200% 100%;
        animation: slide-glow 1.5s infinite linear;
      }
      @keyframes slide-glow {
        0% {
          background-position: 200% 0;
        }
        100% {
          background-position: -200% 0;
        }
      }
    `,
  ],
})
export class SearchModalComponent {
  protected readonly search = inject(SearchService);
  private readonly router = inject(Router);

  private inputEl = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  activeIndex = signal(0);

  constructor() {
    // Auto-focus input when modal opens
    effect(() => {
      if (this.search.isOpen()) {
        setTimeout(() => this.inputEl()?.nativeElement.focus(), 50);
        this.activeIndex.set(0);
      }
    });

    // Reset index on query change
    effect(() => {
      this.search.query();
      this.activeIndex.set(0);
    });
  }

  onWindowKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      this.search.toggle();
    }
    if (e.key === '/' && !this.search.isOpen()) {
      const target = e.target as HTMLElement;
      if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        this.search.open();
      }
    }
  }

  close() {
    this.search.close();
  }

  navigateResults(delta: number) {
    const results = this.search.results();
    if (results.length === 0) return;

    let nextIndex = this.activeIndex() + delta;
    if (nextIndex < 0) nextIndex = results.length - 1;
    if (nextIndex >= results.length) nextIndex = 0;

    this.activeIndex.set(nextIndex);
  }

  selectActiveResult() {
    const results = this.search.results();
    const index = this.activeIndex();
    if (results.length > 0 && index >= 0 && index < results.length) {
      this.router.navigateByUrl(results[index].url);
      this.close();
    }
  }

  getTypeClass(type: SearchResult['type']): string {
    switch (type) {
      case 'docs':
        return 'badge-primary';
      case 'blog':
        return 'badge-secondary';
      case 'demo':
        return 'badge-accent';
      default:
        return '';
    }
  }
}
