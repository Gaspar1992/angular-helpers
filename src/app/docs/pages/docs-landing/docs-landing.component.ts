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
            37 strongly typed Angular services for Camera, Geolocation, Storage, WebSocket, Bluetooth,
            Gamepad, NFC, and more — all with built-in browser support detection and reactive APIs.
          </p>
          <div class="pkg-meta">
            <span class="badge">37 services</span>
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
            ReDoS prevention via Web Worker-isolated regex execution. Includes a fluent builder API and
            complexity analysis for safe regular expression usage in Angular apps.
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
        padding-bottom: var(--sp-12);
      }

      .landing-hero {
        margin-bottom: var(--sp-10);
      }

      h1 {
        font-size: 1.5rem;
        font-weight: 800;
        color: var(--text-white);
        margin: 0 0 var(--sp-3);
        letter-spacing: -0.03em;
        line-height: 1.2;
      }

      @media (min-width: 640px) {
        h1 {
          font-size: 2rem;
        }
      }

      .lead {
        font-size: 0.95rem;
        color: var(--text-secondary);
        max-width: 600px;
        line-height: 1.7;
        margin: 0;
      }

      @media (min-width: 640px) {
        .lead {
          font-size: 1.05rem;
        }
      }

      .packages-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: var(--sp-4);
        margin-bottom: var(--sp-10);
      }

      @media (min-width: 580px) {
        .packages-grid {
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: var(--sp-6);
          margin-bottom: var(--sp-12);
        }
      }

      .package-card {
        background: var(--bg-surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-xl);
        padding: var(--sp-6);
        display: flex;
        flex-direction: column;
        gap: var(--sp-4);
        transition: border-color var(--transition);
      }

      .package-card:hover {
        border-color: var(--accent-border);
      }

      .pkg-header {
        display: flex;
        align-items: flex-start;
        gap: var(--sp-3);
      }

      .pkg-icon {
        font-size: 1.75rem;
        line-height: 1;
        margin-top: 0.1rem;
      }

      .pkg-header h2 {
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--text-white);
        margin: 0 0 var(--sp-1);
      }

      .npm-pkg {
        font-size: var(--text-xs);
        color: var(--accent);
        background: var(--accent-dim);
        padding: 0.15rem 0.4rem;
        border-radius: var(--radius-sm);
        font-family: var(--font-mono);
      }

      .package-card p {
        color: var(--text-secondary);
        font-size: 0.9rem;
        line-height: 1.65;
        margin: 0;
      }

      .pkg-meta {
        display: flex;
        flex-wrap: wrap;
        gap: var(--sp-2);
      }

      .badge {
        font-size: var(--text-xs);
        font-weight: 600;
        padding: 0.2rem 0.55rem;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        color: #c0c8e0;
      }

      .pkg-install {
        background: var(--bg-base);
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        padding: var(--sp-2) var(--sp-3);
      }

      .pkg-install code {
        font-size: var(--text-sm);
        color: var(--text-success);
        font-family: var(--font-mono);
      }

      .btn-docs {
        display: inline-flex;
        align-items: center;
        gap: var(--sp-1);
        color: var(--accent);
        font-size: 0.9rem;
        font-weight: 600;
        text-decoration: none;
        margin-top: auto;
        transition: color var(--transition);
      }

      .btn-docs:hover {
        color: #8da8f8;
      }

      .btn-docs:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 3px;
        border-radius: 2px;
      }

      .quick-start h2 {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--text-white);
        margin: 0 0 var(--sp-2);
      }

      .quick-start p {
        color: var(--text-secondary);
        margin: 0 0 var(--sp-4);
        font-size: 0.9rem;
      }

      .code-snippet {
        background: var(--bg-elevated);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        overflow: auto;
      }

      .code-snippet pre {
        margin: 0;
        padding: var(--sp-4) var(--sp-5);
      }

      @media (min-width: 640px) {
        .code-snippet pre {
          padding: var(--sp-5) var(--sp-6);
        }
      }

      .code-snippet code {
        font-family: var(--font-mono);
        font-size: var(--text-base);
        color: var(--text-code);
        line-height: 1.6;
      }
    `,
  ],
})
export class DocsLandingComponent {}
