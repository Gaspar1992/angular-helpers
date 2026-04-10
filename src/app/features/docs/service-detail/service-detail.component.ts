import { Component, signal, ChangeDetectionStrategy, Type, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { NgComponentOutlet } from '@angular/common';
import { CodeBlockComponent } from '../../../ui/code-block/code-block.component';
import { DocsPageHeaderComponent } from '../../../ui/page-header/docs-page-header.component';
import { DocsApiTableComponent } from '../../../ui/api-table/docs-api-table.component';
import { DocsTabsComponent, type DocTab } from '../../../ui/tabs/docs-tabs.component';
import { PageVisibilityDemoComponent } from '../../../demo/services/page-visibility/page-visibility-demo.component';
import { NetworkInformationDemoComponent } from '../../../demo/services/network-information/network-information-demo.component';
import { ResizeObserverDemoComponent } from '../../../demo/services/resize-observer/resize-observer-demo.component';
import { IntersectionObserverDemoComponent } from '../../../demo/services/intersection-observer/intersection-observer-demo.component';
import { CameraDemoComponent } from '../../../demo/services/camera/camera-demo.component';
import { MediaDevicesDemoComponent } from '../../../demo/services/media-devices/media-devices-demo.component';
import { MediaRecorderDemoComponent } from '../../../demo/services/media-recorder/media-recorder-demo.component';
import { SpeechSynthesisDemoComponent } from '../../../demo/services/speech-synthesis/speech-synthesis-demo.component';
import { ScreenWakeLockDemoComponent } from '../../../demo/services/screen-wake-lock/screen-wake-lock-demo.component';
import { ScreenOrientationDemoComponent } from '../../../demo/services/screen-orientation/screen-orientation-demo.component';
import { FullscreenDemoComponent } from '../../../demo/services/fullscreen/fullscreen-demo.component';
import { VibrationDemoComponent } from '../../../demo/services/vibration/vibration-demo.component';
import { ClipboardDemoComponent } from '../../../demo/services/clipboard/clipboard-demo.component';
import { FileSystemAccessDemoComponent } from '../../../demo/services/file-system-access/file-system-access-demo.component';
import { BroadcastChannelDemoComponent } from '../../../demo/services/broadcast-channel/broadcast-channel-demo.component';
import { ServerSentEventsDemoComponent } from '../../../demo/services/server-sent-events/server-sent-events-demo.component';
import { GeolocationDemoComponent } from '../../../demo/services/geolocation/geolocation-demo.component';
import { NotificationDemoComponent } from '../../../demo/services/notification/notification-demo.component';
import { ApiRow, METHODS_COLUMNS, FN_FIELDS_COLUMNS } from '../../../docs/models/doc-meta.model';
import { ServiceDetailConfig } from '../unified-service-detail/unified-service-detail.component';
import { CONTENT_TABS_WITH_DEMO } from '../base/detail-page-base.component';

const SERVICE_DEMO_MAP: Record<string, Type<unknown>> = {
  'broadcast-channel': BroadcastChannelDemoComponent,
  camera: CameraDemoComponent,
  clipboard: ClipboardDemoComponent,
  'file-system-access': FileSystemAccessDemoComponent,
  fullscreen: FullscreenDemoComponent,
  geolocation: GeolocationDemoComponent,
  'intersection-observer': IntersectionObserverDemoComponent,
  'media-devices': MediaDevicesDemoComponent,
  'media-recorder': MediaRecorderDemoComponent,
  'network-information': NetworkInformationDemoComponent,
  notification: NotificationDemoComponent,
  'page-visibility': PageVisibilityDemoComponent,
  'resize-observer': ResizeObserverDemoComponent,
  'screen-orientation': ScreenOrientationDemoComponent,
  'screen-wake-lock': ScreenWakeLockDemoComponent,
  'server-sent-events': ServerSentEventsDemoComponent,
  'speech-synthesis': SpeechSynthesisDemoComponent,
  vibration: VibrationDemoComponent,
};

@Component({
  selector: 'app-service-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    NgComponentOutlet,
    DocsPageHeaderComponent,
    DocsApiTableComponent,
    CodeBlockComponent,
    DocsTabsComponent,
  ],
  templateUrl: './service-detail.component.html',
  styles: [
    `
      .not-found {
        padding-top: var(--sp-8);
      }
      .not-found a {
        color: var(--accent);
        text-decoration: none;
        font-size: 0.9rem;
      }
      .not-found a:hover {
        text-decoration: underline;
      }
      .api-variant-group {
        display: inline-flex;
        border: 1px solid var(--border, #e2e8f0);
        border-radius: 8px;
        overflow: hidden;
        margin-bottom: var(--sp-4, 1rem);
      }
      .api-variant-btn {
        padding: 6px 18px;
        font-size: 0.85rem;
        font-weight: 500;
        background: transparent;
        border: none;
        border-right: 1px solid var(--border, #e2e8f0);
        color: var(--text-muted, #64748b);
        cursor: pointer;
        transition:
          background 0.15s,
          color 0.15s;
        line-height: 1.5;
      }
      .api-variant-btn:last-child {
        border-right: none;
      }
      .api-variant-btn--active {
        background: var(--accent, #6366f1);
        color: #fff;
      }
      .api-variant-btn:not(.api-variant-btn--active):hover {
        background: var(--surface-hover, #f1f5f9);
        color: var(--text, #1e293b);
      }
      .fn-description {
        padding-top: 0;
      }
      .fn-return-type {
        display: inline-block;
        font-size: 0.85rem;
        color: var(--text-muted, #64748b);
        margin-top: 6px;
      }
      .fn-return-type strong {
        color: var(--accent, #6366f1);
        font-family: var(--font-mono, monospace);
      }
    `,
  ],
})
export class ServiceDetailComponent {
  private route = inject(ActivatedRoute);

  protected readonly contentTabs: DocTab[] = CONTENT_TABS_WITH_DEMO;
  protected activeTab = signal<string>('api');
  protected apiVariant = signal<'service' | 'fn'>('service');

  // Resolved data from route
  protected resolved = toSignal(
    this.route.data.pipe(map((d) => d['config'] as ServiceDetailConfig)),
    { initialValue: null },
  );

  // Expose for template
  protected get service() {
    return this.resolved()?.service;
  }

  protected get serviceId() {
    return this.route.snapshot.paramMap.get('service') ?? '';
  }

  protected get breadcrumbs() {
    const r = this.resolved();
    return [
      { label: 'Docs', route: '/docs' },
      { label: r?.backLabel ?? '', route: r?.backRoute ?? '' },
      { label: r?.service?.name ?? '' },
    ];
  }

  protected get badge() {
    const item = this.service;
    if (!item) return '';
    if (this.apiVariant() === 'fn' && item.fnVersion) {
      return `import { ${item.fnVersion.name} } from '${item.fnVersion.importPath}'`;
    }
    return `import { ${item.name} } from '${item.importPath}'`;
  }

  protected currentColumns() {
    const s = this.service;
    if (s?.fnVersion && this.apiVariant() === 'fn') return FN_FIELDS_COLUMNS;
    return METHODS_COLUMNS;
  }

  protected methodRows(): ApiRow[] {
    const s = this.service;
    if (!s) return [];
    if (this.apiVariant() === 'fn' && s.fnVersion) {
      return s.fnVersion.fields as unknown as ApiRow[];
    }
    return s.methods as unknown as ApiRow[];
  }

  protected currentExample() {
    const s = this.service;
    if (!s) return '';
    if (this.apiVariant() === 'fn' && s.fnVersion) return s.fnVersion.example;
    return s.example;
  }

  protected get demoComponent(): Type<unknown> | null {
    return SERVICE_DEMO_MAP[this.serviceId] ?? null;
  }
}
