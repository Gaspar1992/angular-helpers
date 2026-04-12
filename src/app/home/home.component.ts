import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { CodeWindowComponent } from '../shared/components/code-window/code-window.component';
import { SiteFooterComponent } from '../shared/components/site-footer/site-footer.component';
import { FeatureCardComponent } from './ui/feature-card/feature-card.component';
import { PackageCardComponent } from './ui/package-card/package-card.component';
import { StatsBarComponent } from './ui/stats-bar/stats-bar.component';
import { HOME_FEATURES, HOME_STATS, HOME_PACKAGES, HOME_CODE_EXAMPLES } from './config/home.config';

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
  template: `
    <div class="min-h-screen">
      <!-- ── Hero ──────────────────────────────────────── -->
      <section
        class="relative overflow-hidden pt-16 sm:pt-20 border-b border-base-300"
        aria-labelledby="hero-title"
      >
        <!-- Background decoration -->
        <div class="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div
            class="absolute inset-0 [background-image:radial-gradient(oklch(69%_0.18_254_/_0.12)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(ellipse_80%_100%_at_50%_0%,black_40%,transparent_100%)]"
          ></div>
          <div
            class="absolute inset-0 [background:radial-gradient(ellipse_70%_60%_at_60%_0%,oklch(69%_0.18_254_/_0.14)_0%,transparent_65%),radial-gradient(ellipse_50%_40%_at_10%_80%,oklch(72%_0.16_292_/_0.07)_0%,transparent_60%)]"
          ></div>
        </div>

        <div
          class="relative max-w-[1160px] mx-auto px-4 sm:px-6 pb-16 sm:pb-20 flex flex-col gap-10 md:flex-row md:items-center md:gap-16"
        >
          <!-- Text -->
          <div class="flex-1 flex flex-col gap-6">
            <div
              class="inline-block w-fit text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full tracking-widest"
              aria-label="Angular 20 plus, Signals, TypeScript"
            >
              Angular 20+ &nbsp;·&nbsp; Signals &nbsp;·&nbsp; TypeScript
            </div>

            <h1
              id="hero-title"
              class="text-[2.6rem] sm:text-[3.4rem] md:text-[4rem] font-black text-base-content leading-[1.08] tracking-[-0.04em] m-0"
            >
              Every Angular app<br />solves the same<br />browser problems.<br />
              <span
                class="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent"
              >
                We solved them once.
              </span>
            </h1>

            <p class="text-base sm:text-lg text-base-content/60 leading-relaxed max-w-[480px] m-0">
              Typed, tested, tree-shakable. Three focused libraries for the browser work Angular
              developers keep rebuilding from scratch.
            </p>

            <div class="flex flex-wrap gap-3 items-center">
              <a routerLink="/docs" class="btn btn-primary">
                Get started <span aria-hidden="true">→</span>
              </a>
              <a routerLink="/demo" class="btn btn-outline btn-primary">Live demo</a>
              <a
                href="https://github.com/Gaspar1992/angular-helpers"
                target="_blank"
                rel="noopener noreferrer"
                class="btn btn-ghost"
                aria-label="GitHub repository (opens in new tab)"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"
                  />
                </svg>
                GitHub
              </a>
            </div>
          </div>

          <!-- Code windows -->
          <div
            class="flex-1 flex flex-col gap-3 min-w-0 md:flex-none md:w-[440px]"
            aria-label="Code example"
          >
            @for (ex of codeExamples; track ex.title) {
              <app-code-window [title]="ex.title" [code]="ex.html" />
            }
          </div>
        </div>
      </section>

      <!-- ── Stats bar ──────────────────────────────────── -->
      <app-stats-bar [stats]="stats" />

      <!-- ── Why section ───────────────────────────────── -->
      <section
        class="py-20 sm:py-24 px-4 sm:px-6 border-b border-base-300"
        aria-labelledby="features-title"
      >
        <div class="max-w-[1100px] mx-auto">
          <p class="text-xs font-bold uppercase tracking-[0.1em] text-primary m-0 mb-3">
            Why Angular Helpers?
          </p>
          <h2
            id="features-title"
            class="text-[1.75rem] sm:text-[2.25rem] font-extrabold text-base-content tracking-tight leading-snug m-0 mb-10"
          >
            Everything you need.<br class="hidden sm:block" />Nothing you don't.
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (f of features; track f.title) {
              <app-feature-card [feature]="f" />
            }
          </div>
        </div>
      </section>

      <!-- ── Packages section ──────────────────────────── -->
      <section
        class="py-20 sm:py-24 px-4 sm:px-6 border-b border-base-300 bg-base-200/50"
        aria-labelledby="packages-title"
      >
        <div class="max-w-[1100px] mx-auto">
          <p class="text-xs font-bold uppercase tracking-[0.1em] text-primary m-0 mb-3">
            Three focused libraries
          </p>
          <h2
            id="packages-title"
            class="text-[1.75rem] sm:text-[2.25rem] font-extrabold text-base-content tracking-tight leading-snug m-0 mb-10"
          >
            Pick what you need.
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            @for (p of packages; track p.npmPackage) {
              <app-package-card [pkg]="p" />
            }
          </div>
        </div>
      </section>

      <!-- ── CTA section ───────────────────────────────── -->
      <section
        class="py-20 sm:py-24 px-4 border-b border-base-300 bg-base-300/60"
        aria-labelledby="cta-title"
      >
        <div class="max-w-[560px] mx-auto text-center flex flex-col items-center gap-5">
          <img
            ngSrc="icon.webp"
            alt=""
            width="52"
            height="52"
            aria-hidden="true"
            class="drop-shadow-[0_0_20px_oklch(69%_0.18_254_/_0.5)]"
          />
          <h2
            id="cta-title"
            class="text-[2rem] sm:text-[2.5rem] font-extrabold text-base-content tracking-tight m-0"
          >
            Ready to start?
          </h2>
          <p class="text-base text-base-content/60 m-0">
            Read the docs or explore the live interactive demo.
          </p>
          <div class="flex flex-wrap gap-3 justify-center">
            <a routerLink="/docs" class="btn btn-primary">Read the docs</a>
            <a routerLink="/demo" class="btn btn-outline btn-primary">Open demo</a>
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
