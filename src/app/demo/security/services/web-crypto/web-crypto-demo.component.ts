import { Component, ChangeDetectionStrategy, ViewEncapsulation, signal } from '@angular/core';
import { WebCryptoService } from '@angular-helpers/security';
import { DemoCardComponent } from '../../../ui/demo-card/demo-card.component';

@Component({
  selector: 'app-web-crypto-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [DemoCardComponent],
  providers: [WebCryptoService],
  styleUrl: '../../../shared/demo-shared.styles.css',
  template: `
    <div class="demo-grid">
      <app-demo-card
        title="SHA-256 Hash"
        description="Generate cryptographic hash of input data"
        badge="Crypto"
        badgeVariant="success"
      >
        <button (click)="hashData()" class="btn btn-primary">Generate Hash</button>
        @if (hashResult()) {
          <div class="demo-output">{{ hashResult() }}</div>
        }
      </app-demo-card>

      <app-demo-card
        title="HMAC Signature"
        description="Sign data with HMAC using secret key"
        badge="Crypto"
        badgeVariant="success"
      >
        <button (click)="generateHmac()" class="btn btn-primary">Sign Data</button>
        @if (hmacSignature()) {
          <div class="demo-output">{{ hmacSignature() }}</div>
        }
      </app-demo-card>
    </div>
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
