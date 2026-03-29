import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

interface NavSection {
  label: string;
  overviewRoute: string;
  servicesLabel: string;
  serviceItems: NavItem[];
}

interface NavItem {
  label: string;
  route: string;
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'browser-web-apis',
    overviewRoute: '/docs/browser-web-apis',
    servicesLabel: 'Services',
    serviceItems: [
      { label: 'BatteryService', route: '/docs/browser-web-apis/battery' },
      { label: 'BrowserCapabilityService', route: '/docs/browser-web-apis/browser-capability' },
      { label: 'BroadcastChannelService', route: '/docs/browser-web-apis/broadcast-channel' },
      { label: 'CameraService', route: '/docs/browser-web-apis/camera' },
      { label: 'ClipboardService', route: '/docs/browser-web-apis/clipboard' },
      { label: 'FileSystemAccessService', route: '/docs/browser-web-apis/file-system-access' },
      { label: 'FullscreenService', route: '/docs/browser-web-apis/fullscreen' },
      { label: 'GeolocationService', route: '/docs/browser-web-apis/geolocation' },
      {
        label: 'IntersectionObserverService',
        route: '/docs/browser-web-apis/intersection-observer',
      },
      { label: 'MediaDevicesService', route: '/docs/browser-web-apis/media-devices' },
      { label: 'MediaRecorderService', route: '/docs/browser-web-apis/media-recorder' },
      { label: 'NetworkInformationService', route: '/docs/browser-web-apis/network-information' },
      { label: 'NotificationService', route: '/docs/browser-web-apis/notification' },
      { label: 'PageVisibilityService', route: '/docs/browser-web-apis/page-visibility' },
      { label: 'PermissionsService', route: '/docs/browser-web-apis/permissions' },
      { label: 'ResizeObserverService', route: '/docs/browser-web-apis/resize-observer' },
      { label: 'ScreenOrientationService', route: '/docs/browser-web-apis/screen-orientation' },
      { label: 'ScreenWakeLockService', route: '/docs/browser-web-apis/screen-wake-lock' },
      { label: 'ServerSentEventsService', route: '/docs/browser-web-apis/server-sent-events' },
      { label: 'SpeechSynthesisService', route: '/docs/browser-web-apis/speech-synthesis' },
      { label: 'VibrationService', route: '/docs/browser-web-apis/vibration' },
      { label: 'WebShareService', route: '/docs/browser-web-apis/web-share' },
      { label: 'WebSocketService', route: '/docs/browser-web-apis/web-socket' },
      { label: 'WebStorageService', route: '/docs/browser-web-apis/web-storage' },
      { label: 'WebWorkerService', route: '/docs/browser-web-apis/web-worker' },
    ],
  },
  {
    label: 'security',
    overviewRoute: '/docs/security',
    servicesLabel: 'Services',
    serviceItems: [
      { label: 'RegexSecurityBuilder', route: '/docs/security/regex-security-builder' },
      { label: 'RegexSecurityService', route: '/docs/security/regex-security' },
      { label: 'WebCryptoService', route: '/docs/security/web-crypto' },
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

  private expandedSections = signal<Set<string>>(new Set(NAV_SECTIONS.map((s) => s.label)));

  protected isSectionExpanded(label: string): boolean {
    return this.expandedSections().has(label);
  }

  protected toggleSection(label: string): void {
    this.expandedSections.update((set) => {
      const next = new Set(set);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  }

  protected toggleSidebar() {
    this.sidebarOpen.update((v) => !v);
  }

  protected closeSidebar() {
    this.sidebarOpen.set(false);
  }
}
