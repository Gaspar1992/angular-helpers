import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-docs-landing',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="landing">
      <div class="landing-hero">
        <h1>Angular Helpers — Documentation</h1>
        <p class="lead">
          A collection of Angular libraries providing secure, reactive access to Browser APIs and
          security utilities.
        </p>
      </div>

      <div class="packages-grid">
        <div class="package-card">
          <div class="pkg-header">
            <span class="pkg-icon">🌐</span>
            <div>
              <h2>browser-web-apis</h2>
              <code class="npm-pkg">&#64;angular-helpers/browser-web-apis</code>
            </div>
          </div>
          <p>
            13 strongly typed Angular services for Camera, Geolocation, Storage, WebSocket, Web
            Workers, and more — all with built-in browser support detection and reactive APIs.
          </p>
          <div class="pkg-meta">
            <span class="badge">13 services</span>
            <span class="badge">Signals</span>
            <span class="badge">OnPush</span>
          </div>
          <div class="pkg-install">
            <code>npm install &#64;angular-helpers/browser-web-apis</code>
          </div>
          <a routerLink="/docs/browser-web-apis" class="btn-docs">View documentation →</a>
        </div>

        <div class="package-card">
          <div class="pkg-header">
            <span class="pkg-icon">🛡️</span>
            <div>
              <h2>security</h2>
              <code class="npm-pkg">&#64;angular-helpers/security</code>
            </div>
          </div>
          <p>
            ReDoS prevention via Web Worker-isolated regex execution. Includes a fluent builder API
            and complexity analysis for safe regular expression usage in Angular apps.
          </p>
          <div class="pkg-meta">
            <span class="badge">ReDoS Prevention</span>
            <span class="badge">Web Workers</span>
            <span class="badge">Builder Pattern</span>
          </div>
          <div class="pkg-install">
            <code>npm install &#64;angular-helpers/security</code>
          </div>
          <a routerLink="/docs/security" class="btn-docs">View documentation →</a>
        </div>
      </div>

      <section class="quick-start">
        <h2>Quick setup</h2>
        <p>Register all providers at bootstrap:</p>
        <div class="code-snippet">
          <pre><code>import &#123; provideBrowserWebApis &#125; from '&#64;angular-helpers/browser-web-apis';
import &#123; provideSecurity &#125; from '&#64;angular-helpers/security';

bootstrapApplication(AppComponent, &#123;
  providers: [
    provideBrowserWebApis(&#123; enableCamera: true, enableGeolocation: true &#125;),
    provideSecurity(&#123; enableRegexSecurity: true &#125;),
  ],
&#125;);</code></pre>
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      .landing {
        padding-bottom: 3rem;
      }

      .landing-hero {
        margin-bottom: 2.5rem;
      }

      h1 {
        font-size: 2rem;
        font-weight: 800;
        color: #fff;
        margin: 0 0 0.75rem;
        letter-spacing: -0.03em;
      }

      .lead {
        font-size: 1.1rem;
        color: #909ab8;
        max-width: 600px;
        line-height: 1.7;
        margin: 0;
      }

      .packages-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 1.5rem;
        margin-bottom: 3rem;
      }

      .package-card {
        background: #1a1c28;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .pkg-header {
        display: flex;
        align-items: flex-start;
        gap: 0.875rem;
      }

      .pkg-icon {
        font-size: 1.75rem;
        line-height: 1;
        margin-top: 0.1rem;
      }

      .pkg-header h2 {
        font-size: 1.15rem;
        font-weight: 700;
        color: #fff;
        margin: 0 0 0.25rem;
      }

      .npm-pkg {
        font-size: 0.78rem;
        color: #6b8cf2;
        background: rgba(107, 140, 242, 0.12);
        padding: 0.15rem 0.4rem;
        border-radius: 4px;
      }

      .package-card p {
        color: #909ab8;
        font-size: 0.9rem;
        line-height: 1.65;
        margin: 0;
      }

      .pkg-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
      }

      .badge {
        font-size: 0.72rem;
        font-weight: 600;
        padding: 0.2rem 0.55rem;
        background: rgba(255, 255, 255, 0.07);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        color: #c0c8e0;
      }

      .pkg-install {
        background: #0f1117;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 6px;
        padding: 0.6rem 0.9rem;
      }

      .pkg-install code {
        font-size: 0.82rem;
        color: #a0f0b0;
        font-family: 'Fira Code', 'Cascadia Code', monospace;
      }

      .btn-docs {
        display: inline-block;
        color: #6b8cf2;
        font-size: 0.9rem;
        font-weight: 600;
        text-decoration: none;
        margin-top: auto;
      }

      .btn-docs:hover {
        color: #8da8f8;
        text-decoration: underline;
      }

      .btn-docs:focus-visible {
        outline: 2px solid #6b8cf2;
        outline-offset: 3px;
        border-radius: 2px;
      }

      .quick-start h2 {
        font-size: 1.3rem;
        font-weight: 700;
        color: #fff;
        margin: 0 0 0.5rem;
      }

      .quick-start p {
        color: #909ab8;
        margin: 0 0 1rem;
      }

      .code-snippet {
        background: #1e1e2e;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 8px;
        overflow: auto;
      }

      .code-snippet pre {
        margin: 0;
        padding: 1.2rem 1.4rem;
      }

      .code-snippet code {
        font-family: 'Fira Code', 'Cascadia Code', monospace;
        font-size: 0.875rem;
        color: #cdd6f4;
        line-height: 1.6;
      }

      @media (max-width: 600px) {
        h1 {
          font-size: 1.5rem;
        }
      }
    `,
  ],
})
export class DocsLandingComponent {}
