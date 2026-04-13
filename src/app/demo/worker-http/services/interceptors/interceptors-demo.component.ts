import { Component, ChangeDetectionStrategy, signal } from '@angular/core';

@Component({
  selector: 'app-interceptors-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="bg-base-200 border border-base-300 rounded-xl p-5 sm:p-6 mb-5">
      <div class="flex items-center justify-between gap-3 flex-wrap mb-3">
        <h2 class="text-lg sm:text-xl font-bold text-base-content m-0 flex items-center gap-2">
          🔗 Interceptors
        </h2>
        <span class="badge badge-secondary badge-sm">Pipeline</span>
      </div>
      <p class="text-sm text-base-content/80 mb-4 leading-relaxed">
        Pure-function request/response interceptors that run inside the worker
      </p>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
        <button (click)="simulateRetry()" class="btn btn-primary btn-sm">Retry Interceptor</button>
        <button (click)="simulateCache()" class="btn btn-secondary btn-sm">
          Cache Interceptor
        </button>
        <button (click)="simulateRateLimit()" class="btn btn-accent btn-sm">Rate Limit</button>
        <button (click)="simulateHmac()" class="btn btn-info btn-sm">HMAC Signing</button>
      </div>

      @if (interceptorResult()) {
        <div class="p-3 bg-base-300 rounded-lg font-mono text-xs break-all text-base-content">
          {{ interceptorResult() }}
        </div>
      }
    </section>
  `,
})
export class InterceptorsDemoComponent {
  interceptorResult = signal<string>('');

  simulateRetry(): void {
    const attempts = Math.floor(Math.random() * 3) + 1;
    this.interceptorResult.set(`🔁 Retry interceptor: Success after ${attempts} attempt(s)`);
  }

  simulateCache(): void {
    const cacheKey = `GET-/api/users-${Date.now().toString(36).slice(-4)}`;
    this.interceptorResult.set(`💾 Cache interceptor: Stored response for key "${cacheKey}"`);
  }

  simulateRateLimit(): void {
    const remaining = Math.floor(Math.random() * 10);
    this.interceptorResult.set(`⏱️ Rate limit: ${remaining} requests remaining in window`);
  }

  simulateHmac(): void {
    const sig = 'a1b2c3d4e5f6' + Math.random().toString(36).slice(2, 14);
    this.interceptorResult.set(`✍️ HMAC-SHA256: X-HMAC-Signature: ${sig}...`);
  }
}
