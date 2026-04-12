import { Component, ChangeDetectionStrategy, ViewEncapsulation, signal } from '@angular/core';
import { WebCryptoService } from '@angular-helpers/security';

@Component({
  selector: 'app-web-crypto-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [WebCryptoService],
  template: `
    <section class="bg-base-200 border border-base-300 rounded-xl p-5 sm:p-6 mb-5">
      <div class="flex items-center justify-between gap-3 flex-wrap mb-3">
        <h2 class="text-lg sm:text-xl font-bold text-base-content m-0 flex items-center gap-2">
          🔐 WebCryptoService
        </h2>
        <span class="badge badge-secondary badge-sm">Native Crypto</span>
      </div>
      <p class="text-sm text-base-content/80 mb-4 leading-relaxed">
        Hashing, HMAC, and AES encryption using native Web Crypto API
      </p>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div class="bg-base-300 border border-base-300 rounded-lg p-4">
          <div class="flex items-center gap-2 mb-3">
            <h3 class="font-semibold text-base-content m-0">SHA-256 Hash</h3>
            <span class="badge badge-success badge-xs">Crypto</span>
          </div>
          <p class="text-xs text-base-content/80 mb-3">Generate cryptographic hash</p>
          <button (click)="hashData()" class="btn btn-primary btn-sm">Generate Hash</button>
          @if (hashResult()) {
            <div class="mt-3 p-2 bg-base-200 rounded font-mono text-xs break-all text-base-content">
              {{ hashResult() }}
            </div>
          }
        </div>

        <div class="bg-base-300 border border-base-300 rounded-lg p-4">
          <div class="flex items-center gap-2 mb-3">
            <h3 class="font-semibold text-base-content m-0">HMAC Signature</h3>
            <span class="badge badge-success badge-xs">Crypto</span>
          </div>
          <p class="text-xs text-base-content/80 mb-3">Sign data with HMAC</p>
          <button (click)="generateHmac()" class="btn btn-secondary btn-sm">Sign Data</button>
          @if (hmacSignature()) {
            <div class="mt-3 p-2 bg-base-200 rounded font-mono text-xs break-all text-base-content">
              {{ hmacSignature() }}
            </div>
          }
        </div>
      </div>
    </section>
  `,
})
export class WebCryptoDemoComponent {
  hashResult = signal<string>('');
  hmacSignature = signal<string>('');

  constructor(private webCrypto: WebCryptoService) {}

  async hashData(): Promise<void> {
    try {
      const data = 'data-to-hash-' + Date.now();
      const hash = await this.webCrypto.hash(data, 'SHA-256');
      this.hashResult.set(hash.substring(0, 32) + '...');
    } catch (err) {
      this.hashResult.set(`Error: ${err}`);
    }
  }

  async generateHmac(): Promise<void> {
    try {
      const key = await this.webCrypto.generateHmacKey('HMAC-SHA-256');
      const data = 'message-to-sign-' + Date.now();
      const signature = await this.webCrypto.sign(key, data);
      this.hmacSignature.set(signature.substring(0, 32) + '...');
    } catch (err) {
      this.hmacSignature.set(`Error: ${err}`);
    }
  }
}
