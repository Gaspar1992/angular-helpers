import { Component, ChangeDetectionStrategy, ViewEncapsulation, signal } from '@angular/core';
import { WebCryptoService } from '@angular-helpers/security';

@Component({
  selector: 'app-hashing-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [WebCryptoService],
  template: `
    <section class="bg-base-200 border border-base-300 rounded-xl p-5 sm:p-6 mb-5">
      <div class="flex items-center justify-between gap-3 flex-wrap mb-3">
        <h2 class="text-lg sm:text-xl font-bold text-base-content m-0 flex items-center gap-2">
          #️⃣ Content Hashing
        </h2>
        <span class="badge badge-accent badge-sm">SHA-256</span>
      </div>
      <p class="text-sm text-base-content/80 mb-4 leading-relaxed">
        Generate SHA-256 hashes of request bodies for integrity checks and caching
      </p>

      <div class="flex flex-wrap gap-2 mb-4">
        <button (click)="hashContent()" class="btn btn-accent btn-sm">Hash Content</button>
        <button (click)="compareHashes()" class="btn btn-secondary btn-sm">Compare Hashes</button>
      </div>

      @if (hashResult()) {
        <div class="p-3 bg-base-300 rounded-lg font-mono text-xs break-all text-base-content">
          {{ hashResult() }}
        </div>
      }
    </section>
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
