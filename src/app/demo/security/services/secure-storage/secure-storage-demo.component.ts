import { Component, ChangeDetectionStrategy, ViewEncapsulation, signal } from '@angular/core';
import { SecureStorageService } from '@angular-helpers/security';

@Component({
  selector: 'app-secure-storage-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: '../../../shared/demo-shared.styles.css',
  template: `
    <div class="demo-section">
      <h3>🗄️ SecureStorageService</h3>
      <p>Encrypted localStorage/sessionStorage with AES-GCM</p>

      <div class="demo-controls">
        <label>
          Key:
          <input
            type="text"
            name="storage-key"
            [value]="storageKey()"
            (input)="storageKey.set($any($event).target.value)"
            class="demo-input"
          />
        </label>
        <label>
          Value (JSON):
          <input
            type="text"
            name="storage-value"
            [value]="storageValue()"
            (input)="storageValue.set($any($event).target.value)"
            class="demo-input"
          />
        </label>
        <div class="demo-buttons">
          <button (click)="saveData()" class="btn btn-primary">Save</button>
          <button (click)="loadData()" class="btn btn-secondary">Load</button>
          <button (click)="clearData()" class="btn btn-danger">Clear</button>
        </div>
      </div>

      @if (storageResult()) {
        <div class="demo-result">{{ storageResult() }}</div>
      }
    </div>
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
