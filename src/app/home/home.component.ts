import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { HOME_FEATURES, HOME_STATS, HOME_PACKAGES, HOME_CODE_TABS } from './config/home.config';
import { CodeWindowComponent } from '../shared/components/code-window/code-window.component';
import { StatsBarComponent } from './ui/stats-bar/stats-bar.component';
import { FeatureCardComponent } from './ui/feature-card/feature-card.component';
import { SiteFooterComponent } from '../shared/components/site-footer/site-footer.component';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    NgOptimizedImage,
    CodeWindowComponent,
    FeatureCardComponent,
    StatsBarComponent,
    SiteFooterComponent,
  ],
  template: `
    <!-- MAIN WRAPPER -->
    <main class="min-h-screen">
      <!-- HERO SECTION -->
      <section class="hero-section @container">
        <!-- Ambient Background -->
        <div class="ambient-glow glow-primary"></div>
        <div class="ambient-glow glow-secondary"></div>

        <div class="max-width-container grid place-items-center gap-12 @3xl:gap-16">
          <header class="text-center max-w-3xl flex flex-col items-center gap-6 z-10">
            <!-- Badge -->
            <div class="badge badge-outline gap-2 p-4 rounded-full shadow-sm">
              <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span class="text-[11px] font-black uppercase tracking-widest text-base-content/60"
                >Version 1.41.1 is out</span
              >
            </div>

            <!-- Título Directo y Claro -->
            <h1
              class="text-5xl @3xl:text-[5rem] font-black leading-[1.1] tracking-tight text-balance text-base-content m-0"
            >
              Master Web APIs in <br />
              <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-primary"
                >Angular.</span
              >
            </h1>

            <p
              class="text-lg @xl:text-xl text-base-content/70 font-medium text-balance max-w-2xl m-0"
            >
              Signal-based utilities to seamlessly integrate Browser APIs, Security, and Web
              Workers. Zero boilerplate.
            </p>

            <!-- Actions -->
            <div class="flex flex-wrap items-center justify-center gap-4 mt-4">
              <a
                routerLink="/docs"
                class="btn btn-primary btn-lg shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all font-bold px-8 border-none"
              >
                Get started
              </a>
              <!-- Snippet interactivo -->
              <div
                class="flex items-center gap-3 bg-base-200 border border-base-300 rounded-xl px-4 py-2 shadow-inner"
              >
                <code class="font-mono text-sm text-base-content/80">pnpm add angular-helpers</code>
                <button
                  class="btn btn-square btn-sm btn-ghost text-base-content/60 hover:text-base-content"
                  aria-label="Copy command"
                  (click)="copyInstallCommand()"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
              </div>
            </div>
          </header>

          <!-- Code Window -->
          <div
            class="w-full max-w-4xl z-10 shadow-2xl rounded-box overflow-hidden border border-base-300"
          >
            <app-code-window [tabs]="codeTabs" />
          </div>
        </div>
      </section>

      <!-- STATS -->
      @defer (on viewport) {
        <app-stats-bar [stats]="stats" />
      } @placeholder {
        <div class="h-24 w-full bg-base-200/50 animate-pulse"></div>
      }

      <!-- FEATURES SECTION -->
      @defer (on viewport) {
        <section class="py-24 sm:py-32 px-6 border-b border-base-300 bg-base-100">
          <div class="max-w-[1200px] mx-auto">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-10 sm:gap-14">
              @for (f of features; track f.title) {
                <app-feature-card [feature]="f" />
              }
            </div>
          </div>
        </section>
      } @placeholder {
        <div class="h-96 bg-base-200/50 animate-pulse"></div>
      }

      <!-- PACKAGES BENTO BOX -->
      @defer (on viewport) {
        <section class="py-24 sm:py-32 px-6 border-b border-base-300 bg-base-100 @container">
          <div class="max-w-[1000px] mx-auto">
            <p
              class="text-xs font-black uppercase tracking-[0.2em] text-primary m-0 mb-4 text-center"
            >
              Modular Architecture
            </p>
            <h2
              class="text-[2.5rem] sm:text-[3.5rem] font-black text-base-content tracking-tighter leading-none m-0 mb-16 text-center text-balance"
            >
              Four tools. <br class="sm:hidden" />Zero bloat.
            </h2>

            <div class="grid grid-cols-1 @4xl:grid-cols-2 gap-8">
              @for (p of packages; track p.npmPackage; let i = $index) {
                <div [class.@4xl:col-span-2]="i === 0" class="h-full">
                  <div
                    class="flex flex-col gap-8 bg-base-200 border border-base-300 rounded-[2rem] p-10 h-full transition-colors duration-300 hover:border-primary/50 group relative overflow-hidden shadow-xl"
                  >
                    @if (i === 0) {
                      <div
                        class="absolute right-0 top-0 bottom-0 w-1/2 opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none hidden md:block overflow-hidden"
                        aria-hidden="true"
                      >
                        <div
                          class="absolute inset-0 bg-gradient-to-l from-transparent to-base-200 z-10"
                        ></div>
                        <div
                          class="w-full h-full flex flex-col justify-center items-end pr-10 gap-8"
                        >
                          <div
                            class="w-48 h-12 bg-base-100 rounded-xl border border-base-300 flex items-center px-4 shadow-sm"
                          >
                            <span class="text-xs font-mono text-base-content/50">UI Thread</span>
                          </div>
                          <div
                            class="w-48 h-16 bg-primary/10 rounded-xl border border-primary/30 shadow-[0_0_30px_rgba(59,130,246,0.2)] flex items-center px-4 relative"
                          >
                            <div class="absolute -top-6 left-1/2 w-0.5 h-6 bg-primary/40"></div>
                            <span class="text-xs font-mono text-primary font-bold">Web Worker</span>
                          </div>
                        </div>
                      </div>
                    }

                    <div class="flex items-start gap-5 relative z-10">
                      <div class="p-4 bg-base-100 rounded-2xl border border-base-300 shadow-sm">
                        <span class="text-4xl leading-none shrink-0" aria-hidden="true">{{
                          p.icon
                        }}</span>
                      </div>
                      <div>
                        <h3
                          class="text-2xl font-black text-base-content m-0 mb-2 flex items-center gap-3 tracking-tight"
                        >
                          {{ p.name }}
                          @if (p.badge) {
                            <span class="badge badge-primary font-black">{{ p.badge }}</span>
                          }
                        </h3>
                        <code
                          class="text-xs font-mono text-primary/90 bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-lg"
                        >
                          {{ p.npmPackage }}
                        </code>
                      </div>
                    </div>

                    <p
                      class="text-base text-base-content/60 leading-relaxed max-w-[450px] relative z-10 font-medium m-0"
                    >
                      {{ p.description }}
                    </p>

                    <div class="flex flex-wrap gap-2.5 mt-2 relative z-10">
                      @for (item of p.highlights; track item) {
                        <span
                          class="badge badge-outline border-base-content/20 hover:border-base-content/40 text-base-content/70"
                        >
                          {{ item }}
                        </span>
                      }
                    </div>

                    <div class="mt-auto pt-8 flex items-center justify-between relative z-10">
                      @if (p.docsLink) {
                        <a
                          [routerLink]="p.docsLink"
                          class="btn btn-ghost btn-sm text-base-content/60 hover:text-base-content hover:bg-base-content/5 rounded-xl font-bold px-4"
                        >
                          Explore documentation <span class="ml-1">→</span>
                        </a>
                      } @else {
                        <span class="text-sm text-base-content/40 italic font-medium ml-4"
                          >Documentation under construction</span
                        >
                      }
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        </section>
      } @placeholder {
        <div class="h-96 bg-base-200/50 animate-pulse"></div>
      }

      <!-- CTA SECTION -->
      @defer (on viewport) {
        <section class="py-24 sm:py-32 px-6 border-b border-base-300 bg-base-200">
          <div class="max-w-[560px] mx-auto text-center flex flex-col items-center gap-6">
            <div class="p-5 bg-base-100 rounded-[2rem] border border-base-300 shadow-inner mb-2">
              <img
                ngSrc="icon.webp"
                alt=""
                width="64"
                height="64"
                aria-hidden="true"
                class="drop-shadow-[0_0_20px_rgba(59,130,246,0.4)]"
              />
            </div>
            <h2
              class="text-[2.5rem] sm:text-[3.5rem] font-black text-base-content tracking-tighter leading-none m-0 text-balance"
            >
              Ready to scale?
            </h2>
            <p class="text-lg text-base-content/60 leading-relaxed font-medium m-0 text-balance">
              Join hundreds of developers building robust, high-performance Angular applications
              with our specialized helper suite.
            </p>
            <div class="flex flex-wrap gap-4 justify-center mt-4">
              <a
                routerLink="/docs"
                class="btn btn-primary btn-lg px-10 rounded-2xl font-black shadow-xl shadow-primary/20 border-none"
              >
                Start building
              </a>
              <a
                href="https://github.com/Gaspar1992/angular-helpers"
                target="_blank"
                class="btn btn-outline btn-lg border-base-300 hover:border-base-content/30 hover:bg-base-content/5 text-base-content font-bold px-10 rounded-2xl"
              >
                GitHub
              </a>
            </div>
          </div>
        </section>
      } @placeholder {
        <div class="h-64 bg-base-200/30 animate-pulse"></div>
      }

      <app-site-footer />
    </main>
  `,
  styles: `
    @reference "../../styles.css";
    .hero-section {
      @apply relative overflow-hidden pt-24 pb-32 border-b border-base-300 bg-base-100;
    }
    .ambient-glow {
      @apply absolute rounded-full blur-[120px] pointer-events-none opacity-50;
    }
    .glow-primary {
      @apply -top-24 -left-20 w-96 h-96 bg-primary/20;
    }
    .glow-secondary {
      @apply top-1/2 -right-20 w-80 h-80 bg-secondary/10;
    }
  `,
})
export class HomeComponent {
  protected readonly features = HOME_FEATURES;
  protected readonly stats = HOME_STATS;
  protected readonly packages = HOME_PACKAGES;
  protected readonly codeTabs = HOME_CODE_TABS;

  copyInstallCommand() {
    navigator.clipboard.writeText('pnpm add angular-helpers');
  }
}
