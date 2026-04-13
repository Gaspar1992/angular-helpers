import { Component, OnDestroy, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  NetworkInformationService,
  injectNetworkInformation,
  type NetworkInformation,
} from '@angular-helpers/browser-web-apis';

@Component({
  selector: 'app-network-information-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [NetworkInformationService],
  template: `
    <section
      class="bg-base-200 border border-base-300 rounded-xl p-5 sm:p-6 mb-5"
      aria-labelledby="net-title"
    >
      <div class="flex items-center justify-between gap-3 flex-wrap mb-3">
        <h2 class="text-lg sm:text-xl font-bold text-base-content m-0" id="net-title">
          Network Information
        </h2>
        <div class="flex gap-2 flex-wrap">
          @if (supported) {
            <span class="badge badge-success badge-sm">supported</span>
          } @else {
            <span class="badge badge-warning badge-sm">partial</span>
          }
          <span class="badge badge-info badge-sm">{{ apiMode() }}</span>
        </div>
      </div>

      <p class="text-sm text-base-content/80 mb-4 leading-relaxed">
        Live connection quality. Turn off Wi-Fi to see the online flag update.
      </p>

      <div class="flex flex-wrap gap-2 items-center mb-4">
        <div class="join" role="group" aria-label="API mode">
          <button
            class="btn btn-sm join-item"
            [class.btn-active]="apiMode() === 'Service'"
            (click)="setMode('Service')"
          >
            Service (RxJS)
          </button>
          <button
            class="btn btn-sm join-item"
            [class.btn-active]="apiMode() === 'Signal Fn'"
            (click)="setMode('Signal Fn')"
          >
            Signal Fn
          </button>
        </div>
        <span class="badge badge-success badge-sm">
          online:
          {{ apiMode() === 'Service' ? networkInfo().online : fnRef.online() ? 'yes' : 'no' }}
        </span>
      </div>

      <div class="bg-base-300 border border-base-300 rounded-lg p-4">
        @if (apiMode() === 'Service') {
          @if (networkInfo().type) {
            <div
              class="flex items-center justify-between py-2 border-b border-base-300 last:border-b-0"
            >
              <span class="text-sm text-base-content/80 font-medium">Type</span>
              <span class="text-sm text-base-content font-semibold font-mono">{{
                networkInfo().type
              }}</span>
            </div>
          }
          @if (networkInfo().effectiveType) {
            <div
              class="flex items-center justify-between py-2 border-b border-base-300 last:border-b-0"
            >
              <span class="text-sm text-base-content/80 font-medium">Effective</span>
              <span class="text-sm text-base-content font-semibold font-mono">{{
                networkInfo().effectiveType
              }}</span>
            </div>
          }
          @if (networkInfo().downlink !== undefined) {
            <div
              class="flex items-center justify-between py-2 border-b border-base-300 last:border-b-0"
            >
              <span class="text-sm text-base-content/80 font-medium">Downlink</span>
              <span class="text-sm text-base-content font-semibold font-mono"
                >{{ networkInfo().downlink }} Mbps</span
              >
            </div>
          }
          @if (networkInfo().rtt !== undefined) {
            <div
              class="flex items-center justify-between py-2 border-b border-base-300 last:border-b-0"
            >
              <span class="text-sm text-base-content/80 font-medium">RTT</span>
              <span class="text-sm text-base-content font-semibold font-mono"
                >{{ networkInfo().rtt }} ms</span
              >
            </div>
          }
          @if (!networkInfo().type && !networkInfo().effectiveType) {
            <p class="text-xs text-base-content/80 italic">
              Connection details not available in this browser.
            </p>
          }
        } @else {
          @if (fnRef.type()) {
            <div
              class="flex items-center justify-between py-2 border-b border-base-300 last:border-b-0"
            >
              <span class="text-sm text-base-content/80 font-medium">type</span>
              <span class="text-sm text-base-content font-semibold font-mono">{{
                fnRef.type()
              }}</span>
            </div>
          }
          @if (fnRef.effectiveType()) {
            <div
              class="flex items-center justify-between py-2 border-b border-base-300 last:border-b-0"
            >
              <span class="text-sm text-base-content/80 font-medium">effectiveType</span>
              <span class="text-sm text-base-content font-semibold font-mono">{{
                fnRef.effectiveType()
              }}</span>
            </div>
          }
          @if (fnRef.downlink() !== undefined) {
            <div
              class="flex items-center justify-between py-2 border-b border-base-300 last:border-b-0"
            >
              <span class="text-sm text-base-content/80 font-medium">downlink</span>
              <span class="text-sm text-base-content font-semibold font-mono"
                >{{ fnRef.downlink() }} Mbps</span
              >
            </div>
          }
          @if (fnRef.rtt() !== undefined) {
            <div
              class="flex items-center justify-between py-2 border-b border-base-300 last:border-b-0"
            >
              <span class="text-sm text-base-content/80 font-medium">rtt</span>
              <span class="text-sm text-base-content font-semibold font-mono"
                >{{ fnRef.rtt() }} ms</span
              >
            </div>
          }
          @if (fnRef.saveData() !== undefined) {
            <div
              class="flex items-center justify-between py-2 border-b border-base-300 last:border-b-0"
            >
              <span class="text-sm text-base-content/80 font-medium">saveData</span>
              <span class="text-sm text-base-content font-semibold font-mono">{{
                fnRef.saveData() ? 'yes' : 'no'
              }}</span>
            </div>
          }
          @if (!fnRef.type() && !fnRef.effectiveType()) {
            <p class="text-xs text-base-content/80 italic">
              Connection details not available in this browser.
            </p>
          }
        }
      </div>

      @if (apiMode() === 'Signal Fn') {
        <div class="mt-4">
          <p class="text-xs text-base-content/80 mb-2">
            Reactive connection state with computed signals:
          </p>
          <pre
            class="bg-base-300 border border-base-300 rounded-lg p-3 overflow-x-auto font-mono text-sm text-base-content"
          ><code>import {{ '{' }} injectNetworkInformation {{ '}' }} from '{{'@angular-helpers/browser-web-apis'}}';

    readonly net = injectNetworkInformation();

    // Access signals directly:
    // net.online(), net.effectiveType(), net.downlink()
    // net.rtt(), net.saveData(), net.type()</code></pre>
          <p class="text-xs text-base-content/80 mt-2">
            <strong>When to use:</strong> Adaptive UI, conditional asset loading, offline handling.
          </p>
        </div>
      } @else {
        <div class="mt-4">
          <p class="text-xs text-base-content/80 mb-2">Manual stream with snapshot + watch:</p>
          <pre
            class="bg-base-300 border border-base-300 rounded-lg p-3 overflow-x-auto font-mono text-sm text-base-content"
          ><code>import {{ '{' }} NetworkInformationService {{ '}' }} from '{{'@angular-helpers/browser-web-apis'}}';

    readonly svc = inject(NetworkInformationService);

    ngOnInit() {{ '{' }}
      // Get current state
      const current = this.svc.getSnapshot();
      // Subscribe to changes
      this.svc.watch().subscribe(info =&gt; {{ '{' }}
        // handle network change
      {{ '}' }});
    {{ '}' }}</code></pre>
          <p class="text-xs text-base-content/80 mt-2">
            <strong>When to use:</strong> Complex stream operations, buffering, combining with other
            sources.
          </p>
        </div>
      }
    </section>
  `,
})
export class NetworkInformationDemoComponent implements OnDestroy {
  private readonly svc = inject(NetworkInformationService);
  private readonly subs: Subscription[] = [];

  readonly supported = this.svc.isSupported();
  readonly apiMode = signal<'Service' | 'Signal Fn'>('Service');
  readonly networkInfo = signal<NetworkInformation>({
    online: typeof navigator !== 'undefined' ? navigator.onLine : true,
  });
  readonly fnRef = injectNetworkInformation();

  constructor() {
    if (typeof navigator !== 'undefined') {
      this.networkInfo.set(this.svc.getSnapshot());
    }
    if (this.supported) {
      this.subs.push(this.svc.watch().subscribe((n) => this.networkInfo.set(n)));
    }
  }

  setMode(mode: 'Service' | 'Signal Fn'): void {
    this.apiMode.set(mode);
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }
}
