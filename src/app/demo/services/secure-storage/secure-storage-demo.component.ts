import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  inject,
  signal,
} from '@angular/core';
import { SecureStorageService } from '@angular-helpers/security';

@Component({
  selector: 'app-secure-storage-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: '../demo.styles.css',
  template: `
    <section class="svc-card" aria-labelledby="storage-title">
      <div class="svc-card-head">
        <h2 class="svc-card-title" id="storage-title">SecureStorage Service</h2>
        <div class="svc-badges">
          <span class="badge badge-ok">encrypted</span>
          <span class="badge badge-secure">aes-gcm</span>
        </div>
      </div>
      <p class="svc-desc">
        Transparently encrypted storage using AES-GCM. Supports ephemeral (session) and passphrase
        modes.
      </p>

      <div class="svc-controls svc-controls--col">
        <label for="storage-key" class="demo-label">Key</label>
        <input
          id="storage-key"
          class="demo-input"
          [value]="storageKey()"
          (input)="storageKey.set($any($event.target).value)"
          placeholder="demo-key"
        />

        <label for="storage-value" class="demo-label">Value (JSON)</label>
        <input
          id="storage-value"
          class="demo-input"
          [value]="storageValue()"
          (input)="storageValue.set($any($event.target).value)"
          placeholder='{"message": "Hello, World!"}'
        />

        <label for="passphrase" class="demo-label">Passphrase (optional)</label>
        <input
          id="passphrase"
          class="demo-input"
          type="password"
          [value]="passphrase()"
          (input)="passphrase.set($any($event.target).value)"
          placeholder="my-secret-passphrase"
        />
      </div>

      <div class="svc-controls">
        <button class="btn btn-primary" (click)="storeData()">Store</button>
        <button class="btn btn-secondary" (click)="retrieveData()">Retrieve</button>
        <button class="btn btn-secondary" (click)="initWithPassphrase()">Init Passphrase</button>
        <button class="btn btn-danger" (click)="clearStorage()">Clear</button>
      </div>

      @if (storageResult()) {
        <div
          class="feedback"
          [class.feedback-success]="storageResult().startsWith('✅')"
          [class.feedback-error]="storageResult().startsWith('❌')"
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
