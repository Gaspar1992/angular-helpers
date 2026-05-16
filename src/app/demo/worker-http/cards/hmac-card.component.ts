import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { createHmacSigner } from '@angular-helpers/worker-http/crypto';
import type { HmacSigner } from '@angular-helpers/worker-http/crypto';
import { WorkerHttpDemoLogService } from '../shared/log.service';

@Component({
  selector: 'app-worker-http-hmac-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-base-200 border border-base-content/5 rounded-3xl p-8 h-full flex flex-col">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold text-secondary m-0 flex items-center gap-2">
          ✍️ HMAC Signing
        </h2>
        <span class="badge badge-secondary font-semibold">HMAC-SHA256</span>
      </div>
      <p class="text-sm text-base-content/70 mb-8">
        Sign and verify request payloads using HMAC via native Web Crypto API
      </p>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <button type="button" (click)="initAndSign()" class="btn btn-primary font-bold px-6">
          Sign Payload
        </button>
        <button
          type="button"
          (click)="verify()"
          [disabled]="!signature()"
          class="btn btn-secondary font-bold px-6"
        >
          Verify Signature
        </button>
      </div>

      <div class="space-y-4 mt-auto">
        @if (signature()) {
          <div
            class="p-4 bg-base-content/5 rounded-2xl shadow-inner border border-base-content/5 font-mono text-xs break-all"
          >
            <div
              class="text-secondary font-bold mb-1 uppercase tracking-wider text-[10px] opacity-70"
            >
              Signature
            </div>
            {{ signature() }}
          </div>
        }
        @if (verified() !== null) {
          <div
            class="p-4 rounded-2xl text-sm font-bold flex items-center gap-2 border"
            [class.bg-success/10]="verified()"
            [class.border-success/20]="verified()"
            [class.text-success]="verified()"
            [class.bg-error/10]="!verified()"
            [class.border-error/20]="!verified()"
            [class.text-error]="!verified()"
          >
            @if (verified()) {
              <span>✅ Valid Signature</span>
            } @else {
              <span>❌ Invalid Signature</span>
            }
          </div>
        }
      </div>
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
