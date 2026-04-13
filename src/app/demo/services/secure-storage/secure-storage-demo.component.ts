import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { SecureStorageService } from '@angular-helpers/security';

@Component({
  selector: 'app-secure-storage-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SecureStorageService],
  template: `
    <section
      class="bg-base-200 border border-base-300 rounded-xl p-5 sm:p-6 mb-5"
      aria-labelledby="storage-title"
    >
      <div class="flex items-center justify-between gap-3 flex-wrap mb-3">
        <h2 class="text-lg sm:text-xl font-bold text-base-content m-0" id="storage-title">
          SecureStorage Service
        </h2>
        <div class="flex gap-2 flex-wrap">
          <span class="badge badge-success badge-sm">encrypted</span>
          <span class="badge badge-info badge-sm">aes-gcm</span>
        </div>
      </div>
      <p class="text-sm text-base-content/70 mb-4 leading-relaxed">
        Transparently encrypted storage using AES-GCM. Supports ephemeral (session) and passphrase
        modes.
      </p>

      <div class="flex flex-col gap-2 mb-4">
        <label for="storage-key" class="text-sm font-medium text-base-content/70">Key</label>
        <input
          id="storage-key"
          class="input input-sm input-bordered w-full"
          [value]="storageKey()"
          (input)="storageKey.set($any($event.target).value)"
          placeholder="demo-key"
        />
        <label for="storage-value" class="text-sm font-medium text-base-content/70"
          >Value (JSON)</label
        >
        <input
          id="storage-value"
          class="input input-sm input-bordered w-full font-mono text-xs"
          [value]="storageValue()"
          (input)="storageValue.set($any($event.target).value)"
          placeholder='{"message": "Hello, World!"}'
        />
        <label for="passphrase" class="text-sm font-medium text-base-content/70"
          >Passphrase (optional)</label
        >
        <input
          id="passphrase"
          class="input input-sm input-bordered w-full"
          type="password"
          [value]="passphrase()"
          (input)="passphrase.set($any($event.target).value)"
          placeholder="my-secret-passphrase"
        />
      </div>

      <div class="flex flex-wrap gap-2 mb-4">
        <button class="btn btn-primary btn-sm" (click)="storeData()">Store</button>
        <button class="btn btn-secondary btn-sm" (click)="retrieveData()">Retrieve</button>
        <button class="btn btn-secondary btn-sm" (click)="initWithPassphrase()">
          Init Passphrase
        </button>
        <button class="btn btn-error btn-sm" (click)="clearStorage()">Clear</button>
      </div>

      @if (storageResult()) {
        <div
          class="p-3 rounded-lg text-sm mt-2"
          [class.bg-success/10]="storageResult().startsWith('✅')"
          [class.text-success]="storageResult().startsWith('✅')"
          [class.bg-error/10]="storageResult().startsWith('❌')"
          [class.text-error]="storageResult().startsWith('❌')"
        >
          {{ storageResult() }}
        </div>
      }
    </section>
  `,
})
export class SecureStorageDemoComponent {
  private readonly secureStorage = inject(SecureStorageService);

  readonly storageKey = signal<string>('demo-key');
  readonly storageValue = signal<string>('{"message": "Hello, World!"}');
  readonly storageResult = signal<string>('');
  readonly passphrase = signal<string>('');

  async storeData(): Promise<void> {
    try {
      const value = JSON.parse(this.storageValue());
      await this.secureStorage.set(this.storageKey(), value);
      this.storageResult.set('✅ Data stored successfully (encrypted)');
    } catch (err) {
      this.storageResult.set(`❌ Error: ${err}`);
    }
  }

  async retrieveData(): Promise<void> {
    try {
      const data = await this.secureStorage.get<unknown>(this.storageKey());
      if (data) {
        this.storageResult.set(`✅ Retrieved: ${JSON.stringify(data)}`);
      } else {
        this.storageResult.set('❌ No data found');
      }
    } catch (err) {
      this.storageResult.set(`❌ Error: ${err}`);
    }
  }

  async initWithPassphrase(): Promise<void> {
    if (!this.passphrase()) {
      this.storageResult.set('❌ Enter a passphrase first');
      return;
    }
    try {
      await this.secureStorage.initWithPassphrase(this.passphrase());
      this.storageResult.set('✅ Passphrase initialized - data will persist across sessions');
    } catch (err) {
      this.storageResult.set(`❌ Error: ${err}`);
    }
  }

  clearStorage(): void {
    this.secureStorage.clear();
    this.storageResult.set('✅ Storage cleared');
  }
}
