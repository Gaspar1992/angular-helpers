import { Component, type OnDestroy, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  NetworkInformationService,
  injectNetworkInformation,
  type NetworkInformation,
} from '@angular-helpers/browser-web-apis';
import { CodeBlockComponent } from '../../../docs/shared/code-block/code-block.component';

@Component({
  selector: 'app-network-information-demo',
  providers: [NetworkInformationService],
  imports: [CodeBlockComponent],
  styleUrls: ['../demo.styles.css'],
  template: `
    <section class="svc-card" aria-labelledby="net-title">
      <div class="svc-card-head">
        <h2 class="svc-card-title" id="net-title">
          <span class="text-secondary text-2xl">📶</span> Network Information
        </h2>
        <div class="flex gap-2 flex-wrap">
          @if (supported) {
            <span class="badge badge-success font-black">supported</span>
          } @else {
            <span class="badge badge-warning font-black">partial</span>
          }
          <span class="badge badge-info font-black">{{ apiMode() }}</span>
        </div>
      </div>

      <p class="svc-desc">
        Live connection quality tracking. Detect bandwidth changes, effective connection types, and
        offline/online transitions.
      </p>

      <div class="svc-controls mb-8">
        <div class="segmented" role="group" aria-label="API mode">
          <button
            class="btn btn-sm font-black"
            [class.active]="apiMode() === 'Service'"
            (click)="setMode('Service')"
          >
            Service
          </button>
          <button
            class="btn btn-sm font-black"
            [class.active]="apiMode() === 'Signal Fn'"
            (click)="setMode('Signal Fn')"
          >
            Signal Fn
          </button>
        </div>
        <div
          class="flex items-center gap-2 px-4 py-2 rounded-xl bg-base-content/5 border border-base-content/5 shadow-inner"
        >
          <span class="text-[10px] font-black uppercase tracking-widest text-base-content/30"
            >Status</span
          >
          @if (apiMode() === 'Service' ? networkInfo().online : fnRef.online()) {
            <span class="badge badge-success font-black">ONLINE</span>
          } @else {
            <span class="badge badge-error font-black">OFFLINE</span>
          }
        </div>
      </div>

      <div class="svc-result">
        @if (apiMode() === 'Service') {
          <div class="kv-row">
            <span class="kv-key">Connection Type</span>
            <span class="kv-val text-primary">{{ networkInfo().type ?? 'N/A' }}</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">Effective Type</span>
            <span class="kv-val text-secondary">{{ networkInfo().effectiveType ?? 'N/A' }}</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">Downlink</span>
            <span class="kv-val text-accent">{{ networkInfo().downlink ?? 0 }} Mbps</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">RTT</span>
            <span class="kv-val text-info">{{ networkInfo().rtt ?? 0 }} ms</span>
          </div>
        } @else {
          <div class="kv-row">
            <span class="kv-key">type()</span>
            <span class="kv-val text-primary">{{ fnRef.type() ?? 'N/A' }}</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">effectiveType()</span>
            <span class="kv-val text-secondary">{{ fnRef.effectiveType() ?? 'N/A' }}</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">downlink()</span>
            <span class="kv-val text-accent">{{ fnRef.downlink() ?? 0 }} Mbps</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">rtt()</span>
            <span class="kv-val text-info">{{ fnRef.rtt() ?? 0 }} ms</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">saveData()</span>
            <span class="kv-val text-warning">{{ fnRef.saveData() ? 'YES' : 'NO' }}</span>
          </div>
        }
      </div>

      @if (apiMode() === 'Signal Fn') {
        <div class="mt-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-base-content/20 mb-3">
            Signal Composition Example
          </p>
          <app-code-block
            code="import { injectNetworkInformation } from '@angular-helpers/browser-web-apis';

readonly net = injectNetworkInformation();

// Access signals directly:
// net.online(), net.effectiveType(), net.downlink()"
          />
        </div>
      } @else {
        <div class="mt-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-base-content/20 mb-3">
            Manual RxJS Stream
          </p>
          <app-code-block
            code="import { NetworkInformationService } from '@angular-helpers/browser-web-apis';

readonly svc = inject(NetworkInformationService);

ngOnInit() {
  const current = this.svc.getSnapshot();
  this.svc.watch().subscribe(info => { ... });
}"
          />
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
