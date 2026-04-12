import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-site-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NgOptimizedImage],
  template: `
    <footer class="py-8 px-4">
      <div
        class="max-w-[1100px] mx-auto flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left"
      >
        <div class="flex items-center gap-2 text-sm font-semibold text-base-content/60">
          <img ngSrc="icon.webp" alt="Angular Helpers" width="24" height="24" class="opacity-70" />
          <span>Angular Helpers</span>
        </div>

        <nav class="flex flex-wrap gap-5 justify-center" aria-label="Footer navigation">
          <a
            routerLink="/docs"
            class="text-sm text-base-content/70 no-underline transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-primary focus-visible:rounded-sm"
            >Docs</a
          >
          <a
            routerLink="/demo"
            class="text-sm text-base-content/70 no-underline transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-primary focus-visible:rounded-sm"
            >Demo</a
          >
          <a
            routerLink="/blog"
            class="text-sm text-base-content/70 no-underline transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-primary focus-visible:rounded-sm"
            >Blog</a
          >
          <a
            href="https://github.com/Gaspar1992/angular-helpers"
            target="_blank"
            rel="noopener noreferrer"
            class="text-sm text-base-content/70 no-underline transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-primary focus-visible:rounded-sm"
            >GitHub ↗</a
          >
        </nav>

        <p class="text-xs text-base-content/60 m-0">MIT License · Open source</p>
      </div>
    </footer>
  `,
})
export class SiteFooterComponent {}
