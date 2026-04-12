import { Component, ChangeDetectionStrategy, ViewEncapsulation, signal } from '@angular/core';
import { WebCryptoService } from '@angular-helpers/security';
import { DemoCardComponent } from '../../../ui/demo-card/demo-card.component';

@Component({
  selector: 'app-hmac-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [DemoCardComponent],
  providers: [WebCryptoService],
  styleUrl: '../../../shared/demo-shared.styles.css',
  template: `
    <app-demo-card
      title="HMAC Signing"
      description="Sign and verify request payloads using HMAC-SHA256 via the native Web Crypto API."
      badge="WebCrypto"
      badgeVariant="success"
    >
      <div class="demo-buttons">
        <button (click)="signPayload()" class="btn btn-primary">Sign Payload</button>
        <button (click)="verifySignature()" class="btn btn-secondary">Verify Signature</button>
      </div>
      @if (signatureResult()) {
        <div class="demo-output">{{ signatureResult() }}</div>
      }
    </app-demo-card>
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
