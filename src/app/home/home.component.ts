import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { CodeWindowComponent } from '../shared/components/code-window/code-window.component';
import { FeatureCardComponent } from '../shared/components/feature-card/feature-card.component';
import { PackageCardComponent } from '../shared/components/package-card/package-card.component';
import { StatsBarComponent } from '../shared/components/stats-bar/stats-bar.component';
import { SiteFooterComponent } from '../shared/components/site-footer/site-footer.component';
import { HOME_FEATURES, HOME_STATS, HOME_PACKAGES, HOME_CODE_EXAMPLES } from './home.config';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    NgOptimizedImage,
    CodeWindowComponent,
    FeatureCardComponent,
    PackageCardComponent,
    StatsBarComponent,
    SiteFooterComponent,
  ],
  styleUrl: './home.component.css',
  template: `
    <div class="home">
      <section class="hero" aria-labelledby="hero-title">
        <div class="hero-bg" aria-hidden="true">
          <div class="hero-dot-grid"></div>
          <div class="hero-radial"></div>
        </div>

        <div class="hero-inner">
          <div class="hero-text">
            <div class="hero-badge" aria-label="Angular 20 plus, Signals, TypeScript">
              Angular 20+ &nbsp;·&nbsp; Signals &nbsp;·&nbsp; TypeScript
            </div>

            <h1 id="hero-title">
              Browser APIs.<br />
              <span class="hl">Done right.</span>
            </h1>

            <p class="hero-sub">
              Three Angular libraries that handle the browser for you. 37 typed services for Web APIs,
              ReDoS-safe regex execution, and off-main-thread HTTP — signals-first, tree-shakable,
              lifecycle-safe.
            </p>

            <div class="hero-ctas">
              <a routerLink="/docs" class="btn btn-primary">
                Get started <span aria-hidden="true">→</span>
              </a>
              <a routerLink="/demo" class="btn btn-outline">Live demo</a>
              <a
                href="https://github.com/Gaspar1992/angular-helpers"
                target="_blank"
                rel="noopener noreferrer"
                class="btn btn-ghost"
                aria-label="GitHub repository (opens in new tab)"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path
                    d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"
                  />
                </svg>
                GitHub
              </a>
            </div>
          </div>

          <div class="hero-code" aria-label="Code example">
            @for (ex of codeExamples; track ex.title) {
              <app-code-window [title]="ex.title" [code]="ex.html" />
            }
          </div>
        </div>
      </section>

      <app-stats-bar [stats]="stats" />

      <section class="section" aria-labelledby="features-title">
        <div class="section-inner">
          <p class="eyebrow">Why Angular Helpers?</p>
          <h2 id="features-title" class="section-heading">
            Everything you need.<br class="br-desk" />Nothing you don't.
          </h2>
          <div class="features-grid">
            @for (f of features; track f.title) {
              <app-feature-card [feature]="f" />
            }
          </div>
        </div>
      </section>

      <section class="section section-alt" aria-labelledby="packages-title">
        <div class="section-inner">
          <p class="eyebrow">Three focused libraries</p>
          <h2 id="packages-title" class="section-heading">Pick what you need.</h2>

          <div class="split-cards">
            @for (p of packages; track p.npmPackage) {
              <app-package-card [pkg]="p" />
            }
          </div>
        </div>
      </section>

      <section class="cta-section" aria-labelledby="cta-title">
        <div class="cta-inner">
          <img ngSrc="icon.webp" alt="" width="52" height="52" aria-hidden="true" class="cta-logo" />
          <h2 id="cta-title">Ready to start?</h2>
          <p>Read the docs or explore the live interactive demo.</p>
          <div class="cta-actions">
            <a routerLink="/docs" class="btn btn-primary">Read the docs</a>
            <a routerLink="/demo" class="btn btn-outline">Open demo</a>
          </div>
        </div>
      </section>

      <app-site-footer />
    </div>
  `,
})
export class HomeComponent {
  protected readonly features = HOME_FEATURES;
  protected readonly stats = HOME_STATS;
  protected readonly packages = HOME_PACKAGES;
  protected readonly codeExamples = HOME_CODE_EXAMPLES;
}
