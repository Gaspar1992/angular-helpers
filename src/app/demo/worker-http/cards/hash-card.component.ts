import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { createContentHasher } from '@angular-helpers/worker-http/crypto';
import type { ContentHasher } from '@angular-helpers/worker-http/crypto';
import { WorkerHttpDemoLogService } from '../shared/log.service';

@Component({
  selector: 'app-worker-http-hash-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-base-200 border border-base-content/5 rounded-3xl p-8 h-full flex flex-col">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold text-accent m-0 flex items-center gap-2">
          #️⃣ Content Hashing
        </h2>
        <span class="badge badge-accent font-semibold">SHA-256</span>
      </div>
      <p class="text-sm text-base-content/70 mb-8">
        Generate SHA-256 hashes of request bodies for integrity checks and caching
      </p>

      <button
        type="button"
        (click)="hash()"
        class="btn btn-accent font-bold px-8 w-full sm:w-auto mb-6"
      >
        Hash Content
      </button>

      <div class="mt-auto">
        @if (result()) {
          <div
            class="p-4 bg-base-content/5 rounded-2xl shadow-inner border border-base-content/5 font-mono text-xs break-all"
          >
            <div class="text-accent font-bold mb-1 uppercase tracking-wider text-[10px] opacity-70">
              SHA-256 Hash
            </div>
            {{ result() }}
          </div>
        }
      </div>
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
