import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-docs-landing',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="pb-12">
      <!-- Hero -->
      <div class="mb-10">
        <h1
          class="text-2xl sm:text-3xl font-extrabold text-base-content mb-3 tracking-tight leading-tight"
        >
          Angular Helpers — Documentation
        </h1>
        <p class="text-sm sm:text-base text-base-content/70 max-w-xl leading-relaxed">
          A collection of Angular libraries providing secure, reactive access to Browser APIs and
          security utilities.
        </p>
      </div>

      <!-- Package Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-10">
        <!-- Browser Web APIs -->
        <div
          class="bg-base-200 border border-base-300 rounded-xl p-6 flex flex-col gap-4 hover:border-primary/40 transition-colors"
        >
          <div class="flex items-start gap-3">
            <span class="text-3xl leading-none mt-0.5">🌐</span>
            <div>
              <h2 class="text-lg font-bold text-base-content mb-1">browser-web-apis</h2>
              <code class="text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded font-mono">
                &#64;angular-helpers/browser-web-apis
              </code>
            </div>
          </div>
          <p class="text-sm text-base-content/70 leading-relaxed">
            37 strongly typed Angular services for Camera, Geolocation, Storage, WebSocket,
            Bluetooth, Gamepad, NFC, and more — all with built-in browser support detection and
            reactive APIs.
          </p>
          <div class="flex flex-wrap gap-2">
            <span class="badge badge-sm badge-ghost">37 services</span>
            <span class="badge badge-sm badge-ghost">Signals</span>
            <span class="badge badge-sm badge-ghost">OnPush</span>
          </div>
          <div class="bg-base-300 border border-base-300 rounded-lg px-3 py-2">
            <code class="text-xs text-success font-mono">
              npm install &#64;angular-helpers/browser-web-apis
            </code>
          </div>
          <a
            routerLink="/docs/browser-web-apis"
            class="text-primary font-semibold text-sm hover:underline mt-auto inline-flex items-center gap-1"
          >
            View documentation →
          </a>
        </div>

        <!-- Security -->
        <div
          class="bg-base-200 border border-base-300 rounded-xl p-6 flex flex-col gap-4 hover:border-primary/40 transition-colors"
        >
          <div class="flex items-start gap-3">
            <span class="text-3xl leading-none mt-0.5">🛡️</span>
            <div>
              <h2 class="text-lg font-bold text-base-content mb-1">security</h2>
              <code class="text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded font-mono">
                &#64;angular-helpers/security
              </code>
            </div>
          </div>
          <p class="text-sm text-base-content/70 leading-relaxed">
            ReDoS prevention via Web Worker-isolated regex execution. Includes a fluent builder API
            and complexity analysis for safe regular expression usage in Angular apps.
          </p>
          <div class="flex flex-wrap gap-2">
            <span class="badge badge-sm badge-ghost">ReDoS Prevention</span>
            <span class="badge badge-sm badge-ghost">Web Workers</span>
            <span class="badge badge-sm badge-ghost">Builder Pattern</span>
          </div>
          <div class="bg-base-300 border border-base-300 rounded-lg px-3 py-2">
            <code class="text-xs text-success font-mono">
              npm install &#64;angular-helpers/security
            </code>
          </div>
          <a
            routerLink="/docs/security"
            class="text-primary font-semibold text-sm hover:underline mt-auto inline-flex items-center gap-1"
          >
            View documentation →
          </a>
        </div>
      </div>

      <!-- Quick Start -->
      <section>
        <h2 class="text-xl font-bold text-base-content mb-2">Quick setup</h2>
        <p class="text-sm text-base-content/70 mb-4">Register all providers at bootstrap:</p>
        <div class="bg-base-200 border border-base-300 rounded-xl overflow-auto">
          <pre
            class="p-4 sm:p-6 text-xs sm:text-sm font-mono text-base-content leading-relaxed"
          ><code>import &#123; provideBrowserWebApis &#125; from '&#64;angular-helpers/browser-web-apis';
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
})
export class DocsLandingComponent {}
