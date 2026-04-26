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
    <div class="bg-base-200 border border-base-300 rounded-xl p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-bold text-base-content m-0 flex items-center gap-2">
          🌊 Streams Polyfill
        </h2>
        <span class="badge badge-info">Safari Support</span>
      </div>
      <p class="text-sm text-base-content/80 mb-4">
        Detects Safari 16-17 transferable streams limitation and provides ponyfill when needed
      </p>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <button type="button" (click)="detectCapabilities()" class="btn btn-primary btn-sm">
          Detect Capabilities
        </button>
        <button type="button" (click)="simulateLegacySafari()" class="btn btn-secondary btn-sm">
          Simulate Safari 17
        </button>
      </div>

      @if (detectionResult()) {
        <div class="space-y-3">
          <!-- Polyfill Needed -->
          <div
            class="p-3 rounded-lg border-l-4"
            [class.bg-success/10]="!detectionResult()?.needsPolyfill"
            [class.border-success]="!detectionResult()?.needsPolyfill"
            [class.bg-warning/10]="detectionResult()?.needsPolyfill"
            [class.border-warning]="detectionResult()?.needsPolyfill"
          >
            <div class="flex items-center justify-between">
              <span class="font-semibold text-sm">Polyfill Required</span>
              <span
                class="badge badge-sm"
                [class.badge-success]="!detectionResult()?.needsPolyfill"
                [class.badge-warning]="detectionResult()?.needsPolyfill"
              >
                {{ detectionResult()?.needsPolyfill ? 'Yes' : 'No' }}
              </span>
            </div>
            <p class="text-xs text-base-content/70 mt-1">
              {{
                detectionResult()?.needsPolyfill
                  ? 'Safari 16-17 detected — ponyfill needed'
                  : 'Native transferable streams supported'
              }}
            </p>
          </div>

          <!-- User Agent -->
          <div class="p-3 bg-base-300 rounded-lg">
            <span class="text-xs font-semibold text-base-content/60 uppercase">User Agent</span>
            <p class="text-xs font-mono break-all mt-1">{{ detectionResult()?.userAgent }}</p>
          </div>

          <!-- Capabilities Grid -->
          <div class="grid grid-cols-2 gap-2">
            @for (cap of detectionResult()?.capabilities; track cap.name) {
              <div
                class="p-2 rounded-lg text-xs flex items-center justify-between"
                [class.bg-success/10]="cap.supported"
                [class.bg-error/10]="!cap.supported"
              >
                <span>{{ cap.name }}</span>
                <span
                  class="badge badge-xs"
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
            <div class="p-2 bg-info/10 rounded-lg text-xs">
              <span class="font-semibold">Safari Version:</span>
              {{ detectionResult()?.safariVersion }}
              @if (detectionResult()?.isLegacySafari) {
                <span class="badge badge-warning badge-xs ml-2">Legacy (&lt; 18)</span>
              }
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
