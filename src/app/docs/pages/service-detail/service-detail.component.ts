import { Component, inject, computed, signal, ChangeDetectionStrategy, Type } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { NgComponentOutlet } from '@angular/common';
import { CodeBlockComponent } from '../../shared/code-block/code-block.component';
import { DocsPageHeaderComponent } from '../../shared/page-header/docs-page-header.component';
import { DocsApiTableComponent } from '../../shared/api-table/docs-api-table.component';
import { DocsTabsComponent, type DocTab } from '../../shared/tabs/docs-tabs.component';
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
import { BROWSER_WEB_APIS_SERVICES } from '../../data/browser-web-apis.data';
import { ServiceDoc, BreadcrumbItem, ApiRow, METHODS_COLUMNS } from '../../models/doc-meta.model';

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

const CONTENT_TABS: DocTab[] = [
  { id: 'api', label: 'API Reference' },
  { id: 'example', label: 'Example' },
  { id: 'demo', label: 'Demo' },
];

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
  template: `
    @if (service()) {
      <div class="docs-page">
        <app-docs-page-header
          [breadcrumbs]="breadcrumbs()"
          [title]="service()!.name"
          [titleMono]="true"
          [badge]="badge()"
          badgeVariant="import"
          [lead]="service()!.description"
          [scope]="service()!.scope"
          [requiresSecureContext]="service()!.requiresSecureContext"
        />

        <section class="docs-section">
          <h2 class="docs-section-title">Browser support</h2>
          <p class="docs-support-text">{{ service()!.browserSupport }}</p>
        </section>

        @if (service()!.notes.length) {
          <section class="docs-section">
            <h2 class="docs-section-title">Notes</h2>
            <ul class="docs-note-list">
              @for (note of service()!.notes; track $index) {
                <li>{{ note }}</li>
              }
            </ul>
          </section>
        }

        <section class="docs-section">
          <app-docs-tabs
            [tabs]="contentTabs"
            [activeTab]="activeTab()"
            ariaLabel="Service documentation"
            (tabChange)="activeTab.set($event)"
          />
          <div
            role="tabpanel"
            [id]="'panel-' + activeTab()"
            [attr.aria-labelledby]="'tab-' + activeTab()"
          >
            @if (activeTab() === 'api') {
              <app-docs-api-table
                [columns]="methodsColumns"
                [rows]="methodRows()"
                ariaLabel="API methods"
              />
            }
            @if (activeTab() === 'example') {
              <app-code-block [code]="service()!.example" />
            }
            @if (activeTab() === 'demo') {
              @if (demoComponent()) {
                <ng-container *ngComponentOutlet="demoComponent()!" />
              } @else {
                <p class="docs-support-text">No interactive demo available for this service yet.</p>
              }
            }
          </div>
        </section>
      </div>
    } @else {
      <div class="not-found">
        <h1 class="docs-page-title">Service not found</h1>
        <p class="docs-page-lead" style="max-width: none">
          The requested service does not exist in this package.
        </p>
        <a routerLink="/docs/browser-web-apis">← Back to browser-web-apis</a>
      </div>
    }
  `,
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
    `,
  ],
})
export class ServiceDetailComponent {
  private route = inject(ActivatedRoute);

  protected readonly methodsColumns = METHODS_COLUMNS;
  protected readonly contentTabs = CONTENT_TABS;
  protected activeTab = signal<string>('api');

  private serviceId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('service') ?? '')),
    { initialValue: '' },
  );

  protected service = computed<ServiceDoc | undefined>(() =>
    BROWSER_WEB_APIS_SERVICES.find((s) => s.id === this.serviceId()),
  );

  protected breadcrumbs = computed<BreadcrumbItem[]>(() => [
    { label: 'Docs', route: '/docs' },
    { label: 'browser-web-apis', route: '/docs/browser-web-apis' },
    { label: this.service()?.name ?? '' },
  ]);

  protected badge = computed(() => {
    const s = this.service();
    return s ? `import { ${s.name} } from '${s.importPath}'` : '';
  });

  protected methodRows = computed<ApiRow[]>(
    () => (this.service()?.methods ?? []) as unknown as ApiRow[],
  );

  protected demoComponent = computed<Type<unknown> | null>(
    () => SERVICE_DEMO_MAP[this.serviceId()] ?? null,
  );
}
