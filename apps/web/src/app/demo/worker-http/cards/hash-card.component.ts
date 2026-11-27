import { Component, inject, signal } from '@angular/core';
import { createContentHasher } from '@angular-helpers/worker-http/crypto';
import type { ContentHasher } from '@angular-helpers/worker-http/crypto';
import { WorkerHttpDemoLogService } from '../shared/log.service';

@Component({
  selector: 'app-worker-http-hash-card',
  template: `
    <div class="svc-card h-full flex flex-col">
      <div class="svc-card-head">
        <h2 class="svc-card-title"><span>#️⃣</span> Content Hashing</h2>
        <span class="badge badge-accent font-black">SHA-256</span>
      </div>
      <p class="svc-desc">
        Generate SHA-256 hashes of request bodies for integrity checks and caching.
      </p>

      <button type="button" (click)="hash()" class="btn btn-primary px-8 w-full sm:w-auto mb-8">
        Hash Content
      </button>

      <div class="mt-auto">
        @if (result()) {
          <div class="mono-block break-all">
            <div
              class="text-accent font-black mb-2 uppercase tracking-widest text-[9px] opacity-70"
            >
              SHA-256 Hash
            </div>
            {{ result() }}
          </div>
        }
      </div>
    </div>
  `,
  styleUrl: '../../services/demo.styles.css',
})
export class HashCardComponent {
  private readonly log = inject(WorkerHttpDemoLogService);

  protected readonly result = signal<string>('');
  private hasher: ContentHasher | null = null;

  async hash(): Promise<void> {
    try {
      this.hasher ??= createContentHasher('SHA-256');
      const data = `Response body content to verify integrity — ${Date.now()}`;
      const hex = await this.hasher.hashHex(data);
      this.result.set(hex);
      this.log.log('Hash', `SHA-256: ${hex.substring(0, 20)}...`, 'success');
    } catch (err) {
      this.log.log('Hash', `Error: ${err}`, 'error');
    }
  }
}
