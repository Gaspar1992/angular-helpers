import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-site-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NgOptimizedImage],
  styleUrl: './site-footer.component.css',
  template: `
    <footer class="site-footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <img ngSrc="icon.webp" alt="Angular Helpers" width="24" height="24" class="footer-icon" />
          <span>Angular Helpers</span>
        </div>
        <nav class="footer-nav" aria-label="Footer navigation">
          <a routerLink="/docs">Docs</a>
          <a routerLink="/demo">Demo</a>
          <a
            href="https://github.com/Gaspar1992/angular-helpers"
            target="_blank"
            rel="noopener noreferrer"
            >GitHub ↗</a
          >
        </nav>
        <p class="footer-copy">MIT License · Open source</p>
      </div>
    </footer>
  `,
})
export class SiteFooterComponent {}
