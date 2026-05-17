import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { createHmacSigner } from '@angular-helpers/worker-http/crypto';
import type { HmacSigner } from '@angular-helpers/worker-http/crypto';
import { WorkerHttpDemoLogService } from '../shared/log.service';

@Component({
  selector: 'app-worker-http-hmac-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="svc-card h-full flex flex-col">
      <div class="svc-card-head">
        <h2 class="svc-card-title"><span>✍️</span> HMAC Signing</h2>
        <span class="badge badge-secondary font-black">HMAC-SHA256</span>
      </div>
      <p class="svc-desc">Sign and verify request payloads using HMAC via native Web Crypto API.</p>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <button type="button" (click)="initAndSign()" class="btn btn-primary">Sign Payload</button>
        <button
          type="button"
          (click)="verify()"
          [disabled]="!signature()"
          class="btn btn-secondary"
        >
          Verify Signature
        </button>
      </div>

      <div class="space-y-4 mt-auto">
        @if (signature()) {
          <div class="mono-block break-all">
            <div
              class="text-secondary font-black mb-2 uppercase tracking-widest text-[9px] opacity-70"
            >
              Signature
            </div>
            {{ signature() }}
          </div>
        }
        @if (verified() !== null) {
          <div
            class="feedback font-black text-sm"
            [class.feedback-success]="verified()"
            [class.feedback-error]="!verified()"
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
  styleUrl: '../../services/demo.styles.css',
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
