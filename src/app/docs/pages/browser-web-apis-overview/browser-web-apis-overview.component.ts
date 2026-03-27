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
    <div class="overview">
      <div class="page-header">
        <div class="breadcrumb" aria-label="Breadcrumb">
          <a routerLink="/docs">Docs</a>
          <span aria-hidden="true">›</span>
          <span>browser-web-apis</span>
        </div>
        <h1>browser-web-apis</h1>
        <code class="npm-badge">&#64;angular-helpers/browser-web-apis</code>
        <p class="page-lead">
          Angular services for structured, secure, and reactive access to Browser Web APIs. All
          services are tree-shakable, lifecycle-safe, and built with signals and OnPush change
          detection.
        </p>
      </div>

      <section class="section">
        <h2>Installation</h2>
        <app-code-block language="bash" [code]="'npm install @angular-helpers/browser-web-apis'" />
      </section>

      <section class="section">
        <h2>Setup</h2>
        <p>Register the providers once in your application bootstrap:</p>
        <app-code-block [code]="providerExample" />
      </section>

      <section class="section">
        <h2>Services</h2>
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
      .overview {
        padding-bottom: 3rem;
      }

      .page-header {
        margin-bottom: 2.5rem;
      }

      .breadcrumb {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.82rem;
        color: #7a84a0;
        margin-bottom: 1rem;
      }

      .breadcrumb a {
        color: #6b8cf2;
        text-decoration: none;
      }

      .breadcrumb a:hover {
        text-decoration: underline;
      }

      h1 {
        font-size: 1.9rem;
        font-weight: 800;
        color: #fff;
        margin: 0 0 0.5rem;
        letter-spacing: -0.03em;
      }

      .npm-badge {
        display: inline-block;
        font-size: 0.82rem;
        color: #6b8cf2;
        background: rgba(107, 140, 242, 0.12);
        padding: 0.2rem 0.55rem;
        border-radius: 4px;
        margin-bottom: 1rem;
        font-family: 'Fira Code', monospace;
      }

      .page-lead {
        color: #909ab8;
        font-size: 1rem;
        line-height: 1.7;
        max-width: 650px;
        margin: 0.75rem 0 0;
      }

      .section {
        margin-bottom: 2.5rem;
      }

      h2 {
        font-size: 1.25rem;
        font-weight: 700;
        color: #fff;
        margin: 0 0 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.07);
      }

      .section p {
        color: #909ab8;
        margin: 0 0 1rem;
      }

      .service-group {
        margin-bottom: 1.75rem;
      }

      h3.group-label {
        font-size: 0.88rem;
        font-weight: 700;
        color: #7a84a0;
        text-transform: uppercase;
        letter-spacing: 0.07em;
        margin: 0 0 0.75rem;
      }

      .services-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 0.6rem;
      }

      .service-card {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        padding: 0.75rem 1rem;
        background: #1a1c28;
        border: 1px solid rgba(255, 255, 255, 0.07);
        border-radius: 8px;
        text-decoration: none;
        transition: border-color 0.15s, background 0.15s;
      }

      .service-card:hover {
        border-color: #6b8cf2;
        background: rgba(107, 140, 242, 0.07);
      }

      .service-card:focus-visible {
        outline: 2px solid #6b8cf2;
        outline-offset: 2px;
      }

      .svc-name {
        font-size: 0.88rem;
        font-weight: 600;
        color: #c0c8e0;
        font-family: 'Fira Code', monospace;
      }

      .svc-desc {
        font-size: 0.8rem;
        color: #7a84a0;
      }
    `,
  ],
})
export class BrowserWebApisOverviewComponent {
  protected readonly providerExample = PROVIDER_EXAMPLE;
  protected readonly serviceGroups = SERVICE_GROUPS;
}
