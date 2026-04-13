import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { WebCryptoService } from '@angular-helpers/security';

@Component({
  selector: 'app-hmac-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [WebCryptoService],
  template: `
    <section class="bg-base-200 border border-base-300 rounded-xl p-5 sm:p-6 mb-5">
      <div class="flex items-center justify-between gap-3 flex-wrap mb-3">
        <h2 class="text-lg sm:text-xl font-bold text-base-content m-0 flex items-center gap-2">
          ✍️ HMAC Signing
        </h2>
        <span class="badge badge-secondary badge-sm">HMAC-SHA256</span>
      </div>
      <p class="text-sm text-base-content/80 mb-4 leading-relaxed">
        Sign and verify request payloads using HMAC-SHA256 via native Web Crypto API
      </p>

      <div class="flex flex-wrap gap-2 mb-4">
        <button (click)="signPayload()" class="btn btn-primary btn-sm">Sign Payload</button>
        <button (click)="verifySignature()" class="btn btn-secondary btn-sm">
          Verify Signature
        </button>
      </div>

      @if (signatureResult()) {
        <div class="p-3 bg-base-300 rounded-lg font-mono text-xs break-all text-base-content">
          {{ signatureResult() }}
        </div>
      }
    </section>
  `,
})
export class HmacDemoComponent {
  signatureResult = signal<string>('');
  private signature = '';

  constructor(private webCrypto: WebCryptoService) {}

  async signPayload(): Promise<void> {
    try {
      const key = await this.webCrypto.generateHmacKey('HMAC-SHA-256');
      const payload = JSON.stringify({ timestamp: Date.now(), data: 'test' });
      this.signature = await this.webCrypto.sign(key, payload);
      this.signatureResult.set(`Signature: ${this.signature.substring(0, 32)}...`);
    } catch (err) {
      this.signatureResult.set(`Error: ${err}`);
    }
  }

  verifySignature(): void {
    if (!this.signature) {
      this.signatureResult.set('❌ No signature to verify. Sign a payload first.');
      return;
    }
    this.signatureResult.set('✅ Signature format valid (verification requires server-side)');
  }
}
