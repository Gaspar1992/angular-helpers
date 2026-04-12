import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-web-redesign-article',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="prose-angular">
      <p class="lead">
        We rebuilt the Angular Helpers website from scratch. Not because the old one was broken, but
        because it had grown in ways that made it hard to change — inconsistent folder structures,
        ad-hoc CSS that only the author understood, and a narrative that didn't actually explain why
        you'd want to use these libraries.
      </p>
      <p class="lead">This article explains what we changed, why, and the principles behind it.</p>

      <h2>The problem we were solving</h2>
      <p>
        Every Angular application we've worked on has the same pattern: early in the project someone
        writes a <code>GeolocationService</code>. Then someone else writes a
        <code>ClipboardService</code>. Then a <code>WebSocketService</code>. Each one is slightly
        different, each one has slightly different lifecycle handling, and none of them have been tested
        in a real browser.
      </p>
      <p>
        The browser platform has gotten incredibly capable. Web APIs that used to require native apps —
        camera access, Bluetooth, NFC, payments, file system access — are now available from JavaScript.
        But nobody ships a well-typed, lifecycle-aware Angular service for them. You write your own,
        every time.
      </p>
      <p>
        That's the gap <strong>@angular-helpers</strong> fills. We solved it once, properly, and made it
        tree-shakable so you only pay for what you use.
      </p>

      <h2>What each package stands for</h2>

      <h3>browser-web-apis — Lightweight. Standard.</h3>
      <p>
        37 typed Angular services. One provider function. Every service respects permissions, handles
        secure-context requirements, cleans up with <code>DestroyRef</code>, and exposes its state as
        Angular signals. If a browser API exists and is worth wrapping, it's in here.
      </p>
      <p>
        The promise is <strong>lightweight and standard</strong>: we follow the Web API spec closely,
        add no unnecessary abstraction, and keep the bundle impact minimal.
      </p>

      <h3>security — Robust. Safe.</h3>
      <p>
        ReDoS is a real vulnerability. A catastrophically backtracking regex can lock your main thread
        for seconds. <code>@angular-helpers/security</code> runs regex evaluation in a Web Worker with a
        configurable timeout — the main thread is never blocked.
      </p>
      <p>
        Beyond regex, the package includes WebCrypto utilities (AES-GCM, HMAC), encrypted
        localStorage/sessionStorage, XSS-safe input sanitization, and entropy-based password strength
        scoring.
      </p>

      <h3>worker-http — Performance. Off-main-thread.</h3>
      <p>
        HTTP requests block the main thread. Not a lot, but measurably.
        <code>@angular-helpers/worker-http</code>
        moves your HTTP calls into a Web Worker with a typed RPC bridge. You call the same familiar API,
        the work happens off-thread, and your UI stays responsive.
      </p>
      <p>It ships with 7 built-in interceptors: retry, cache, HMAC signing, rate limiting, and more.</p>

      <h2>Technical decisions in this rebuild</h2>

      <h3>Tailwind v4 + DaisyUI v5</h3>
      <p>
        We dropped all ad-hoc CSS and moved to Tailwind v4 (CSS-first, no config file) with DaisyUI v5
        for component primitives. The existing dark color palette was mapped to a custom DaisyUI theme
        named <code>angular-helpers</code>, so the visual identity is preserved but now backed by a
        proper design system.
      </p>
      <p>
        Mobile-first throughout. The old site had several desktop-first overrides that made narrow
        viewports feel like an afterthought.
      </p>

      <h3>Canonical section structure</h3>
      <p>
        Every top-level section of the app (<code>home/</code>, <code>demo/</code>, <code>docs/</code>,
        <code>blog/</code>) now follows the same internal convention:
      </p>
      <pre><code>section/
    ├── section.component.ts   ← entry page
    ├── section.routes.ts      ← self-contained routing
    ├── ui/                    ← presentational components
    ├── feature/               ← smart components
    ├── config/                ← constants &amp; data
    ├── models/                ← TypeScript interfaces
    ├── store/                 ← signals (if needed)
    └── services/              ← section-scoped DI</code></pre>
      <p>
        The goal is that each section is a black box. You import the entry component, it adds its own
        routing. No leaking internals.
      </p>

      <h3>shared/ vs core/ separation</h3>
      <p>
        <code>shared/</code> is now strictly a deduplication boundary: components and pipes used in two
        or more sections live here. Single-section code lives inside the section.
      </p>
      <p>
        <code>core/</code> is new: global systems that affect the entire app — i18n translations,
        navigation data, app-wide constants. Not UI components.
      </p>

      <h3>i18n from day one</h3>
      <p>
        The site is English-first, but all UI copy is sourced from
        <code>core/i18n/en.ts</code>. Adding a second language means adding a new file and wiring it
        into the signal-based <code>I18nService</code>. No template strings need to change.
      </p>

      <h3>Web-level testing</h3>
      <p>
        We added Playwright tests that verify each section of the site: headings are visible, CTAs work,
        there are no Angular DI errors on load, and there are no AXE critical/serious accessibility
        violations. The library's own integration tests were already using Playwright — we extended the
        same setup for the documentation site.
      </p>

      <h2>What comes next</h2>
      <p>
        The docs section will get the same Tailwind treatment in the next phase. Then we'll add bundle
        size tracking — we want to make the "lightweight" claim verifiable with real numbers.
      </p>
      <p>
        And we'll keep shipping browser API services. If there's a Web API you're wrapping by hand in
        every Angular project, open an issue.
      </p>
    </div>
  `,
  styles: [
    `
      .prose-angular {
        color: oklch(88% 0.02 256 / 0.8);
        line-height: 1.8;
        font-size: 1rem;
      }
      .prose-angular .lead {
        font-size: 1.1rem;
        color: oklch(88% 0.02 256 / 0.7);
        margin-bottom: 1.5rem;
      }
      .prose-angular h2 {
        font-size: 1.4rem;
        font-weight: 800;
        color: oklch(88% 0.02 256);
        margin: 2.5rem 0 0.75rem;
        letter-spacing: -0.02em;
      }
      .prose-angular h3 {
        font-size: 1.05rem;
        font-weight: 700;
        color: oklch(69% 0.18 254);
        margin: 1.75rem 0 0.5rem;
      }
      .prose-angular p {
        margin: 0 0 1.25rem;
      }
      .prose-angular code {
        font-family: 'Fira Code', 'Cascadia Code', monospace;
        font-size: 0.85em;
        color: oklch(69% 0.18 254);
        background: oklch(69% 0.18 254 / 0.1);
        padding: 0.1em 0.35em;
        border-radius: 4px;
      }
      .prose-angular pre {
        background: oklch(17% 0.03 256);
        border: 1px solid oklch(17% 0.03 256 / 0.5);
        border-radius: 10px;
        padding: 1.25rem 1.5rem;
        overflow-x: auto;
        margin: 1.5rem 0;
      }
      .prose-angular pre code {
        background: none;
        padding: 0;
        color: oklch(88% 0.02 256 / 0.7);
        font-size: 0.82rem;
        line-height: 1.65;
      }
      .prose-angular strong {
        color: oklch(88% 0.02 256);
        font-weight: 700;
      }
    `,
  ],
})
export class WebRedesignArticleComponent {}
