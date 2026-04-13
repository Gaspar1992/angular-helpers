import { Component, ChangeDetectionStrategy, signal } from '@angular/core';

@Component({
  selector: 'app-serializer-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="bg-base-200 border border-base-300 rounded-xl p-5 sm:p-6 mb-5">
      <div class="flex items-center justify-between gap-3 flex-wrap mb-3">
        <h2 class="text-lg sm:text-xl font-bold text-base-content m-0 flex items-center gap-2">
          📦 Serializers
        </h2>
        <span class="badge badge-accent badge-sm">Transfer</span>
      </div>
      <p class="text-sm text-base-content/80 mb-4 leading-relaxed">
        Pluggable serialization for postMessage: structured clone, seroval, or auto-detect
      </p>

      <div class="flex flex-wrap gap-2 mb-4">
        <button (click)="structuredClone()" class="btn btn-primary btn-sm">Structured Clone</button>
        <button (click)="seroval()" class="btn btn-secondary btn-sm">Seroval (Date/Map/Set)</button>
        <button (click)="autoDetect()" class="btn btn-accent btn-sm">Auto-Detect</button>
      </div>

      @if (serializerResult()) {
        <div class="p-3 bg-base-300 rounded-lg font-mono text-xs break-all text-base-content">
          {{ serializerResult() }}
        </div>
      }
    </section>
  `,
})
export class SerializerDemoComponent {
  serializerResult = signal<string>('');

  structuredClone(): void {
    const size = Math.floor(Math.random() * 50) + 10;
    this.serializerResult.set(`⚡ Structured clone: ${size}KB object (zero overhead)`);
  }

  seroval(): void {
    const types = ['Date', 'Map', 'Set', 'BigInt', 'circular ref'];
    const detected = types.slice(0, Math.floor(Math.random() * 3) + 2).join(', ');
    this.serializerResult.set(`📦 Seroval: Preserved ${detected} in payload`);
  }

  autoDetect(): void {
    const payloadSize = Math.floor(Math.random() * 200) + 50;
    const strategy = payloadSize > 100 ? 'ArrayBuffer transfer' : 'structured clone';
    this.serializerResult.set(`🤖 Auto-detect: ${payloadSize}KB payload → ${strategy}`);
  }
}
