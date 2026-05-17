import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { createAesEncryptor } from '@angular-helpers/worker-http/crypto';
import type { AesEncryptor, EncryptedPayload } from '@angular-helpers/worker-http/crypto';
import { WorkerHttpDemoLogService } from '../shared/log.service';

@Component({
  selector: 'app-worker-http-aes-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="svc-card h-full flex flex-col">
      <div class="svc-card-head">
        <h2 class="svc-card-title"><span>🔐</span> AES Encryption</h2>
        <span class="badge badge-info font-black">AES-GCM</span>
      </div>
      <p class="svc-desc">Encrypt and decrypt sensitive payloads using AES-GCM.</p>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <button type="button" (click)="encrypt()" class="btn btn-primary">Encrypt</button>
        <button
          type="button"
          (click)="decrypt()"
          [disabled]="!encryptedHex()"
          class="btn btn-secondary"
        >
          Decrypt
        </button>
      </div>

      <div class="space-y-4 mt-auto">
        @if (encryptedHex()) {
          <div class="mono-block break-all">
            <div class="text-primary font-black mb-2 uppercase tracking-widest text-[9px]">
              Encrypted Payload
            </div>
            {{ encryptedHex() }}
          </div>
        }
        @if (decryptedText()) {
          <div class="mono-block break-all border border-green-500/20 bg-green-500/5">
            <div class="text-green-400 font-black mb-2 uppercase tracking-widest text-[9px]">
              Decrypted Content
            </div>
            <span class="text-green-400 font-bold">{{ decryptedText() }}</span>
          </div>
        }
      </div>
    </div>
  `,
  styleUrl: '../../services/demo.styles.css',
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
