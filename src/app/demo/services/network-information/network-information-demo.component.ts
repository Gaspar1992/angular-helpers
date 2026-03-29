import {
  Component,
  OnDestroy,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
import { Subscription } from 'rxjs';
import {
  NetworkInformationService,
  injectNetworkInformation,
  type NetworkInformationRef,
  type NetworkInformation,
} from '@angular-helpers/browser-web-apis';

@Component({
  selector: 'app-network-information-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [NetworkInformationService],
  styleUrl: '../demo.styles.css',
  template: `
    <section class="svc-card" aria-labelledby="net-title">
      <div class="svc-card-head">
        <h2 class="svc-card-title" id="net-title">Network Information</h2>
        <div class="svc-badges">
          @if (supported) {
            <span class="badge badge-ok">supported</span>
          } @else {
            <span class="badge badge-warn">partial</span>
          }
          <span class="badge badge-info">{{ apiMode() }}</span>
        </div>
      </div>

      <p class="svc-desc">Live connection quality. Turn off Wi-Fi to see the online flag update.</p>

      <div class="svc-controls">
        <div class="segmented" role="group" aria-label="API mode">
          <button class="btn" [class.active]="apiMode() === 'Service'" (click)="setMode('Service')">
            Service (RxJS)
          </button>
          <button class="btn" [class.active]="apiMode() === 'Signal Fn'" (click)="setMode('Signal Fn')">
            Signal Fn
          </button>
        </div>
        <span class="badge badge-ok"
          >online:
          {{ apiMode() === 'Service' ? networkInfo().online : fnRef.online() ? 'yes' : 'no' }}</span
        >
      </div>

      <div class="svc-result">
        @if (apiMode() === 'Service') {
          @if (networkInfo().type) {
            <div class="kv-row">
              <span class="kv-key">Type</span>
              <span class="kv-val mono">{{ networkInfo().type }}</span>
            </div>
          }
          @if (networkInfo().effectiveType) {
            <div class="kv-row">
              <span class="kv-key">Effective</span>
              <span class="kv-val mono">{{ networkInfo().effectiveType }}</span>
            </div>
          }
          @if (networkInfo().downlink !== undefined) {
            <div class="kv-row">
              <span class="kv-key">Downlink</span>
              <span class="kv-val mono">{{ networkInfo().downlink }} Mbps</span>
            </div>
          }
          @if (networkInfo().rtt !== undefined) {
            <div class="kv-row">
              <span class="kv-key">RTT</span>
              <span class="kv-val mono">{{ networkInfo().rtt }} ms</span>
            </div>
          }
          @if (!networkInfo().type && !networkInfo().effectiveType) {
            <p class="svc-hint">Connection details not available in this browser.</p>
          }
        } @else {
          @if (fnRef.type()) {
            <div class="kv-row">
              <span class="kv-key">type</span>
              <span class="kv-val mono">{{ fnRef.type() }}</span>
            </div>
          }
          @if (fnRef.effectiveType()) {
            <div class="kv-row">
              <span class="kv-key">effectiveType</span>
              <span class="kv-val mono">{{ fnRef.effectiveType() }}</span>
            </div>
          }
          @if (fnRef.downlink() !== undefined) {
            <div class="kv-row">
              <span class="kv-key">downlink</span>
              <span class="kv-val mono">{{ fnRef.downlink() }} Mbps</span>
            </div>
          }
          @if (fnRef.rtt() !== undefined) {
            <div class="kv-row">
              <span class="kv-key">rtt</span>
              <span class="kv-val mono">{{ fnRef.rtt() }} ms</span>
            </div>
          }
          @if (fnRef.saveData() !== undefined) {
            <div class="kv-row">
              <span class="kv-key">saveData</span>
              <span class="kv-val mono">{{ fnRef.saveData() ? 'yes' : 'no' }}</span>
            </div>
          }
          @if (!fnRef.type() && !fnRef.effectiveType()) {
            <p class="svc-hint">Connection details not available in this browser.</p>
          }
        }
      </div>
    </section>
  `,
})
export class NetworkInformationDemoComponent implements OnDestroy {
  private readonly svc = inject(NetworkInformationService);
  private readonly subs: Subscription[] = [];
  readonly fnRef: NetworkInformationRef;

  readonly supported = this.svc.isSupported();
  readonly apiMode = signal<'Service' | 'Signal Fn'>('Service');
  readonly networkInfo = signal<NetworkInformation>({
    online: typeof navigator !== 'undefined' ? navigator.onLine : true,
  });

  constructor() {
    this.fnRef = injectNetworkInformation();

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
