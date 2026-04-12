import { Component, ChangeDetectionStrategy, ViewEncapsulation, signal } from '@angular/core';
import { SecureStorageService } from '@angular-helpers/security';

@Component({
  selector: 'app-secure-storage-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [SecureStorageService],
  template: `
    <section class="bg-base-200 border border-base-300 rounded-xl p-5 sm:p-6 mb-5">
      <div class="flex items-center justify-between gap-3 flex-wrap mb-3">
        <h2 class="text-lg sm:text-xl font-bold text-base-content m-0 flex items-center gap-2">
          🗄️ SecureStorageService
        </h2>
        <span class="badge badge-accent badge-sm">AES-GCM</span>
      </div>
      <p class="text-sm text-base-content/70 mb-4 leading-relaxed">
        Encrypted localStorage/sessionStorage with AES-GCM
      </p>

      <div class="space-y-3">
        <div class="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            name="storage-key"
            [value]="storageKey()"
            (input)="storageKey.set($any($event).target.value)"
            placeholder="Key"
            class="input input-bordered input-sm flex-1 font-mono"
          />
          <input
            type="text"
            name="storage-value"
            [value]="storageValue()"
            (input)="storageValue.set($any($event).target.value)"
            placeholder="Value (JSON)"
            class="input input-bordered input-sm flex-1 font-mono"
          />
        </div>
        <div class="flex flex-wrap gap-2">
          <button (click)="saveData()" class="btn btn-primary btn-sm">Save</button>
          <button (click)="loadData()" class="btn btn-secondary btn-sm">Load</button>
          <button (click)="clearData()" class="btn btn-error btn-sm">Clear</button>
        </div>

        @if (storageResult()) {
          <div
            class="p-3 rounded-lg text-sm"
            [class.bg-success/10]="storageResult().startsWith('✅')"
            [class.text-success]="storageResult().startsWith('✅')"
            [class.bg-error/10]="storageResult().startsWith('❌')"
            [class.text-error]="storageResult().startsWith('❌')"
          >
            {{ storageResult() }}
          </div>
        }
      </div>
    </section>
  `,
})
export class SecureStorageDemoComponent {
  storageKey = signal<string>('demo-key');
  storageValue = signal<string>('{"message": "Hello World"}');
  storageResult = signal<string>('');

  constructor(private secureStorage: SecureStorageService) {}

  async saveData(): Promise<void> {
    try {
      await this.secureStorage.set(this.storageKey(), JSON.parse(this.storageValue()));
      this.storageResult.set('✅ Data saved successfully');
    } catch (err) {
      this.storageResult.set(`❌ Error: ${err}`);
    }
  }

  async loadData(): Promise<void> {
    try {
      const data = await this.secureStorage.get(this.storageKey());
      this.storageResult.set(`📦 Data: ${JSON.stringify(data)}`);
    } catch (err) {
      this.storageResult.set(`❌ Error: ${err}`);
    }
  }

  async clearData(): Promise<void> {
    try {
      await this.secureStorage.remove(this.storageKey());
      this.storageResult.set('🗑️ Data cleared');
    } catch (err) {
      this.storageResult.set(`❌ Error: ${err}`);
    }
  }
}
