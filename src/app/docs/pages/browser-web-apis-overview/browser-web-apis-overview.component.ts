import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CodeBlockComponent } from '../../shared/code-block/code-block.component';

const PROVIDER_EXAMPLE = `import { provideBrowserWebApis } from '@angular-helpers/browser-web-apis';

bootstrapApplication(AppComponent, {
  providers: [
    provideBrowserWebApis({
      enableCamera: true,
      enableGeolocation: true,
      enableRegexSecurity: true,
      enableWebStorage: true,
      enableWebSocket: true,
      enableWebWorker: true,
      enableWebShare: true,
      enableBattery: true,
      enableMediaDevices: true,
      enableNotifications: true,
      enableClipboard: true,
    }),
  ],
});`;

const SERVICE_GROUPS = [
  {
    label: 'Media & Device',
    icon: '📷',
    items: [
      { id: 'camera', name: 'CameraService', description: 'Camera stream access and photo capture' },
      { id: 'media-devices', name: 'MediaDevicesService', description: 'Enumerate cameras, mics, speakers' },
      { id: 'geolocation', name: 'GeolocationService', description: 'One-time and continuous location tracking' },
      { id: 'notification', name: 'NotificationService', description: 'Browser push notifications' },
    ],
  },
  {
    label: 'Web APIs',
    icon: '🌐',
    items: [
      { id: 'web-worker', name: 'WebWorkerService', description: 'Web Worker lifecycle management' },
      { id: 'web-socket', name: 'WebSocketService', description: 'WebSocket with reconnection + heartbeat' },
      { id: 'web-storage', name: 'WebStorageService', description: 'localStorage/sessionStorage with reactivity' },
      { id: 'web-share', name: 'WebShareService', description: 'Native device share sheet' },
      { id: 'clipboard', name: 'ClipboardService', description: 'System clipboard read/write' },
      { id: 'battery', name: 'BatteryService', description: 'Battery level and charging status' },
    ],
  },
  {
    label: 'Security & Permissions',
    icon: '🔐',
    items: [
      {
        id: 'regex-security',
        name: 'RegexSecurityService',
        description: 'ReDoS prevention via Web Worker execution',
      },
      { id: 'permissions', name: 'PermissionsService', description: 'Centralized permission queries' },
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
  imports: [RouterLink, CodeBlockComponent],
  template: `
    <div class="docs-page">
      <div class="docs-page-header">
        <nav class="docs-breadcrumb" aria-label="Breadcrumb">
          <a routerLink="/docs">Docs</a>
          <span aria-hidden="true">›</span>
          <span>browser-web-apis</span>
        </nav>
        <h1 class="docs-page-title">browser-web-apis</h1>
        <code class="docs-badge docs-badge--npm">&#64;angular-helpers/browser-web-apis</code>
        <p class="docs-page-lead">
          Angular services for structured, secure, and reactive access to Browser Web APIs. All
          services are tree-shakable, lifecycle-safe, and built with signals and OnPush change
          detection.
        </p>
      </div>

      <section class="docs-section">
        <h2 class="docs-section-title">Installation</h2>
        <app-code-block language="bash" [code]="'npm install @angular-helpers/browser-web-apis'" />
      </section>

      <section class="docs-section">
        <h2 class="docs-section-title">Setup</h2>
        <p class="docs-section-text">Register the providers once in your application bootstrap:</p>
        <app-code-block [code]="providerExample" />
      </section>

      <section class="docs-section">
        <h2 class="docs-section-title">Services</h2>
        @for (group of serviceGroups; track group.label) {
          <div class="service-group">
            <h3 class="group-label">{{ group.icon }} {{ group.label }}</h3>
            <div class="services-list">
              @for (svc of group.items; track svc.id) {
                <a
                  [routerLink]="'/docs/browser-web-apis/' + svc.id"
                  class="service-card"
                >
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
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: var(--sp-2);
      }

      .service-card {
        display: flex;
        flex-direction: column;
        gap: var(--sp-1);
        padding: var(--sp-3) var(--sp-4);
        background: var(--bg-surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        text-decoration: none;
        transition: border-color var(--transition), background var(--transition);
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
  protected readonly providerExample = PROVIDER_EXAMPLE;
  protected readonly serviceGroups = SERVICE_GROUPS;
}
