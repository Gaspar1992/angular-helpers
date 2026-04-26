import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { createContentHasher } from '@angular-helpers/worker-http/crypto';
import type { ContentHasher } from '@angular-helpers/worker-http/crypto';
import { WorkerHttpDemoLogService } from '../shared/log.service';

@Component({
  selector: 'app-worker-http-hash-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-base-200 border border-base-300 rounded-xl p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-bold text-base-content m-0 flex items-center gap-2">
          #️⃣ Content Hashing
        </h2>
        <span class="badge badge-accent">SHA-256</span>
      </div>
      <p class="text-sm text-base-content/80 mb-4">
        Generate SHA-256 hashes of request bodies for integrity checks and caching
      </p>

      <button type="button" (click)="hash()" class="btn btn-accent btn-sm w-full sm:w-auto">
        Hash Content
      </button>

      @if (result()) {
        <div class="mt-3 p-3 bg-base-300 rounded-lg font-mono text-xs break-all">
          <span class="text-secondary">SHA-256:</span> {{ result() }}
        </div>
      }
    </div>
  `,
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
