import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

interface NavSection {
  label: string;
  items: NavItem[];
}

interface NavItem {
  label: string;
  route: string;
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'browser-web-apis',
    items: [
      { label: 'Overview', route: '/docs/browser-web-apis' },
      { label: 'BatteryService', route: '/docs/browser-web-apis/battery' },
      { label: 'BrowserCapabilityService', route: '/docs/browser-web-apis/browser-capability' },
      { label: 'CameraService', route: '/docs/browser-web-apis/camera' },
      { label: 'ClipboardService', route: '/docs/browser-web-apis/clipboard' },
      { label: 'GeolocationService', route: '/docs/browser-web-apis/geolocation' },
      { label: 'MediaDevicesService', route: '/docs/browser-web-apis/media-devices' },
      { label: 'NotificationService', route: '/docs/browser-web-apis/notification' },
      { label: 'PermissionsService', route: '/docs/browser-web-apis/permissions' },
      { label: 'RegexSecurityService', route: '/docs/browser-web-apis/regex-security' },
      { label: 'WebShareService', route: '/docs/browser-web-apis/web-share' },
      { label: 'WebSocketService', route: '/docs/browser-web-apis/web-socket' },
      { label: 'WebStorageService', route: '/docs/browser-web-apis/web-storage' },
      { label: 'WebWorkerService', route: '/docs/browser-web-apis/web-worker' },
    ],
  },
  {
    label: 'security',
    items: [
      { label: 'Overview', route: '/docs/security' },
      { label: 'RegexSecurityService', route: '/docs/security/regex-security' },
      { label: 'RegexSecurityBuilder', route: '/docs/security/regex-security-builder' },
    ],
  },
];

@Component({
  selector: 'app-docs-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './docs-layout.component.html',
  styleUrl: './docs-layout.component.css',
})
export class DocsLayoutComponent {
  protected readonly navSections = NAV_SECTIONS;
  protected sidebarOpen = signal(false);

  protected toggleSidebar() {
    this.sidebarOpen.update((v) => !v);
  }

  protected closeSidebar() {
    this.sidebarOpen.set(false);
  }
}
