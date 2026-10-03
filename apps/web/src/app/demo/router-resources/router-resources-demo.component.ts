import { Component, signal, resource } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface SimulatedItem {
  id: string;
  name: string;
  category: string;
  version: string;
  payloadSize: string;
  loadedAt: string;
}

@Component({
  selector: 'app-router-resources-demo',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <!-- Header -->
      <div class="text-center space-y-4">
        <div
          class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold border border-primary/20"
        >
          <span>⚡</span>
          <span>Angular v22.2 Architecture</span>
          <span class="badge badge-sm badge-primary">Router Resources</span>
        </div>
        <h1
          class="text-4xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent"
        >
          Signal-Driven Route Resources
        </h1>
        <p class="text-lg text-base-content/70 max-w-2xl mx-auto">
          Experience Angular 22.2 parallel, non-blocking data fetching. Eliminate resolver
          waterfalls, bind route data directly into component inputs, and reactively reload when
          params change without destroying route components.
        </p>
      </div>

      <!-- Comparison Banner -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="p-6 bg-base-200/50 border border-base-300 rounded-3xl space-y-3">
          <div class="flex items-center gap-2 text-warning font-bold">
            <span class="text-xl">⚠️</span>
            <h3>Traditional Resolvers (v2 - v21)</h3>
          </div>
          <ul class="text-sm space-y-2 text-base-content/70 list-disc list-inside">
            <li>Sequential waterfall execution blocks navigation until complete.</li>
            <li>
              Static snapshot data with no native signals (<code class="text-xs">isLoading</code>,
              <code class="text-xs">error</code>).
            </li>
            <li>
              Requires full route transition or
              <code class="text-xs">runGuardsAndResolvers</code> to re-run.
            </li>
            <li>Component can render only after the slowest resolver finishes.</li>
          </ul>
        </div>

        <div class="p-6 bg-primary/5 border border-primary/20 rounded-3xl space-y-3">
          <div class="flex items-center gap-2 text-primary font-bold">
            <span class="text-xl">🚀</span>
            <h3>Angular 22.2 Router Resources</h3>
          </div>
          <ul class="text-sm space-y-2 text-base-content/70 list-disc list-inside">
            <li>
              Parallel non-blocking execution via
              <code class="text-xs">withRouterResources()</code>.
            </li>
            <li>
              Full Signals reactivity with <code class="text-xs">.isLoading()</code>,
              <code class="text-xs">.status()</code>, and <code class="text-xs">.value()</code>.
            </li>
            <li>
              Auto-bound directly to component <code class="text-xs">input()</code> signals via
              outlet effects.
            </li>
            <li>
              In-place <code class="text-xs">.reload()</code> and param sensitivity without route
              unmount.
            </li>
          </ul>
        </div>
      </div>

      <!-- Interactive Sandbox -->
      <div
        class="card bg-base-200/60 border border-base-300 shadow-xl rounded-3xl p-6 sm:p-8 space-y-8"
      >
        <div
          class="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-base-300"
        >
          <div>
            <h2 class="text-2xl font-bold">Interactive Resource Simulator</h2>
            <p class="text-sm text-base-content/60">
              Simulate route parameter changes and inspect signal-driven reactivity.
            </p>
          </div>

          <button
            type="button"
            class="btn btn-sm btn-primary rounded-xl font-bold flex items-center gap-2"
            (click)="reloadResource()"
            [disabled]="demoResource.isLoading()"
          >
            <span>🔄</span>
            Reload Resource
          </button>
        </div>

        <!-- Controls Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div class="space-y-2">
            <label
              for="package-select"
              class="text-xs font-bold uppercase tracking-wider text-base-content/60"
              >Package (Route Param)</label
            >
            <select
              id="package-select"
              class="select select-bordered w-full rounded-2xl"
              [ngModel]="selectedPackage()"
              (ngModelChange)="selectedPackage.set($event)"
            >
              <option value="core">core (@angular-helpers/core)</option>
              <option value="browser-web-apis">browser-web-apis</option>
              <option value="security">security</option>
              <option value="storage">storage</option>
              <option value="worker-http">worker-http</option>
              <option value="yjs">yjs</option>
            </select>
          </div>

          <div class="space-y-2">
            <label
              for="version-select"
              class="text-xs font-bold uppercase tracking-wider text-base-content/60"
              >Version (Signal Dependency)</label
            >
            <select
              id="version-select"
              class="select select-bordered w-full rounded-2xl"
              [ngModel]="selectedVersion()"
              (ngModelChange)="selectedVersion.set($event)"
            >
              <option value="v22">v22 (Modern Signals & Resources)</option>
              <option value="v21">v21 (Legacy Fallback Mode)</option>
            </select>
          </div>

          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <label
                for="latency-range"
                class="text-xs font-bold uppercase tracking-wider text-base-content/60"
                >Simulated Latency</label
              >
              <span class="text-xs font-mono font-bold text-primary">{{ simulatedDelay() }}ms</span>
            </div>
            <input
              id="latency-range"
              type="range"
              min="100"
              max="1500"
              step="100"
              class="range range-primary range-sm"
              [ngModel]="simulatedDelay()"
              (ngModelChange)="simulatedDelay.set($event)"
            />
          </div>
        </div>

        <!-- Live Signals Display -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="p-4 bg-base-300/40 border border-base-300 rounded-2xl space-y-1">
            <span class="text-xs font-bold text-base-content/50 uppercase">resource.status()</span>
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full" [ngClass]="statusColor()"></span>
              <span class="font-mono font-bold text-lg">{{ demoResource.status() }}</span>
            </div>
          </div>

          <div class="p-4 bg-base-300/40 border border-base-300 rounded-2xl space-y-1">
            <span class="text-xs font-bold text-base-content/50 uppercase"
              >resource.isLoading()</span
            >
            <div class="flex items-center gap-2">
              <span
                *ngIf="demoResource.isLoading()"
                class="loading loading-spinner loading-sm text-primary"
              ></span>
              <span class="font-mono font-bold text-lg">{{ demoResource.isLoading() }}</span>
            </div>
          </div>

          <div class="p-4 bg-base-300/40 border border-base-300 rounded-2xl space-y-1">
            <span class="text-xs font-bold text-base-content/50 uppercase">Payload Items</span>
            <div class="font-mono font-bold text-lg text-primary">
              {{ demoResource.value() ? 1 : 0 }} loaded
            </div>
          </div>
        </div>

        <!-- Output Viewer -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-black uppercase tracking-wider text-base-content/50"
              >Simulated Route Component View</span
            >
            <span
              *ngIf="demoResource.isLoading()"
              class="text-xs text-primary font-bold animate-pulse"
              >Fetching in background...</span
            >
          </div>

          <div
            class="p-6 bg-base-300/30 border border-base-300 rounded-2xl min-h-[160px] flex items-center justify-center"
          >
            @if (demoResource.isLoading() && !demoResource.value()) {
              <div class="flex flex-col items-center gap-3">
                <span class="loading loading-dots loading-lg text-primary"></span>
                <span class="text-sm font-medium text-base-content/60"
                  >Resolving route resource in parallel...</span
                >
              </div>
            } @else if (demoResource.value(); as item) {
              <div class="w-full space-y-4">
                <div
                  class="flex flex-wrap items-center justify-between gap-2 border-b border-base-content/10 pb-3"
                >
                  <div class="flex items-center gap-3">
                    <span class="badge badge-lg badge-primary font-mono font-bold">{{
                      item.name
                    }}</span>
                    <span class="badge badge-outline">{{ item.category }}</span>
                  </div>
                  <span class="text-xs font-mono text-base-content/50"
                    >Loaded at: {{ item.loadedAt }}</span
                  >
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm font-mono">
                  <div>
                    <span class="text-xs text-base-content/40 block">Package ID</span>
                    <span class="font-bold">{{ item.id }}</span>
                  </div>
                  <div>
                    <span class="text-xs text-base-content/40 block">Target Version</span>
                    <span class="font-bold text-secondary">{{ item.version }}</span>
                  </div>
                  <div>
                    <span class="text-xs text-base-content/40 block">Estimated Size</span>
                    <span class="font-bold text-accent">{{ item.payloadSize }}</span>
                  </div>
                  <div>
                    <span class="text-xs text-base-content/40 block">SSR Hydration</span>
                    <span class="font-bold text-success">Zoneless Safe</span>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Code Snippet Reference -->
        <div class="space-y-3">
          <span class="text-xs font-black uppercase tracking-wider text-base-content/50"
            >Implementation in angular-helpers</span
          >
          <pre
            class="bg-base-300 p-4 rounded-2xl text-xs font-mono overflow-x-auto text-base-content/90"
          ><code>// app.config.ts
provideRouter(routes, withComponentInputBinding(), withRouterResources())

// docs.routes.ts
&#123;
  path: ':service',
  loadComponent: () => import('./detail.component'),
  resources: (ctx) => (&#123;
    config: serviceDetailResource(ctx, 'browser-web-apis')
  &#125;)
&#125;</code></pre>
        </div>
      </div>
    </div>
  `,
})
export class RouterResourcesDemoComponent {
  readonly selectedPackage = signal<string>('browser-web-apis');
  readonly selectedVersion = signal<'v21' | 'v22'>('v22');
  readonly simulatedDelay = signal<number>(300);

  readonly demoResource = resource<SimulatedItem, { pkg: string; ver: string; delay: number }>({
    params: () => ({
      pkg: this.selectedPackage(),
      ver: this.selectedVersion(),
      delay: this.simulatedDelay(),
    }),
    loader: async ({ params }) => {
      await new Promise((resolve) => setTimeout(resolve, params.delay));
      return {
        id: `@angular-helpers/${params.pkg}`,
        name: params.pkg.toUpperCase(),
        category: params.pkg === 'core' ? 'Foundation' : 'Feature Library',
        version: params.ver,
        payloadSize: params.pkg === 'core' ? '2.4 kB' : '14.8 kB',
        loadedAt: new Date().toLocaleTimeString(),
      };
    },
  });

  reloadResource() {
    this.demoResource.reload();
  }

  statusColor(): string {
    switch (this.demoResource.status()) {
      case 'resolved':
        return 'bg-success';
      case 'loading':
      case 'reloading':
        return 'bg-warning animate-pulse';
      case 'error':
        return 'bg-error';
      default:
        return 'bg-base-content/30';
    }
  }
}
