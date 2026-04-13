import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { WebCryptoService } from '@angular-helpers/security';

@Component({
  selector: 'app-web-crypto-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [WebCryptoService],
  template: `
    <section
      class="bg-base-200 border border-base-300 rounded-xl p-5 sm:p-6 mb-5"
      aria-labelledby="crypto-title"
    >
      <div class="flex items-center justify-between gap-3 flex-wrap mb-3">
        <h2 class="text-lg sm:text-xl font-bold text-base-content m-0" id="crypto-title">
          WebCrypto Service
        </h2>
        <div class="flex gap-2 flex-wrap">
          <span class="badge badge-success badge-sm">aes-gcm</span>
          <span class="badge badge-info badge-sm">sha-256</span>
        </div>
      </div>
      <p class="text-sm text-base-content/70 mb-4 leading-relaxed">
        Cryptographic operations using the Web Crypto API: hashing, encryption, HMAC signing.
      </p>

      <div class="flex flex-wrap gap-2 mb-4">
        <button class="btn btn-primary btn-sm" (click)="hashData()">Hash (SHA-256)</button>
        <button class="btn btn-secondary btn-sm" (click)="encryptAes()">Encrypt AES</button>
        <button class="btn btn-secondary btn-sm" (click)="generateHmac()">Generate HMAC</button>
      </div>

      @if (hashResult()) {
        <div class="bg-base-300 border border-base-300 rounded-lg p-3 mt-3">
          <div class="flex items-center justify-between gap-3 py-2">
            <span class="text-sm text-base-content/60 font-medium">SHA-256 Hash</span>
            <span class="text-sm text-base-content font-semibold font-mono">{{
              hashResult()
            }}</span>
          </div>
        </div>
      }

      @if (encryptedData()) {
        <div class="bg-base-300 border border-base-300 rounded-lg p-3 mt-3">
          <div class="flex items-center justify-between gap-3 py-2">
            <span class="text-sm text-base-content/60 font-medium">Encrypted (AES-GCM)</span>
            <span class="text-sm text-base-content font-semibold font-mono">{{
              encryptedData()
            }}</span>
          </div>
        </div>
      }

      @if (hmacSignature()) {
        <div class="bg-base-300 border border-base-300 rounded-lg p-3 mt-3">
          <div class="flex items-center justify-between gap-3 py-2">
            <span class="text-sm text-base-content/60 font-medium">HMAC Signature</span>
            <span class="text-sm text-base-content font-semibold font-mono">{{
              hmacSignature()
            }}</span>
          </div>
        </div>
      }
    </section>
  `,
})
export class WebCryptoDemoComponent {
  private readonly webCrypto = inject(WebCryptoService);

  readonly hashResult = signal<string>('');
  readonly hmacSignature = signal<string>('');
  readonly encryptedData = signal<string>('');

  async hashData(): Promise<void> {
    try {
      const data = 'data-to-hash-' + Date.now();
      const hash = await this.webCrypto.hash(data, 'SHA-256');
      this.hashResult.set(hash.substring(0, 32) + '...');
    } catch (err) {
      this.hashResult.set(`Error: ${err}`);
    }
  }

  async encryptAes(): Promise<void> {
    try {
      const key = await this.webCrypto.generateAesKey(256);
      const data = 'Sensitive data to encrypt';
      const { ciphertext } = await this.webCrypto.encryptAes(key, data);
      const hex = Array.from(new Uint8Array(ciphertext))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      this.encryptedData.set(hex.substring(0, 40) + '...');
    } catch (err) {
      this.encryptedData.set(`Error: ${err}`);
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
