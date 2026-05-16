import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { needsPolyfill } from '@angular-helpers/worker-http/streams-polyfill';
import { WorkerHttpDemoLogService } from '../shared/log.service';

interface StreamCapability {
  readonly name: string;
  readonly supported: boolean;
  readonly details?: string;
}

@Component({
  selector: 'app-worker-http-streams-polyfill-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-base-200 border border-base-content/5 rounded-3xl p-8 h-full flex flex-col">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold text-info m-0 flex items-center gap-2">🌊 Streams Polyfill</h2>
        <span class="badge badge-info font-semibold">Safari Support</span>
      </div>
      <p class="text-sm text-base-content/70 mb-8">
        Detects Safari 16-17 transferable streams limitation and provides ponyfill when needed
      </p>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <button type="button" (click)="detectCapabilities()" class="btn btn-primary font-bold">
          Detect Capabilities
        </button>
        <button type="button" (click)="simulateLegacySafari()" class="btn btn-secondary font-bold">
          Simulate Safari 17
        </button>
      </div>

      @if (detectionResult()) {
        <div class="space-y-4 mt-auto">
          <!-- Polyfill Needed -->
          <div
            class="p-4 rounded-2xl border bg-base-content/5 shadow-inner"
            [class.border-success/30]="!detectionResult()?.needsPolyfill"
            [class.border-warning/30]="detectionResult()?.needsPolyfill"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="font-bold text-xs uppercase tracking-wider opacity-70">
                Polyfill Required
              </span>
              <span
                class="badge badge-sm font-bold"
                [class.badge-success]="!detectionResult()?.needsPolyfill"
                [class.badge-warning]="detectionResult()?.needsPolyfill"
              >
                {{ detectionResult()?.needsPolyfill ? 'YES' : 'NO' }}
              </span>
            </div>
            <p
              class="text-sm font-semibold"
              [class.text-success]="!detectionResult()?.needsPolyfill"
              [class.text-warning]="detectionResult()?.needsPolyfill"
            >
              {{
                detectionResult()?.needsPolyfill
                  ? 'Safari 16-17 detected — ponyfill needed'
                  : 'Native transferable streams supported'
              }}
            </p>
          </div>

          <!-- User Agent -->
          <div class="p-4 bg-base-content/5 rounded-2xl border border-base-content/5 shadow-inner">
            <span class="text-[10px] font-bold uppercase tracking-[0.2em] text-base-content/40">
              User Agent
            </span>
            <p class="text-[11px] font-mono break-all mt-2 text-base-content/60 leading-relaxed">
              {{ detectionResult()?.userAgent }}
            </p>
          </div>

          <!-- Capabilities Grid -->
          <div class="grid grid-cols-2 gap-2">
            @for (cap of detectionResult()?.capabilities; track cap.name) {
              <div
                class="p-3 rounded-xl text-xs flex items-center justify-between bg-base-content/5 border border-base-content/5"
              >
                <span class="font-medium opacity-80">{{ cap.name }}</span>
                <span
                  class="badge badge-xs font-bold"
                  [class.badge-success]="cap.supported"
                  [class.badge-error]="!cap.supported"
                >
                  {{ cap.supported ? '✓' : '✗' }}
                </span>
              </div>
            }
          </div>

          <!-- Safari Version Detection -->
          @if (detectionResult()?.safariVersion) {
            <div
              class="p-3 bg-info/10 border border-info/20 rounded-xl text-xs flex items-center justify-between"
            >
              <span class="text-info font-bold">Safari Version</span>
              <div class="flex items-center gap-2">
                <span class="font-mono">{{ detectionResult()?.safariVersion }}</span>
                @if (detectionResult()?.isLegacySafari) {
                  <span class="badge badge-warning badge-xs font-bold">LEGACY</span>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class StreamsPolyfillCardComponent {
  private readonly log = inject(WorkerHttpDemoLogService);

  protected readonly detectionResult = signal<{
    needsPolyfill: boolean;
    userAgent: string;
    capabilities: StreamCapability[];
    safariVersion?: string;
    isLegacySafari?: boolean;
  } | null>(null);

  detectCapabilities(): void {
    const userAgent = navigator.userAgent;
    const capabilities = this.checkCapabilities();
    const needsPoly = needsPolyfill();
    const safariVer = this.extractSafariVersion(userAgent);
    const isLegacy = this.checkLegacySafari(userAgent);

    this.detectionResult.set({
      needsPolyfill: needsPoly,
      userAgent,
      capabilities,
      safariVersion: safariVer,
      isLegacySafari: isLegacy,
    });

    this.log.log(
      'Streams',
      `Detection: ${needsPoly ? 'Ponyfill needed' : 'Native streams OK'} (${userAgent.slice(0, 50)}...)`,
      needsPoly ? 'error' : 'success',
    );
  }

  simulateLegacySafari(): void {
    // Simulate Safari 17 user agent for testing
    const simulatedUA =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
    const needsPoly = needsPolyfill(simulatedUA);
    const isLegacy = this.checkLegacySafari(simulatedUA);
    const safariVer = this.extractSafariVersion(simulatedUA);

    this.detectionResult.set({
      needsPolyfill: needsPoly,
      userAgent: simulatedUA,
      capabilities: [
        { name: 'ReadableStream', supported: true },
        { name: 'TransformStream', supported: true },
        { name: 'Transferable', supported: false, details: 'Not transferable in Safari 16-17' },
      ],
      safariVersion: safariVer,
      isLegacySafari: isLegacy,
    });

    this.log.log(
      'Streams',
      `Simulated Safari 17: ${needsPoly ? 'needs ponyfill' : 'native OK'}`,
      'info',
    );
  }

  private checkLegacySafari(userAgent: string): boolean {
    const isSafari =
      /Safari/.test(userAgent) && !/Chrome/.test(userAgent) && !/Chromium/.test(userAgent);
    if (!isSafari) return false;
    const match = /Version\/(\d+)/.exec(userAgent);
    if (!match) return false;
    return Number.parseInt(match[1], 10) < 18;
  }

  private checkCapabilities(): StreamCapability[] {
    const capabilities: StreamCapability[] = [
      {
        name: 'ReadableStream',
        supported: typeof ReadableStream !== 'undefined',
      },
      {
        name: 'TransformStream',
        supported: typeof TransformStream !== 'undefined',
      },
      {
        name: 'WritableStream',
        supported: typeof WritableStream !== 'undefined',
      },
    ];

    // Test actual transferable support
    try {
      const rs = new ReadableStream({
        start(controller) {
          controller.close();
        },
      });
      const channel = new MessageChannel();
      channel.port1.postMessage(rs, [rs as unknown as Transferable]);
      channel.port1.close();
      channel.port2.close();
      capabilities.push({ name: 'Transferable', supported: true });
    } catch {
      capabilities.push({
        name: 'Transferable',
        supported: false,
        details: 'Streams not transferable (Safari 16-17)',
      });
    }

    return capabilities;
  }

  private extractSafariVersion(ua: string): string | undefined {
    const match = /Version\/(\d+)/.exec(ua);
    return match?.[1];
  }
}
