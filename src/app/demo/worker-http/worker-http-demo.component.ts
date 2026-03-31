import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { createWorkerTransport } from '@angular-helpers/worker-http/transport';
import type { WorkerTransport } from '@angular-helpers/worker-http/transport';
import {
  createHmacSigner,
  createContentHasher,
  createAesEncryptor,
} from '@angular-helpers/worker-http/crypto';
import type {
  HmacSigner,
  ContentHasher,
  AesEncryptor,
  EncryptedPayload,
} from '@angular-helpers/worker-http/crypto';

interface LogEntry {
  id: number;
  time: string;
  section: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

@Component({
  selector: 'app-worker-http-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: '../services/demo.styles.css',
  templateUrl: './worker-http-demo.component.html',
})
export class WorkerHttpDemoComponent implements OnDestroy {
  // --- Transport state ---
  protected readonly transportStatus = signal<'idle' | 'running' | 'done' | 'error'>('idle');
  protected readonly transportResult = signal<string>('');
  protected readonly transportTime = signal<number>(0);
  private transport: WorkerTransport<unknown, unknown> | null = null;

  // --- Crypto state ---
  protected readonly hmacSignature = signal<string>('');
  protected readonly hmacVerified = signal<boolean | null>(null);
  protected readonly hashResult = signal<string>('');
  protected readonly encryptedHex = signal<string>('');
  protected readonly decryptedText = signal<string>('');
  private hmacSigner: HmacSigner | null = null;
  private contentHasher: ContentHasher | null = null;
  private aesEncryptor: AesEncryptor | null = null;
  private lastEncrypted: EncryptedPayload | null = null;

  // --- Shared log ---
  protected readonly logs = signal<LogEntry[]>([]);
  private logCounter = 0;

  // ──────────────────────────────────────────────────────
  // Transport tests
  // ──────────────────────────────────────────────────────

  sendEcho(): void {
    this.transportStatus.set('running');
    this.transportResult.set('');
    const start = performance.now();

    if (!this.transport) {
      this.transport = createWorkerTransport({
        workerUrl: new URL('./echo.worker.ts', import.meta.url),
        maxInstances: 1,
      });
    }

    this.transport.execute({ message: 'Hello from main thread', delay: 200 }).subscribe({
      next: (result) => {
        const elapsed = Math.round(performance.now() - start);
        this.transportTime.set(elapsed);
        this.transportResult.set(JSON.stringify(result, null, 2));
        this.transportStatus.set('done');
        this.log('Transport', `Echo response received in ${elapsed}ms`, 'success');
      },
      error: (err) => {
        this.transportStatus.set('error');
        this.transportResult.set(String(err));
        this.log('Transport', `Error: ${err}`, 'error');
      },
    });
  }

  sendPoolBurst(): void {
    if (this.transport) {
      this.transport.terminate();
    }
    this.transport = createWorkerTransport({
      workerUrl: new URL('./echo.worker.ts', import.meta.url),
      maxInstances: 4,
    });

    this.transportStatus.set('running');
    const start = performance.now();
    let completed = 0;
    const total = 8;

    for (let i = 0; i < total; i++) {
      this.transport.execute({ index: i, delay: 100 + Math.random() * 200 }).subscribe({
        next: () => {
          completed++;
          if (completed === total) {
            const elapsed = Math.round(performance.now() - start);
            this.transportTime.set(elapsed);
            this.transportResult.set(`${total} requests completed via 4-worker pool`);
            this.transportStatus.set('done');
            this.log(
              'Transport',
              `Pool burst: ${total} requests in ${elapsed}ms (4 workers)`,
              'success',
            );
          }
        },
        error: (err) => {
          this.transportStatus.set('error');
          this.log('Transport', `Pool error: ${err}`, 'error');
        },
      });
    }
  }

  // ──────────────────────────────────────────────────────
  // Crypto tests — HMAC
  // ──────────────────────────────────────────────────────

  async initHmacAndSign(): Promise<void> {
    try {
      const keyMaterial = new TextEncoder().encode('demo-secret-key-for-hmac-256');
      this.hmacSigner = await createHmacSigner({ keyMaterial, algorithm: 'SHA-256' });
      const payload = 'GET:/api/users:' + Date.now();
      const hex = await this.hmacSigner.signHex(payload);
      this.hmacSignature.set(hex);
      this.hmacVerified.set(null);
      this.log('HMAC', `Signed payload (${hex.substring(0, 16)}...)`, 'success');
    } catch (err) {
      this.log('HMAC', `Error: ${err}`, 'error');
    }
  }

  async verifyHmac(): Promise<void> {
    if (!this.hmacSigner || !this.hmacSignature()) {
      this.log('HMAC', 'Sign first before verifying', 'error');
      return;
    }
    try {
      const payload = 'GET:/api/users:' + Date.now();
      const signatureBuffer = await this.hmacSigner.sign(payload);
      const valid = await this.hmacSigner.verify(payload, signatureBuffer);
      this.hmacVerified.set(valid);
      this.log('HMAC', `Verification: ${valid ? 'VALID' : 'INVALID'}`, valid ? 'success' : 'error');
    } catch (err) {
      this.log('HMAC', `Verify error: ${err}`, 'error');
    }
  }

  // ──────────────────────────────────────────────────────
  // Crypto tests — SHA-256 Hashing
  // ──────────────────────────────────────────────────────

  async hashContent(): Promise<void> {
    try {
      this.contentHasher ??= createContentHasher('SHA-256');
      const data = 'Response body content to verify integrity — ' + Date.now();
      const hex = await this.contentHasher.hashHex(data);
      this.hashResult.set(hex);
      this.log('Hash', `SHA-256: ${hex.substring(0, 20)}...`, 'success');
    } catch (err) {
      this.log('Hash', `Error: ${err}`, 'error');
    }
  }

  // ──────────────────────────────────────────────────────
  // Crypto tests — AES Encryption
  // ──────────────────────────────────────────────────────

  async encryptData(): Promise<void> {
    try {
      if (!this.aesEncryptor) {
        const keyMaterial = new TextEncoder().encode('32-byte-secret-key-for-aes-256!');
        this.aesEncryptor = await createAesEncryptor({ keyMaterial, algorithm: 'AES-GCM' });
      }
      const plaintext = 'Sensitive payload: user_id=42&token=abc123';
      const encrypted = await this.aesEncryptor.encrypt(plaintext);
      this.lastEncrypted = encrypted;
      const hex = [...new Uint8Array(encrypted.ciphertext)]
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      this.encryptedHex.set(hex);
      this.decryptedText.set('');
      this.log('AES', `Encrypted (${hex.substring(0, 20)}...)`, 'success');
    } catch (err) {
      this.log('AES', `Encrypt error: ${err}`, 'error');
    }
  }

  async decryptData(): Promise<void> {
    if (!this.aesEncryptor || !this.lastEncrypted) {
      this.log('AES', 'Encrypt first', 'error');
      return;
    }
    try {
      const decrypted = await this.aesEncryptor.decrypt(this.lastEncrypted);
      const text = new TextDecoder().decode(decrypted);
      this.decryptedText.set(text);
      this.log('AES', `Decrypted: "${text}"`, 'success');
    } catch (err) {
      this.log('AES', `Decrypt error: ${err}`, 'error');
    }
  }

  // ──────────────────────────────────────────────────────
  // Utilities
  // ──────────────────────────────────────────────────────

  clearLogs(): void {
    this.logs.set([]);
  }

  private log(section: string, message: string, type: LogEntry['type']): void {
    const time = new Date().toLocaleTimeString('en-US', {
      hour12: false,
      fractionalSecondDigits: 3,
    });
    const id = this.logCounter++;
    this.logs.update((prev) => [{ id, time, section, message, type }, ...prev]);
  }

  ngOnDestroy(): void {
    this.transport?.terminate();
  }
}
