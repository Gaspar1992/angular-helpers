import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';

const FEATURES = [
  { icon: '⚡', title: 'Signal-based', desc: 'Reactive APIs built on Angular signals and OnPush. No zone.js, no surprises.' },
  { icon: '🎯', title: 'Strongly Typed', desc: 'Strict TypeScript throughout. Every service, every callback, every return value.' },
  { icon: '🛡️', title: 'Secure by Default', desc: 'Regex runs in an isolated Web Worker. ReDoS attacks stopped before they start.' },
  { icon: '🌳', title: 'Tree-shakable', desc: 'Opt-in provider model. Include only what you use. Production bundles stay lean.' },
  { icon: '🔒', title: 'Permission-aware', desc: 'Permission checks and secure-context validation built into every browser service.' },
  { icon: '♻️', title: 'Lifecycle-safe', desc: 'DestroyRef on every service. Workers, streams, and timers always clean up.' },
];

const STATS = [
  { value: '13', label: 'Browser API services' },
  { value: '2', label: 'Focused packages' },
  { value: '100%', label: 'Standalone Angular' },
  { value: 'MIT', label: 'Open source' },
];

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NgOptimizedImage],
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
              Two Angular libraries that handle the browser for you.
              Typed services for 13+ Web APIs, plus ReDoS-safe regex
              execution — signals-first, tree-shakable, lifecycle-safe.
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
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                </svg>
                GitHub
              </a>
            </div>
          </div>

          <div class="hero-code" aria-label="Code example">
            <div class="code-window">
              <div class="window-chrome" aria-hidden="true">
                <span class="dot dot-red"></span>
                <span class="dot dot-yellow"></span>
                <span class="dot dot-green"></span>
                <span class="window-title">app.config.ts</span>
              </div>
              <pre class="window-body"><code><span class="c-kw">import</span> <span class="c-brace">&#123;</span> provideBrowserWebApis <span class="c-brace">&#125;</span> <span class="c-kw">from</span>
  <span class="c-str">'@angular-helpers/browser-web-apis'</span><span class="c-punc">;</span>
<span class="c-kw">import</span> <span class="c-brace">&#123;</span> provideSecurity <span class="c-brace">&#125;</span> <span class="c-kw">from</span>
  <span class="c-str">'@angular-helpers/security'</span><span class="c-punc">;</span>

<span class="c-kw">export const</span> <span class="c-var">appConfig</span> <span class="c-punc">=</span> <span class="c-brace">&#123;</span>
  providers<span class="c-punc">:</span> <span class="c-brace">[</span>
    provideBrowserWebApis<span class="c-punc">(&#123;</span>
      enableGeolocation<span class="c-punc">:</span> <span class="c-bool">true</span><span class="c-punc">,</span>
      enableCamera<span class="c-punc">:</span> <span class="c-bool">true</span><span class="c-punc">,</span>
      enableWebStorage<span class="c-punc">:</span> <span class="c-bool">true</span><span class="c-punc">,</span>
    <span class="c-punc">&#125;),</span>
    provideSecurity<span class="c-punc">(&#123;</span>
      enableRegexSecurity<span class="c-punc">:</span> <span class="c-bool">true</span><span class="c-punc">,</span>
    <span class="c-punc">&#125;),</span>
  <span class="c-brace">]</span>
<span class="c-brace">&#125;;</span>
</code></pre>
            </div>

            <div class="code-window">
              <div class="window-chrome" aria-hidden="true">
                <span class="dot dot-red"></span>
                <span class="dot dot-yellow"></span>
                <span class="dot dot-green"></span>
                <span class="window-title">map.component.ts</span>
              </div>
              <pre class="window-body"><code><span class="c-kw">export class</span> <span class="c-type">MapComponent</span> <span class="c-brace">&#123;</span>
  <span class="c-kw">private</span> geo <span class="c-punc">=</span> inject<span class="c-punc">(</span>GeolocationService<span class="c-punc">);</span>
  position <span class="c-punc">=</span> signal<span class="c-punc">&lt;</span>GeolocationPosition <span class="c-punc">|</span> <span class="c-bool">null</span><span class="c-punc">&gt;(</span><span class="c-bool">null</span><span class="c-punc">);</span>

  <span class="c-kw">async</span> <span class="c-fn">locate</span><span class="c-punc">() &#123;</span>
    <span class="c-kw">const</span> pos <span class="c-punc">=</span> <span class="c-kw">await</span> <span class="c-kw">this</span><span class="c-punc">.</span>geo
      <span class="c-punc">.</span>getCurrentPosition<span class="c-punc">(&#123;</span>
        enableHighAccuracy<span class="c-punc">:</span> <span class="c-bool">true</span>
      <span class="c-punc">&#125;);</span>
    <span class="c-kw">this</span><span class="c-punc">.</span>position<span class="c-punc">.</span>set<span class="c-punc">(</span>pos<span class="c-punc">);</span>
  <span class="c-punc">&#125;</span>
<span class="c-brace">&#125;</span>
</code></pre>
            </div>
          </div>
        </div>
      </section>

      <div class="stats-bar" role="list">
        @for (s of stats; track s.label) {
          <div class="stat" role="listitem">
            <span class="stat-value">{{ s.value }}</span>
            <span class="stat-label">{{ s.label }}</span>
          </div>
        }
      </div>

      <section class="section" aria-labelledby="features-title">
        <div class="section-inner">
          <p class="eyebrow">Why Angular Helpers?</p>
          <h2 id="features-title" class="section-heading">
            Everything you need.<br class="br-desk" />Nothing you don't.
          </h2>
          <div class="features-grid">
            @for (f of features; track f.title) {
              <div class="feature-card">
                <span class="feature-icon" aria-hidden="true">{{ f.icon }}</span>
                <h3>{{ f.title }}</h3>
                <p>{{ f.desc }}</p>
              </div>
            }
          </div>
        </div>
      </section>

      <section class="section section-alt" aria-labelledby="packages-title">
        <div class="section-inner">
          <p class="eyebrow">Two focused libraries</p>
          <h2 id="packages-title" class="section-heading">Pick one. Or both.</h2>

          <div class="split-cards">
            <div class="split-card">
              <div class="split-card-header">
                <span class="split-icon" aria-hidden="true">🌐</span>
                <div>
                  <h3>browser-web-apis</h3>
                  <code class="pkg-pill">@angular-helpers/browser-web-apis</code>
                </div>
              </div>
              <p>
                13 typed Angular services for Camera, Geolocation, Storage,
                WebSocket, Web Workers, Clipboard, Notifications, and more.
                One provider call, full browser coverage.
              </p>
              <ul class="feature-list" aria-label="Included services">
                <li>GeolocationService · CameraService</li>
                <li>WebStorageService · WebSocketService</li>
                <li>WebWorkerService · ClipboardService</li>
                <li>NotificationService · BatteryService · +5 more</li>
              </ul>
              <div class="card-actions">
                <div class="install-chip">
                  <code>npm i @angular-helpers/browser-web-apis</code>
                </div>
                <a routerLink="/docs/browser-web-apis" class="card-link">Documentation →</a>
              </div>
            </div>

            <div class="split-card">
              <div class="split-card-header">
                <span class="split-icon" aria-hidden="true">🛡️</span>
                <div>
                  <h3>security</h3>
                  <code class="pkg-pill">@angular-helpers/security</code>
                </div>
              </div>
              <p>
                Stop ReDoS before it starts. Runs regular expressions in an
                isolated Web Worker with timeout protection, complexity
                analysis, and a fluent builder API.
              </p>
              <ul class="feature-list" aria-label="Security features">
                <li>Worker-isolated regex execution</li>
                <li>Configurable timeout (default 5 000 ms)</li>
                <li>Pattern complexity analysis</li>
                <li>RegexSecurityBuilder fluent API</li>
              </ul>
              <div class="card-actions">
                <div class="install-chip">
                  <code>npm i @angular-helpers/security</code>
                </div>
                <a routerLink="/docs/security" class="card-link">Documentation →</a>
              </div>
            </div>
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

      <footer class="site-footer">
        <div class="footer-inner">
          <div class="footer-brand">
            <img ngSrc="icon.webp" alt="Angular Helpers" width="24" height="24" class="footer-icon" />
            <span>Angular Helpers</span>
          </div>
          <nav class="footer-nav" aria-label="Footer navigation">
            <a routerLink="/docs">Docs</a>
            <a routerLink="/demo">Demo</a>
            <a href="https://github.com/Gaspar1992/angular-helpers" target="_blank" rel="noopener noreferrer">GitHub ↗</a>
          </nav>
          <p class="footer-copy">MIT License · Open source</p>
        </div>
      </footer>

    </div>
  `,
})
export class HomeComponent {
  protected readonly features = FEATURES;
  protected readonly stats = STATS;
}
