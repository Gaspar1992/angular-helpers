import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { SecureStorageService } from '@angular-helpers/security';

@Component({
  selector: 'app-secure-storage-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SecureStorageService],
  template: `
    <section class="svc-card" aria-labelledby="storage-title">
      <div class="svc-card-head">
        <h2 class="svc-card-title" id="storage-title">SecureStorage Service</h2>
        <div class="flex gap-2 flex-wrap">
          <span class="badge badge-success">encrypted</span>
          <span class="badge badge-info">aes-gcm</span>
        </div>
      </div>
      <p class="text-sm text-base-content/70 mb-4 leading-relaxed">
        Transparently encrypted storage using AES-GCM. Supports ephemeral (session) and passphrase
        modes.
      </p>

      <div class="flex flex-col gap-3 mb-4">
        <div class="flex flex-col gap-1">
          <label for="storage-key" class="text-xs font-bold uppercase opacity-50 ml-1">Key</label>
          <input
            id="storage-key"
            class="demo-input"
            [value]="storageKey()"
            (input)="storageKey.set($any($event.target).value)"
            placeholder="demo-key"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label for="storage-value" class="text-xs font-bold uppercase opacity-50 ml-1"
            >Value (JSON)</label
          >
          <input
            id="storage-value"
            class="demo-input font-mono text-xs"
            [value]="storageValue()"
            (input)="storageValue.set($any($event.target).value)"
            placeholder='{"message": "Hello, World!"}'
          />
        </div>
        <div class="flex flex-col gap-1">
          <label for="passphrase" class="text-xs font-bold uppercase opacity-50 ml-1"
            >Passphrase (optional)</label
          >
          <input
            id="passphrase"
            class="demo-input"
            type="password"
            [value]="passphrase()"
            (input)="passphrase.set($any($event.target).value)"
            placeholder="my-secret-passphrase"
          />
        </div>
      </div>

      <div class="svc-controls">
        <button class="btn btn-primary btn-sm font-bold" (click)="storeData()">Store</button>
        <button class="btn btn-secondary btn-sm font-bold" (click)="retrieveData()">
          Retrieve
        </button>
        <button class="btn btn-secondary btn-sm font-bold" (click)="initWithPassphrase()">
          Init Passphrase
        </button>
        <button class="btn btn-error btn-sm font-bold" (click)="clearStorage()">Clear</button>
      </div>

      @if (storageResult()) {
        <div class="svc-result mt-4">
          <div
            class="text-sm"
            [class.text-success]="storageResult().startsWith('✅')"
            [class.text-error]="storageResult().startsWith('❌')"
          >
            {{ storageResult() }}
          </div>
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
