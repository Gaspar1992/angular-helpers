import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';

const FEATURES = [
  {
    icon: '⚡',
    title: 'Signal-based',
    description: 'Reactive APIs built with Angular signals, computed(), and OnPush change detection out of the box.',
  },
  {
    icon: '🎯',
    title: 'Strongly Typed',
    description: 'Full TypeScript coverage with strict mode. No any, no guessing — just clean IntelliSense.',
  },
  {
    icon: '🛡️',
    title: 'Secure by Default',
    description: 'ReDoS prevention baked in. Regex execution runs in isolated Web Workers with configurable timeouts.',
  },
  {
    icon: '🌳',
    title: 'Tree-shakable',
    description: 'Modular providers — include only what you use. Zero dead code in your production bundles.',
  },
  {
    icon: '🔒',
    title: 'Permission-aware',
    description: 'Built-in browser permission checks and secure-context validation before any API call.',
  },
  {
    icon: '♻️',
    title: 'Lifecycle-safe',
    description: 'DestroyRef integration on every service. Subscriptions and workers clean up automatically.',
  },
];

const PACKAGES = [
  {
    icon: '🌐',
    name: 'browser-web-apis',
    npm: '@angular-helpers/browser-web-apis',
    description:
      '13 typed Angular services for Camera, Geolocation, Storage, WebSocket, Web Workers, Clipboard, and more. One import, one provider call, full browser coverage.',
    services: 13,
    docsRoute: '/docs/browser-web-apis',
  },
  {
    icon: '🛡️',
    name: 'security',
    npm: '@angular-helpers/security',
    description:
      'Stop ReDoS attacks before they happen. Run regular expressions inside Web Workers with timeout protection, complexity analysis, and a fluent builder API.',
    services: 2,
    docsRoute: '/docs/security',
  },
];

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NgOptimizedImage],
  template: `
    <div class="home">
      <!-- ── Hero ── -->
      <section class="hero" aria-labelledby="hero-title">
        <div class="hero-glow" aria-hidden="true"></div>
        <div class="hero-inner">
          <div class="hero-badge">Angular 20+ · TypeScript · Standalone</div>

          <img
            ngSrc="icon.webp"
            alt="Angular Helpers logo"
            width="96"
            height="96"
            class="hero-logo"
            priority
          />

          <h1 id="hero-title">
            Angular <span class="gradient-text">Helpers</span>
          </h1>

          <p class="hero-tagline">
            Browser APIs &amp; Security — done right for Angular.
          </p>
          <p class="hero-description">
            Two focused, production-ready libraries for modern Angular apps.
            Typed services for 13+ browser APIs, plus ReDoS-safe regex execution
            via Web Workers.
          </p>

          <div class="hero-actions">
            <a routerLink="/docs" class="btn btn-primary">
              Get Started
              <span aria-hidden="true">→</span>
            </a>
            <a routerLink="/demo" class="btn btn-ghost">
              Live Demo
            </a>
            <a
              href="https://github.com/Gaspar1992/angular-helpers"
              target="_blank"
              rel="noopener noreferrer"
              class="btn btn-ghost"
              aria-label="View on GitHub (opens in new tab)"
            >
              GitHub ↗
            </a>
          </div>

          <div class="hero-installs">
            <code class="install-line">npm install @angular-helpers/browser-web-apis</code>
            <code class="install-line">npm install @angular-helpers/security</code>
          </div>
        </div>
      </section>

      <!-- ── Features ── -->
      <section class="section features-section" aria-labelledby="features-title">
        <div class="section-inner">
          <h2 id="features-title" class="section-title">Why Angular Helpers?</h2>
          <p class="section-lead">
            Stop writing boilerplate for browser APIs. Stop worrying about ReDoS. Focus on your app.
          </p>
          <div class="features-grid">
            @for (f of features; track f.title) {
              <div class="feature-card">
                <span class="feature-icon" aria-hidden="true">{{ f.icon }}</span>
                <h3>{{ f.title }}</h3>
                <p>{{ f.description }}</p>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- ── Packages ── -->
      <section class="section packages-section" aria-labelledby="packages-title">
        <div class="section-inner">
          <h2 id="packages-title" class="section-title">Two focused packages</h2>
          <div class="packages-grid">
            @for (pkg of packages; track pkg.name) {
              <div class="pkg-card">
                <div class="pkg-card-top">
                  <span class="pkg-icon" aria-hidden="true">{{ pkg.icon }}</span>
                  <div>
                    <h3>{{ pkg.name }}</h3>
                    <code class="pkg-npm">{{ pkg.npm }}</code>
                  </div>
                </div>
                <p class="pkg-desc">{{ pkg.description }}</p>
                <div class="pkg-install">
                  <code>npm install {{ pkg.npm }}</code>
                </div>
                <div class="pkg-footer">
                  @if (pkg.services > 1) {
                    <span class="pkg-stat">{{ pkg.services }} services</span>
                  }
                  <a [routerLink]="pkg.docsRoute" class="pkg-link">
                    View documentation →
                  </a>
                </div>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- ── Quick Setup ── -->
      <section class="section setup-section" aria-labelledby="setup-title">
        <div class="section-inner">
          <h2 id="setup-title" class="section-title">Up and running in minutes</h2>
          <div class="setup-steps">
            <div class="setup-step">
              <span class="step-num" aria-hidden="true">1</span>
              <div>
                <h3>Install</h3>
                <div class="code-block">
                  <pre><code>npm install @angular-helpers/browser-web-apis</code></pre>
                </div>
              </div>
            </div>
            <div class="setup-step">
              <span class="step-num" aria-hidden="true">2</span>
              <div>
                <h3>Configure</h3>
                <div class="code-block">
                  <pre><code>bootstrapApplication(AppComponent, &#123;
  providers: [
    provideBrowserWebApis(&#123;
      enableCamera: true,
      enableGeolocation: true,
    &#125;),
  ],
&#125;);</code></pre>
                </div>
              </div>
            </div>
            <div class="setup-step">
              <span class="step-num" aria-hidden="true">3</span>
              <div>
                <h3>Use</h3>
                <div class="code-block">
                  <pre><code>export class MapComponent &#123;
  private geo = inject(GeolocationService);

  async locate() &#123;
    const pos = await this.geo.getCurrentPosition();
    console.log(pos.coords);
  &#125;
&#125;</code></pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Footer CTA ── -->
      <section class="home-footer">
        <div class="section-inner footer-inner">
          <img ngSrc="icon.webp" alt="" width="40" height="40" aria-hidden="true" class="footer-logo" />
          <p class="footer-text">
            Open source · MIT License · Built for Angular 20+
          </p>
          <div class="footer-links">
            <a routerLink="/docs">Documentation</a>
            <a routerLink="/demo">Demo</a>
            <a href="https://github.com/Gaspar1992/angular-helpers" target="_blank" rel="noopener noreferrer">
              GitHub ↗
            </a>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      .home {
        min-height: 100vh;
      }

      /* ── Hero ──────────────────────────── */
      .hero {
        position: relative;
        overflow: hidden;
        padding: var(--sp-12) var(--sp-4) var(--sp-12);
        text-align: center;
        border-bottom: 1px solid var(--border);
      }

      @media (min-width: 640px) {
        .hero { padding: 6rem var(--sp-6) 5rem; }
      }

      .hero-glow {
        position: absolute;
        inset: 0;
        background:
          radial-gradient(ellipse 80% 50% at 50% -10%, rgba(107, 140, 242, 0.18) 0%, transparent 70%),
          radial-gradient(ellipse 60% 40% at 80% 100%, rgba(107, 140, 242, 0.08) 0%, transparent 60%);
        pointer-events: none;
      }

      .hero-inner {
        position: relative;
        max-width: 720px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--sp-5);
      }

      .hero-badge {
        display: inline-flex;
        align-items: center;
        gap: var(--sp-2);
        font-size: var(--text-xs);
        font-weight: 600;
        color: var(--accent);
        background: var(--accent-dim);
        border: 1px solid var(--accent-border);
        padding: 0.3rem 0.8rem;
        border-radius: 999px;
        letter-spacing: 0.03em;
      }

      .hero-logo {
        width: 80px;
        height: 80px;
        object-fit: contain;
        filter: drop-shadow(0 0 32px rgba(107, 140, 242, 0.4));
      }

      @media (min-width: 640px) {
        .hero-logo { width: 96px; height: 96px; }
      }

      h1 {
        font-size: 2.25rem;
        font-weight: 900;
        color: var(--text-white);
        margin: 0;
        letter-spacing: -0.04em;
        line-height: 1.1;
      }

      @media (min-width: 640px) {
        h1 { font-size: 3.25rem; }
      }

      .gradient-text {
        background: linear-gradient(135deg, #6b8cf2 0%, #a78bf8 50%, #6b8cf2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .hero-tagline {
        font-size: 1.1rem;
        font-weight: 600;
        color: #c0c8e0;
        margin: 0;
      }

      @media (min-width: 640px) {
        .hero-tagline { font-size: 1.3rem; }
      }

      .hero-description {
        font-size: 0.92rem;
        color: var(--text-secondary);
        line-height: 1.75;
        max-width: 560px;
        margin: 0;
      }

      @media (min-width: 640px) {
        .hero-description { font-size: 1rem; }
      }

      .hero-actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--sp-3);
        justify-content: center;
      }

      .btn {
        display: inline-flex;
        align-items: center;
        gap: var(--sp-2);
        padding: 0.65rem 1.4rem;
        border-radius: var(--radius-lg);
        font-size: 0.92rem;
        font-weight: 600;
        text-decoration: none;
        transition: all var(--transition);
        white-space: nowrap;
      }

      .btn-primary {
        background: var(--accent);
        color: #fff;
        box-shadow: 0 0 24px rgba(107, 140, 242, 0.35);
      }

      .btn-primary:hover {
        background: #8da8f8;
        box-shadow: 0 0 32px rgba(107, 140, 242, 0.5);
        transform: translateY(-1px);
      }

      .btn-ghost {
        background: rgba(255, 255, 255, 0.06);
        color: #c0c8e0;
        border: 1px solid var(--border);
      }

      .btn-ghost:hover {
        background: rgba(255, 255, 255, 0.1);
        color: var(--text-white);
        transform: translateY(-1px);
      }

      .btn:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 3px;
      }

      .hero-installs {
        display: flex;
        flex-direction: column;
        gap: var(--sp-2);
        align-items: center;
      }

      .install-line {
        display: block;
        font-family: var(--font-mono);
        font-size: 0.78rem;
        color: var(--text-success);
        background: rgba(0, 0, 0, 0.35);
        border: 1px solid var(--border);
        padding: 0.4rem 0.9rem;
        border-radius: var(--radius-md);
        white-space: nowrap;
      }

      /* ── Sections shared ───────────────── */
      .section {
        padding: var(--sp-12) var(--sp-4);
        border-bottom: 1px solid var(--border);
      }

      @media (min-width: 640px) {
        .section { padding: 5rem var(--sp-6); }
      }

      .section-inner {
        max-width: 1080px;
        margin: 0 auto;
      }

      .section-title {
        font-size: 1.5rem;
        font-weight: 800;
        color: var(--text-white);
        text-align: center;
        margin: 0 0 var(--sp-3);
        letter-spacing: -0.03em;
      }

      @media (min-width: 640px) {
        .section-title { font-size: 2rem; }
      }

      .section-lead {
        font-size: 0.95rem;
        color: var(--text-secondary);
        text-align: center;
        max-width: 520px;
        margin: 0 auto var(--sp-10);
        line-height: 1.7;
      }

      @media (min-width: 640px) {
        .section-lead { font-size: 1rem; }
      }

      /* ── Features grid ──────────────────── */
      .features-section {
        background: rgba(255, 255, 255, 0.015);
      }

      .features-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: var(--sp-4);
      }

      @media (min-width: 480px) {
        .features-grid { grid-template-columns: repeat(2, 1fr); }
      }

      @media (min-width: 900px) {
        .features-grid { grid-template-columns: repeat(3, 1fr); }
      }

      .feature-card {
        background: var(--bg-surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-xl);
        padding: var(--sp-5);
        transition: border-color var(--transition), transform var(--transition);
      }

      .feature-card:hover {
        border-color: var(--accent-border);
        transform: translateY(-2px);
      }

      .feature-icon {
        font-size: 1.75rem;
        display: block;
        margin-bottom: var(--sp-3);
        line-height: 1;
      }

      .feature-card h3 {
        font-size: 1rem;
        font-weight: 700;
        color: var(--text-white);
        margin: 0 0 var(--sp-2);
      }

      .feature-card p {
        font-size: 0.87rem;
        color: var(--text-secondary);
        margin: 0;
        line-height: 1.65;
      }

      /* ── Packages grid ──────────────────── */
      .packages-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: var(--sp-5);
      }

      @media (min-width: 640px) {
        .packages-grid { grid-template-columns: repeat(2, 1fr); }
      }

      .pkg-card {
        background: var(--bg-surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-xl);
        padding: var(--sp-6);
        display: flex;
        flex-direction: column;
        gap: var(--sp-4);
        transition: border-color var(--transition);
      }

      .pkg-card:hover {
        border-color: var(--accent-border);
      }

      .pkg-card-top {
        display: flex;
        align-items: flex-start;
        gap: var(--sp-3);
      }

      .pkg-icon {
        font-size: 2rem;
        line-height: 1;
        margin-top: 2px;
      }

      .pkg-card h3 {
        font-size: 1.05rem;
        font-weight: 700;
        color: var(--text-white);
        margin: 0 0 var(--sp-1);
      }

      .pkg-npm {
        font-size: var(--text-xs);
        color: var(--accent);
        background: var(--accent-dim);
        padding: 0.15rem 0.4rem;
        border-radius: var(--radius-sm);
        font-family: var(--font-mono);
      }

      .pkg-desc {
        font-size: 0.88rem;
        color: var(--text-secondary);
        line-height: 1.65;
        margin: 0;
        flex: 1;
      }

      .pkg-install {
        background: var(--bg-base);
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        padding: var(--sp-2) var(--sp-3);
        overflow-x: auto;
      }

      .pkg-install code {
        font-size: var(--text-sm);
        color: var(--text-success);
        font-family: var(--font-mono);
        white-space: nowrap;
      }

      .pkg-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--sp-3);
        flex-wrap: wrap;
      }

      .pkg-stat {
        font-size: var(--text-xs);
        font-weight: 600;
        color: var(--text-muted);
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid var(--border);
        padding: 0.2rem 0.5rem;
        border-radius: var(--radius-sm);
      }

      .pkg-link {
        color: var(--accent);
        font-size: 0.87rem;
        font-weight: 600;
        text-decoration: none;
        transition: color var(--transition);
        margin-left: auto;
      }

      .pkg-link:hover {
        color: #8da8f8;
      }

      .pkg-link:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 2px;
        border-radius: 2px;
      }

      /* ── Setup steps ─────────────────────── */
      .setup-steps {
        display: flex;
        flex-direction: column;
        gap: var(--sp-8);
        max-width: 720px;
        margin: 0 auto;
      }

      .setup-step {
        display: flex;
        gap: var(--sp-5);
        align-items: flex-start;
      }

      .step-num {
        flex-shrink: 0;
        width: 2rem;
        height: 2rem;
        background: var(--accent-dim);
        border: 1px solid var(--accent-border);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.82rem;
        font-weight: 700;
        color: var(--accent);
        margin-top: 2px;
      }

      .setup-step h3 {
        font-size: 0.95rem;
        font-weight: 700;
        color: var(--text-white);
        margin: 0 0 var(--sp-3);
      }

      .code-block {
        background: var(--bg-elevated);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        overflow-x: auto;
      }

      .code-block pre {
        margin: 0;
        padding: var(--sp-4) var(--sp-5);
      }

      .code-block code {
        font-family: var(--font-mono);
        font-size: var(--text-sm);
        color: var(--text-code);
        line-height: 1.65;
      }

      /* ── Footer ─────────────────────────── */
      .home-footer {
        padding: var(--sp-10) var(--sp-4);
        background: var(--bg-sidebar);
      }

      .footer-inner {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--sp-4);
        text-align: center;
      }

      .footer-logo {
        width: 36px;
        height: 36px;
        object-fit: contain;
        opacity: 0.7;
      }

      .footer-text {
        font-size: var(--text-sm);
        color: var(--text-muted);
        margin: 0;
      }

      .footer-links {
        display: flex;
        flex-wrap: wrap;
        gap: var(--sp-5);
        justify-content: center;
      }

      .footer-links a {
        font-size: var(--text-sm);
        color: var(--text-secondary);
        text-decoration: none;
        transition: color var(--transition);
      }

      .footer-links a:hover {
        color: var(--accent);
      }

      .footer-links a:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 2px;
        border-radius: 2px;
      }
    `,
  ],
})
export class HomeComponent {
  protected readonly features = FEATURES;
  protected readonly packages = PACKAGES;
}
