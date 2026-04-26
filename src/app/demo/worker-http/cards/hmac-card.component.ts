import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { createHmacSigner } from '@angular-helpers/worker-http/crypto';
import type { HmacSigner } from '@angular-helpers/worker-http/crypto';
import { WorkerHttpDemoLogService } from '../shared/log.service';

@Component({
  selector: 'app-worker-http-hmac-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-base-200 border border-base-300 rounded-xl p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-bold text-base-content m-0 flex items-center gap-2">
          ✍️ HMAC Signing
        </h2>
        <span class="badge badge-secondary">HMAC-SHA256</span>
      </div>
      <p class="text-sm text-base-content/80 mb-4">
        Sign and verify request payloads using HMAC via native Web Crypto API
      </p>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <button type="button" (click)="initAndSign()" class="btn btn-primary btn-sm">
          Sign Payload
        </button>
        <button
          type="button"
          (click)="verify()"
          [disabled]="!signature()"
          class="btn btn-secondary btn-sm"
        >
          Verify Signature
        </button>
      </div>

      @if (signature()) {
        <div class="p-3 bg-base-300 rounded-lg font-mono text-xs break-all mb-2">
          <span class="text-secondary">Signature:</span> {{ signature() }}
        </div>
      }
      @if (verified() !== null) {
        <div
          class="p-2 rounded-lg text-sm"
          [class.bg-success/10]="verified()"
          [class.text-success]="verified()"
          [class.bg-error/10]="!verified()"
          [class.text-error]="!verified()"
        >
          {{ verified() ? '✅ Valid Signature' : '❌ Invalid Signature' }}
        </div>
      }
    </div>
  `,
})
export class HmacCardComponent {
  private readonly log = inject(WorkerHttpDemoLogService);

  protected readonly signature = signal<string>('');
  protected readonly verified = signal<boolean | null>(null);
  private signer: HmacSigner | null = null;

  async initAndSign(): Promise<void> {
    try {
      const keyMaterial = new TextEncoder().encode('demo-secret-key-for-hmac-256');
      this.signer = await createHmacSigner({ keyMaterial, algorithm: 'SHA-256' });
      const payload = `GET:/api/users:${Date.now()}`;
      const hex = await this.signer.signHex(payload);
      this.signature.set(hex);
      this.verified.set(null);
      this.log.log('HMAC', `Signed payload (${hex.substring(0, 16)}...)`, 'success');
    } catch (err) {
      this.log.log('HMAC', `Error: ${err}`, 'error');
    }
  }

  async verify(): Promise<void> {
    if (!this.signer || !this.signature()) {
      this.log.log('HMAC', 'Sign first before verifying', 'error');
      return;
    }
    try {
      const payload = `GET:/api/users:${Date.now()}`;
      const signatureBuffer = await this.signer.sign(payload);
      const valid = await this.signer.verify(payload, signatureBuffer);
      this.verified.set(valid);
      this.log.log(
        'HMAC',
        `Verification: ${valid ? 'VALID' : 'INVALID'}`,
        valid ? 'success' : 'error',
      );
    } catch (err) {
      this.log.log('HMAC', `Verify error: ${err}`, 'error');
    }
  }
}
