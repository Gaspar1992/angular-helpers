import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { createAesEncryptor } from '@angular-helpers/worker-http/crypto';
import type { AesEncryptor, EncryptedPayload } from '@angular-helpers/worker-http/crypto';
import { WorkerHttpDemoLogService } from '../shared/log.service';

@Component({
  selector: 'app-worker-http-aes-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-base-200 border border-base-300 rounded-xl p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-bold text-base-content m-0 flex items-center gap-2">
          🔐 AES Encryption
        </h2>
        <span class="badge badge-info">AES-GCM</span>
      </div>
      <p class="text-sm text-base-content/80 mb-4">
        Encrypt and decrypt sensitive payloads using AES-GCM
      </p>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <button type="button" (click)="encrypt()" class="btn btn-info btn-sm">Encrypt</button>
        <button
          type="button"
          (click)="decrypt()"
          [disabled]="!encryptedHex()"
          class="btn btn-secondary btn-sm"
        >
          Decrypt
        </button>
      </div>

      @if (encryptedHex()) {
        <div class="p-3 bg-base-300 rounded-lg font-mono text-xs break-all mb-2">
          <span class="text-secondary">Encrypted:</span> {{ encryptedHex() }}
        </div>
      }
      @if (decryptedText()) {
        <div class="p-3 bg-success/10 text-success rounded-lg font-mono text-sm break-all">
          <span>Decrypted:</span> {{ decryptedText() }}
        </div>
      }
    </div>
  `,
})
export class AesCardComponent {
  private readonly log = inject(WorkerHttpDemoLogService);

  protected readonly encryptedHex = signal<string>('');
  protected readonly decryptedText = signal<string>('');
  private encryptor: AesEncryptor | null = null;
  private lastEncrypted: EncryptedPayload | null = null;

  async encrypt(): Promise<void> {
    try {
      if (!this.encryptor) {
        const keyMaterial = new TextEncoder().encode('32-byte-secret-key-for-aes-256!!');
        this.encryptor = await createAesEncryptor({ keyMaterial, algorithm: 'AES-GCM' });
      }
      const plaintext = 'Sensitive payload: user_id=42&token=abc123';
      const encrypted = await this.encryptor.encrypt(plaintext);
      this.lastEncrypted = encrypted;
      const hex = [...new Uint8Array(encrypted.ciphertext)]
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      this.encryptedHex.set(hex);
      this.decryptedText.set('');
      this.log.log('AES', `Encrypted (${hex.substring(0, 20)}...)`, 'success');
    } catch (err) {
      this.log.log('AES', `Encrypt error: ${err}`, 'error');
    }
  }

  async decrypt(): Promise<void> {
    if (!this.encryptor || !this.lastEncrypted) {
      this.log.log('AES', 'Encrypt first', 'error');
      return;
    }
    try {
      const decrypted = await this.encryptor.decrypt(this.lastEncrypted);
      const text = new TextDecoder().decode(decrypted);
      this.decryptedText.set(text);
      this.log.log('AES', `Decrypted: "${text}"`, 'success');
    } catch (err) {
      this.log.log('AES', `Decrypt error: ${err}`, 'error');
    }
  }
}
