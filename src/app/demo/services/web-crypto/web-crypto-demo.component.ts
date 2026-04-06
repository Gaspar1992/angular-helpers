import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  inject,
  signal,
} from '@angular/core';
import { WebCryptoService } from '@angular-helpers/security';

@Component({
  selector: 'app-web-crypto-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: '../demo.styles.css',
  providers: [WebCryptoService],
  template: `
    <section class="svc-card" aria-labelledby="crypto-title">
      <div class="svc-card-head">
        <h2 class="svc-card-title" id="crypto-title">WebCrypto Service</h2>
        <div class="svc-badges">
          <span class="badge badge-ok">aes-gcm</span>
          <span class="badge badge-secure">sha-256</span>
        </div>
      </div>
      <p class="svc-desc">
        Cryptographic operations using the Web Crypto API: hashing, encryption, HMAC signing.
      </p>

      <div class="svc-controls">
        <button class="btn btn-primary" (click)="hashData()">Hash (SHA-256)</button>
        <button class="btn btn-secondary" (click)="encryptAes()">Encrypt AES</button>
        <button class="btn btn-secondary" (click)="generateHmac()">Generate HMAC</button>
      </div>

      @if (hashResult()) {
        <div class="svc-result">
          <div class="kv-row">
            <span class="kv-key">SHA-256 Hash</span>
            <span class="kv-val mono">{{ hashResult() }}</span>
          </div>
        </div>
      }

      @if (encryptedData()) {
        <div class="svc-result">
          <div class="kv-row">
            <span class="kv-key">Encrypted (AES-GCM)</span>
            <span class="kv-val mono">{{ encryptedData() }}</span>
          </div>
        </div>
      }

      @if (hmacSignature()) {
        <div class="svc-result">
          <div class="kv-row">
            <span class="kv-key">HMAC Signature</span>
            <span class="kv-val mono">{{ hmacSignature() }}</span>
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
