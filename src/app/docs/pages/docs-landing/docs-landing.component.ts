import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-docs-landing',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="max-width-container py-12 sm:py-20 animate-in fade-in duration-700">
      <!-- Premium Hero Header -->
      <div class="mb-16">
        <h1
          class="text-[2.5rem] sm:text-[3.5rem] font-black text-base-content tracking-tighter leading-none m-0 mb-6"
        >
          Documentation
        </h1>
        <p class="text-lg sm:text-xl text-base-content/50 max-w-2xl font-medium leading-relaxed">
          Explore the libraries, utilities, and architectural patterns that make Angular Helpers the
          premier choice for modern, high-performance web applications.
        </p>
      </div>

      <!-- Grid of Packages -->
      <section
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 mt-16"
        aria-labelledby="packages-title"
      >
        <h2 id="packages-title" class="sr-only">Available Packages</h2>

        <!-- Browser APIs -->
        <a
          routerLink="/docs/browser-web-apis"
          class="bg-base-200 border border-base-content/5 rounded-3xl p-6 sm:p-10 flex flex-col gap-6 hover:border-primary/40 hover:shadow-2xl transition-all duration-300 group no-underline"
        >
          <div class="flex flex-col gap-4 items-start">
            <div
              class="p-4 bg-base-content/5 rounded-2xl border border-base-content/10 shadow-inner group-hover:scale-110 transition-transform"
            >
              <span class="text-4xl">🌐</span>
            </div>
            <div class="flex flex-wrap gap-2">
              <span class="badge badge-primary font-bold">42 services</span>
              <span class="badge font-bold">Signals</span>
            </div>
          </div>
          <div>
            <h3
              class="text-2xl font-black text-base-content m-0 mb-3 tracking-tight group-hover:text-primary transition-colors"
            >
              Browser Web APIs
            </h3>
            <p class="text-base text-base-content/50 leading-relaxed font-medium">
              Seamlessly integrate native browser capabilities like Geolocation, Notifications, and
              Storage into your Angular application with reactive, signal-based services.
            </p>
          </div>
          <div class="bg-base-content/5 border border-base-content/5 rounded-xl px-4 py-3 mt-auto">
            <code class="text-xs text-base-content/80 font-mono">
              pnpm add
              <span class="text-primary font-bold">&#64;angular-helpers/browser-web-apis</span>
            </code>
          </div>
        </a>

        <!-- Security -->
        <a
          routerLink="/docs/security"
          class="bg-base-200 border border-base-content/5 rounded-3xl p-6 sm:p-10 flex flex-col gap-6 hover:border-primary/40 hover:shadow-2xl transition-all duration-300 group no-underline"
        >
          <div class="flex flex-col gap-4 items-start">
            <div
              class="p-4 bg-base-content/5 rounded-2xl border border-base-content/10 shadow-inner group-hover:scale-110 transition-transform"
            >
              <span class="text-4xl">🛡️</span>
            </div>
            <div class="flex flex-wrap gap-2">
              <span class="badge badge-primary font-bold">ReDoS Prevention</span>
              <span class="badge font-bold">Crypto</span>
            </div>
          </div>
          <div>
            <h3
              class="text-2xl font-black text-base-content m-0 mb-3 tracking-tight group-hover:text-primary transition-colors"
            >
              Security Utilities
            </h3>
            <p class="text-base text-base-content/50 leading-relaxed font-medium">
              Hardened tools for cryptographic operations, secure password hashing, and input
              validation designed to prevent common web vulnerabilities.
            </p>
          </div>
          <div class="bg-base-content/5 border border-base-content/5 rounded-xl px-4 py-3 mt-auto">
            <code class="text-xs text-base-content/80 font-mono">
              pnpm add <span class="text-primary font-bold">&#64;angular-helpers/security</span>
            </code>
          </div>
        </a>

        <!-- Worker HTTP -->
        <a
          routerLink="/docs/worker-http"
          class="bg-base-200 border border-base-content/5 rounded-3xl p-6 sm:p-10 flex flex-col gap-6 hover:border-primary/40 hover:shadow-2xl transition-all duration-300 group no-underline"
        >
          <div class="flex flex-col gap-4 items-start">
            <div
              class="p-4 bg-base-content/5 rounded-2xl border border-base-content/10 shadow-inner group-hover:scale-110 transition-transform"
            >
              <span class="text-4xl">⚙️</span>
            </div>
            <div class="flex flex-wrap gap-2">
              <span class="badge badge-primary font-bold">Web Workers</span>
              <span class="badge font-bold">Performance</span>
            </div>
          </div>
          <div>
            <h3
              class="text-2xl font-black text-base-content m-0 mb-3 tracking-tight group-hover:text-primary transition-colors"
            >
              Worker HTTP
            </h3>
            <p class="text-base text-base-content/50 leading-relaxed font-medium">
              Offload your heavy API communication and data processing to Web Workers, keeping your
              UI thread responsive and smooth at 60fps.
            </p>
          </div>
          <div class="bg-base-content/5 border border-base-content/5 rounded-xl px-4 py-3 mt-auto">
            <code class="text-xs text-base-content/80 font-mono">
              pnpm add <span class="text-primary font-bold">&#64;angular-helpers/worker-http</span>
            </code>
          </div>
        </a>

        <!-- OpenLayers -->
        <a
          routerLink="/docs/openlayers"
          class="bg-base-200 border border-base-content/5 rounded-3xl p-6 sm:p-10 flex flex-col gap-6 hover:border-primary/40 hover:shadow-2xl transition-all duration-300 group no-underline"
        >
          <div class="flex flex-col gap-4 items-start">
            <div
              class="p-4 bg-base-content/5 rounded-2xl border border-base-content/10 shadow-inner group-hover:scale-110 transition-transform"
            >
              <span class="text-4xl">🗺️</span>
            </div>
            <div class="flex flex-wrap gap-2">
              <span class="badge badge-primary font-bold">GIS</span>
              <span class="badge font-bold">Maps</span>
            </div>
          </div>
          <div>
            <h3
              class="text-2xl font-black text-base-content m-0 mb-3 tracking-tight group-hover:text-primary transition-colors"
            >
              OpenLayers
            </h3>
            <p class="text-base text-base-content/50 leading-relaxed font-medium">
              Modern Angular wrapper for OpenLayers with modular architecture, standalone
              components, and reactive signal-based APIs.
            </p>
          </div>
          <div class="bg-base-content/5 border border-base-content/5 rounded-xl px-4 py-3 mt-auto">
            <code class="text-xs text-base-content/80 font-mono">
              pnpm add <span class="text-primary font-bold">&#64;angular-helpers/openlayers</span>
            </code>
          </div>
        </a>

        <!-- Storage & Persistence -->
        <a
          routerLink="/docs/storage"
          class="bg-base-200 border border-base-content/5 rounded-3xl p-6 sm:p-10 flex flex-col gap-6 hover:border-primary/40 hover:shadow-2xl transition-all duration-300 group no-underline"
        >
          <div class="flex flex-col gap-4 items-start">
            <div
              class="p-4 bg-base-content/5 rounded-2xl border border-base-content/10 shadow-inner group-hover:scale-110 transition-transform"
            >
              <span class="text-4xl">💾</span>
            </div>
            <div class="flex flex-wrap gap-2">
              <span class="badge badge-primary font-bold">Offline First</span>
              <span class="badge font-bold">AES-GCM</span>
            </div>
          </div>
          <div>
            <h3
              class="text-2xl font-black text-base-content m-0 mb-3 tracking-tight group-hover:text-primary transition-colors"
            >
              Storage & Persistence
            </h3>
            <p class="text-base text-base-content/50 leading-relaxed font-medium">
              High-performance, reactive L1 Signals backed by async L2 transports, client-side
              encryption, TOON compression, and surgically reactive Entity State management.
            </p>
          </div>
          <div class="bg-base-content/5 border border-base-content/5 rounded-xl px-4 py-3 mt-auto">
            <code class="text-xs text-base-content/80 font-mono">
              pnpm add <span class="text-primary font-bold">&#64;angular-helpers/storage</span>
            </code>
          </div>
        </a>
      </section>

      <!-- Advanced Integration Sample -->
      <section class="mt-32" aria-labelledby="integration-title">
        <div class="flex flex-col items-center text-center gap-6 mb-16">
          <h2
            id="integration-title"
            class="text-[2.5rem] sm:text-[3.5rem] font-black text-base-content tracking-tighter leading-tight m-0"
          >
            Modular by design.
          </h2>
          <p class="text-lg text-base-content/50 max-w-2xl font-medium leading-relaxed">
            Pick only what you need. Our library is designed to be treeshakeable and lean, ensuring
            your bundle stays small.
          </p>
        </div>

        <div
          class="bg-base-200 border border-base-content/5 rounded-[2rem] overflow-hidden shadow-2xl relative"
        >
          <div
            class="flex items-center px-6 py-4 border-b border-base-content/10 bg-base-content/5"
          >
            <div class="flex gap-2">
              <div class="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/30"></div>
              <div class="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/30"></div>
              <div class="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/30"></div>
            </div>
            <span class="text-xs font-mono text-base-content/30 ml-6">app.config.ts</span>
          </div>
          <pre
            class="m-0 p-10 overflow-x-auto"
          ><code class="font-mono text-sm leading-relaxed text-base-content/90">bootstrapApplication(AppComponent, &#123;
  providers: [
    provideBrowserWebApis(),
    provideWorkerHttp(&#123;
      worker: <span class="text-primary font-bold">new</span> Worker(<span class="text-green-400">'./app.worker'</span>, &#123; type: <span class="text-green-400">'module'</span> &#125;),
    &#125;),
  ],
&#125;);</code></pre>
        </div>
      </section>
    </div>
  `,
})
export class DocsLandingComponent {}
