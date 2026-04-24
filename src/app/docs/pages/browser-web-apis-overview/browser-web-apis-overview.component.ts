import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CodeBlockComponent } from '../../shared/code-block/code-block.component';
import { DocsPageHeaderComponent } from '../../shared/page-header/docs-page-header.component';
import { BreadcrumbItem } from '../../models/doc-meta.model';

const PROVIDER_ALL_IN_ONE = `import { provideBrowserWebApis } from '@angular-helpers/browser-web-apis';
import {
  CameraService, GeolocationService, WebStorageService,
  WebSocketService, WebWorkerService
} from '@angular-helpers/browser-web-apis';

bootstrapApplication(AppComponent, {
  providers: [
    provideBrowserWebApis({
      services: [
        CameraService,
        GeolocationService,
        WebStorageService,
        WebSocketService,
        WebWorkerService,
        // ...add more as needed
      ],
    }),
  ],
});`;

const PROVIDER_GRANULAR = `import {
  provideCamera,
  provideGeolocation,
  provideWebStorage,
} from '@angular-helpers/browser-web-apis';

bootstrapApplication(AppComponent, {
  providers: [
    provideCamera(),       // → only CameraService + PermissionsService
    provideGeolocation(),  // → only GeolocationService + PermissionsService
    provideWebStorage(),   // → only WebStorageService
  ],
});`;

const CONFIG_TOKENS_EXAMPLE = `import {
  provideBrowserApiLogLevel,
  BROWSER_API_EXPERIMENTAL_SILENT,
} from '@angular-helpers/browser-web-apis';

bootstrapApplication(AppComponent, {
  providers: [
    // Control logging verbosity: 'debug' | 'info' | 'warn' | 'error' | 'silent'
    provideBrowserApiLogLevel('warn'),

    // Suppress experimental API warnings
    { provide: BROWSER_API_EXPERIMENTAL_SILENT, useValue: true },
  ],
});`;

const SERVICE_GROUPS = [
  {
    label: 'Media & Device',
    icon: '📷',
    items: [
      {
        id: 'camera',
        name: 'CameraService',
        description: 'Camera stream access and photo capture',
      },
      {
        id: 'media-devices',
        name: 'MediaDevicesService',
        description: 'Enumerate cameras, mics, speakers',
      },
      {
        id: 'media-recorder',
        name: 'MediaRecorderService',
        description: 'Record audio/video from MediaStream',
      },
      {
        id: 'geolocation',
        name: 'GeolocationService',
        description: 'One-time and continuous location tracking',
      },
      {
        id: 'notification',
        name: 'NotificationService',
        description: 'Browser push notifications',
      },
    ],
  },
  {
    label: 'Observer APIs',
    icon: '👁',
    items: [
      {
        id: 'intersection-observer',
        name: 'IntersectionObserverService',
        description: 'Detect when elements enter/exit viewport',
      },
      {
        id: 'resize-observer',
        name: 'ResizeObserverService',
        description: 'Watch for element size changes',
      },
      {
        id: 'mutation-observer',
        name: 'MutationObserverService',
        description: 'Watch for DOM mutations',
      },
      {
        id: 'performance-observer',
        name: 'PerformanceObserverService',
        description: 'Monitor LCP, CLS, navigation metrics',
      },
    ],
  },
  {
    label: 'System APIs',
    icon: '🖥',
    items: [
      {
        id: 'page-visibility',
        name: 'PageVisibilityService',
        description: 'Track document visibility state',
      },
      {
        id: 'screen-wake-lock',
        name: 'ScreenWakeLockService',
        description: 'Prevent screen from dimming or locking',
      },
      {
        id: 'screen-orientation',
        name: 'ScreenOrientationService',
        description: 'Read and lock screen orientation',
      },
      {
        id: 'fullscreen',
        name: 'FullscreenService',
        description: 'Toggle fullscreen mode for elements',
      },
      {
        id: 'vibration',
        name: 'VibrationService',
        description: 'Trigger haptic feedback patterns',
      },
      {
        id: 'speech-synthesis',
        name: 'SpeechSynthesisService',
        description: 'Text-to-speech with voice selection',
      },
      {
        id: 'gamepad',
        name: 'GamepadService',
        description: 'Game controller input polling',
      },
      {
        id: 'web-audio',
        name: 'WebAudioService',
        description: 'Audio context, oscillators, analysers',
      },
      {
        id: 'web-locks',
        name: 'WebLocksService',
        description: 'Cross-tab resource locking coordination',
      },
    ],
  },
  {
    label: 'Network APIs',
    icon: '🌐',
    items: [
      {
        id: 'web-socket',
        name: 'WebSocketService',
        description: 'WebSocket with reconnection + heartbeat',
      },
      {
        id: 'server-sent-events',
        name: 'ServerSentEventsService',
        description: 'Server-Sent Events client',
      },
      {
        id: 'broadcast-channel',
        name: 'BroadcastChannelService',
        description: 'Inter-tab communication',
      },
      {
        id: 'network-information',
        name: 'NetworkInformationService',
        description: 'Connection info and online status',
      },
    ],
  },
  {
    label: 'Storage & I/O',
    icon: '💾',
    items: [
      {
        id: 'web-storage',
        name: 'WebStorageService',
        description: 'localStorage/sessionStorage with reactivity',
      },
      { id: 'web-share', name: 'WebShareService', description: 'Native device share sheet' },
      { id: 'clipboard', name: 'ClipboardService', description: 'System clipboard read/write' },
      { id: 'battery', name: 'BatteryService', description: 'Battery level and charging status' },
      {
        id: 'file-system-access',
        name: 'FileSystemAccessService',
        description: 'Open/save files via native picker',
      },
      {
        id: 'storage-manager',
        name: 'StorageManagerService',
        description: 'Storage quotas and persistence',
      },
      {
        id: 'compression',
        name: 'CompressionService',
        description: 'Gzip/deflate compression streams',
      },
    ],
  },
  {
    label: 'Web Worker & Compute',
    icon: '⚙',
    items: [
      {
        id: 'web-worker',
        name: 'WebWorkerService',
        description: 'Web Worker lifecycle management',
      },
    ],
  },
  {
    label: 'Experimental APIs',
    icon: '🧪',
    items: [
      {
        id: 'idle-detector',
        name: 'IdleDetectorService',
        description: 'Detect user idle state and screen lock',
        experimental: true,
      },
      {
        id: 'eye-dropper',
        name: 'EyeDropperService',
        description: 'Screen color picker',
        experimental: true,
      },
      {
        id: 'barcode-detector',
        name: 'BarcodeDetectorService',
        description: 'QR code and barcode scanning',
        experimental: true,
      },
      {
        id: 'web-bluetooth',
        name: 'WebBluetoothService',
        description: 'Bluetooth Low Energy communication',
        experimental: true,
      },
      {
        id: 'web-usb',
        name: 'WebUsbService',
        description: 'USB device I/O from the browser',
        experimental: true,
      },
      {
        id: 'web-nfc',
        name: 'WebNfcService',
        description: 'NFC tag reading and writing',
        experimental: true,
      },
      {
        id: 'payment-request',
        name: 'PaymentRequestService',
        description: 'Native payment flows',
        experimental: true,
      },
      {
        id: 'credential-management',
        name: 'CredentialManagementService',
        description: 'Passwords, passkeys (WebAuthn)',
        experimental: true,
      },
    ],
  },
  {
    label: 'Security & Permissions',
    icon: '🔐',
    items: [
      {
        id: 'permissions',
        name: 'PermissionsService',
        description: 'Centralized permission queries',
      },
      {
        id: 'browser-capability',
        name: 'BrowserCapabilityService',
        description: 'Feature detection for browser APIs',
      },
    ],
  },
];

@Component({
  selector: 'app-browser-web-apis-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CodeBlockComponent, DocsPageHeaderComponent],
  template: `
    <div class="docs-page">
      <app-docs-page-header
        title="browser-web-apis"
        badge="@angular-helpers/browser-web-apis"
        badgeVariant="npm"
        lead="Angular services for structured, secure, and reactive access to Browser Web APIs. All services are tree-shakable, lifecycle-safe, and built with signals and OnPush change detection."
      />

      <section class="docs-section">
        <h2 class="docs-section-title">Installation</h2>
        <app-code-block language="bash" [code]="'npm install @angular-helpers/browser-web-apis'" />
      </section>

      <section class="docs-section">
        <h2 class="docs-section-title">Setup</h2>
        <p class="docs-section-text">
          <strong>All-in-one</strong> — register services via composition (recommended):
        </p>
        <app-code-block [code]="providerAllInOne" />
        <p class="docs-section-text" style="margin-top: var(--sp-4)">
          <strong>Granular (recommended for production)</strong> — each
          <code>provideX()</code> lives in its own module and imports only its service. Bundlers
          tree-shake everything you don't include:
        </p>
        <app-code-block [code]="providerGranular" />
      </section>

      <section class="docs-section">
        <h2 class="docs-section-title">Configuration Tokens</h2>
        <p class="docs-section-text">
          Control logging and experimental API warnings via injection tokens:
        </p>
        <app-code-block [code]="configTokensExample" />
      </section>

      <section class="docs-section">
        <h2 class="docs-section-title">Services</h2>
        @for (group of serviceGroups; track group.label) {
          <div class="service-group">
            <h3 class="group-label">{{ group.icon }} {{ group.label }}</h3>
            <div class="services-list">
              @for (svc of group.items; track svc.id) {
                <a [routerLink]="'/docs/browser-web-apis/' + svc.id" class="service-card">
                  <span class="svc-name">{{ svc.name }}</span>
                  <span class="svc-desc">{{ svc.description }}</span>
                </a>
              }
            </div>
          </div>
        }
      </section>
    </div>
  `,
  styles: [
    `
      .service-group {
        margin-bottom: var(--sp-6);
      }

      h3.group-label {
        font-size: 0.82rem;
        font-weight: 700;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.07em;
        margin: 0 0 var(--sp-3);
      }

      .services-list {
        display: grid;
        grid-template-columns: 1fr;
        gap: var(--sp-2);
      }

      @media (min-width: 480px) {
        .services-list {
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        }
      }

      .service-card {
        display: flex;
        flex-direction: column;
        gap: var(--sp-1);
        padding: var(--sp-3) var(--sp-4);
        background: var(--bg-surface);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
        text-decoration: none;
        transition:
          border-color var(--transition),
          background var(--transition);
      }

      .service-card:hover {
        border-color: var(--accent);
        background: var(--accent-hover);
      }

      .service-card:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 2px;
      }

      .svc-name {
        font-size: var(--text-base);
        font-weight: 600;
        color: #c0c8e0;
        font-family: var(--font-mono);
      }

      .svc-desc {
        font-size: var(--text-sm);
        color: var(--text-muted);
        line-height: 1.5;
      }
    `,
  ],
})
export class BrowserWebApisOverviewComponent {
  protected readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Docs', route: '/docs' },
    { label: 'browser-web-apis' },
  ];
  protected readonly providerAllInOne = PROVIDER_ALL_IN_ONE;
  protected readonly providerGranular = PROVIDER_GRANULAR;
  protected readonly configTokensExample = CONFIG_TOKENS_EXAMPLE;
  protected readonly serviceGroups = SERVICE_GROUPS;
}
