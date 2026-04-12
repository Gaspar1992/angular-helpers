import { Component, ChangeDetectionStrategy, ViewEncapsulation, signal } from '@angular/core';
import { WebCryptoService } from '@angular-helpers/security';
import { DemoCardComponent } from '../../../../ui/demo-card/demo-card.component';

@Component({
  selector: 'app-hashing-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [DemoCardComponent],
  providers: [WebCryptoService],
  styleUrl: '../../../shared/demo-shared.styles.css',
  template: `
    <app-demo-card
      title="Content Hashing"
      description="Generate SHA-256 hashes of request bodies for integrity checks and caching."
      badge="WebCrypto"
      badgeVariant="success"
    >
      <div class="demo-buttons">
        <button (click)="hashContent()" class="btn btn-primary">Hash Content</button>
        <button (click)="compareHashes()" class="btn btn-secondary">Compare Hashes</button>
      </div>
      @if (hashResult()) {
        <div class="demo-output">{{ hashResult() }}</div>
      }
    </app-demo-card>
  `,
})
export class HashingDemoComponent {
  hashResult = signal<string>('');
  private lastHash = '';

  constructor(private webCrypto: WebCryptoService) {}

  async hashContent(): Promise<void> {
    try {
      const content = 'request-body-' + Date.now();
      this.lastHash = await this.webCrypto.hash(content, 'SHA-256');
      this.hashResult.set(`SHA-256: ${this.lastHash.substring(0, 32)}...`);
    } catch (err) {
      this.hashResult.set(`Error: ${err}`);
    }
  }

  compareHashes(): void {
    if (!this.lastHash) {
      this.hashResult.set('❌ No hash to compare. Hash some content first.');
      return;
    }
    this.hashResult.set(`✅ Hash format valid: ${this.lastHash.substring(0, 16)}...`);
  }
}
