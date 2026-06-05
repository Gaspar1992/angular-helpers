import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-site-footer',
  imports: [RouterLink, NgOptimizedImage],
  template: `
    <footer class="py-12 px-6 border-t border-base-content/5 bg-base-100">
      <div
        class="max-width-container flex flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:text-left"
      >
        <div class="flex items-center gap-2.5 text-sm font-bold text-base-content/40">
          <img ngSrc="icon.webp" alt="Angular Helpers" width="24" height="24" class="opacity-50" />
          <span class="tracking-tight">Angular Helpers</span>
        </div>

        <nav class="flex flex-wrap gap-8 justify-center" aria-label="Footer navigation">
          <a
            routerLink="/docs"
            class="text-sm text-base-content/50 no-underline transition-colors hover:text-base-content font-bold"
            >Docs</a
          >
          <a
            routerLink="/demo"
            class="text-sm text-base-content/50 no-underline transition-colors hover:text-base-content font-bold"
            >Demo</a
          >
          <a
            routerLink="/blog"
            class="text-sm text-base-content/50 no-underline transition-colors hover:text-base-content font-bold"
            >Blog</a
          >
          <a
            href="https://github.com/Gaspar1992/angular-helpers"
            target="_blank"
            rel="noopener noreferrer"
            class="text-sm text-base-content/50 no-underline transition-colors hover:text-base-content font-bold flex items-center gap-1"
            >GitHub <span class="text-xs opacity-50">↗</span></a
          >
        </nav>

        <p class="text-[10px] font-black uppercase tracking-[0.2em] text-base-content/20 m-0">
          MIT License
        </p>
      </div>
    </footer>
  `,
})
export class SiteFooterComponent {}
