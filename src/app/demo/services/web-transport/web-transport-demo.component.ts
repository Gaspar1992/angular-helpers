import { Component, signal } from '@angular/core';
import { injectWebTransportResource } from '@angular-helpers/browser-web-apis';

@Component({
  selector: 'app-web-transport-demo',
  styleUrls: ['../demo.styles.css'],
  template: `
    <section class="svc-card" aria-labelledby="wt-title">
      <div class="svc-card-head">
        <h2 class="svc-card-title" id="wt-title">
          <span class="text-primary text-2xl">⚡</span> WebTransport Resource
        </h2>
        <div class="flex gap-2 flex-wrap">
          @if (wt.isSupported()) {
            <span class="badge badge-success font-black">supported</span>
          } @else {
            <span class="badge badge-error font-black">unsupported</span>
          }
          <span class="badge badge-outline font-black uppercase">{{ wt.status() }}</span>
        </div>
      </div>
      <p class="svc-desc">
        Modern low-latency HTTP/3 & QUIC multiplexed streams and datagrams via Angular Signal
        Resource (<code class="font-mono text-xs text-primary">rxResource</code>).
      </p>

      <div class="svc-controls mb-6 flex flex-wrap gap-3">
        <input
          type="text"
          class="input input-bordered flex-1 min-w-[220px]"
          [value]="inputUrl()"
          (input)="updateInput($event)"
          placeholder="https://echo.webtransport.day"
        />
        <button
          class="btn btn-primary font-black"
          (click)="connect()"
          [disabled]="!wt.isSupported() || wt.status() === 'connected' || !inputUrl()"
        >
          Connect
        </button>
        <button
          class="btn btn-danger font-black"
          (click)="disconnect()"
          [disabled]="wt.status() === 'closed'"
        >
          Disconnect
        </button>
        <button
          class="btn btn-accent font-black"
          (click)="sendTestDatagram()"
          [disabled]="!wt.isSupported() || wt.status() !== 'connected'"
        >
          Send Datagram 🚀
        </button>
      </div>

      <div class="space-y-4">
        @if (wt.status() === 'error') {
          <div
            class="p-4 rounded-2xl bg-error/10 border border-error/20 text-error text-xs font-mono"
          >
            ⚠️ Connection Error: Failed to establish QUIC session. (Make sure UDP port 443 is
            unblocked by firewall/network).
          </div>
        }

        <div class="p-4 rounded-2xl bg-base-content/5 border border-base-content/5">
          <span class="text-xs font-bold text-base-content/50 uppercase tracking-wider block mb-1">
            Latest Inbound Datagram Payload
          </span>
          @if (wt.datagram()) {
            <code class="text-sm font-mono text-accent break-all">
              {{ decodedDatagram() }}
            </code>
          } @else {
            <span class="text-xs italic text-base-content/30">
              {{
                wt.status() === 'connected'
                  ? 'Connected. Waiting for datagrams...'
                  : 'Not connected'
              }}
            </span>
          }
        </div>

        <p class="text-xs text-base-content/40 italic m-0">
          * WebTransport requires an active HTTP/3 + QUIC server (e.g.
          <code class="font-mono">https://echo.webtransport.day</code>).
        </p>
      </div>
    </section>
  `,
})
export class WebTransportDemoComponent {
  readonly inputUrl = signal<string>('https://echo.webtransport.day');
  readonly activeUrl = signal<string>('');

  readonly wt = injectWebTransportResource(this.activeUrl);

  updateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input) {
      this.inputUrl.set(input.value);
    }
  }

  connect(): void {
    if (!this.inputUrl()) return;
    this.activeUrl.set(this.inputUrl());
  }

  disconnect(): void {
    this.activeUrl.set('');
  }

  decodedDatagram(): string {
    const raw = this.wt.datagram();
    if (!raw) return '';
    try {
      return new TextDecoder().decode(raw);
    } catch {
      return `[Binary Data ${raw.byteLength} bytes]`;
    }
  }

  async sendTestDatagram(): Promise<void> {
    if (this.wt.status() !== 'connected') return;
    const message = `Ping from Angular: ${new Date().toLocaleTimeString()}`;
    const payload = new TextEncoder().encode(message);
    await this.wt.sendDatagram(payload);
  }
}
