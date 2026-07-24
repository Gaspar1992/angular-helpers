import { Component, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageVisibilityDemoComponent } from '../services/page-visibility/page-visibility-demo.component';
import { NetworkInformationDemoComponent } from '../services/network-information/network-information-demo.component';
import { ResizeObserverDemoComponent } from '../services/resize-observer/resize-observer-demo.component';
import { IntersectionObserverDemoComponent } from '../services/intersection-observer/intersection-observer-demo.component';
import { CameraDemoComponent } from '../services/camera/camera-demo.component';
import { MediaDevicesDemoComponent } from '../services/media-devices/media-devices-demo.component';
import { MediaRecorderDemoComponent } from '../services/media-recorder/media-recorder-demo.component';
import { SpeechSynthesisDemoComponent } from '../services/speech-synthesis/speech-synthesis-demo.component';
import { ScreenWakeLockDemoComponent } from '../services/screen-wake-lock/screen-wake-lock-demo.component';
import { ScreenOrientationDemoComponent } from '../services/screen-orientation/screen-orientation-demo.component';
import { FullscreenDemoComponent } from '../services/fullscreen/fullscreen-demo.component';
import { VibrationDemoComponent } from '../services/vibration/vibration-demo.component';
import { ClipboardDemoComponent } from '../services/clipboard/clipboard-demo.component';
import { FileSystemAccessDemoComponent } from '../services/file-system-access/file-system-access-demo.component';
import { BroadcastChannelDemoComponent } from '../services/broadcast-channel/broadcast-channel-demo.component';
import { ServerSentEventsDemoComponent } from '../services/server-sent-events/server-sent-events-demo.component';
import { WebTransportDemoComponent } from '../services/web-transport/web-transport-demo.component';
import { GeolocationDemoComponent } from '../services/geolocation/geolocation-demo.component';
import { NotificationDemoComponent } from '../services/notification/notification-demo.component';
import { EyeDropperDemoComponent } from '../services/eye-dropper/eye-dropper-demo.component';
import { IdleDetectorDemoComponent } from '../services/idle-detector/idle-detector-demo.component';

export type DemoTab = 'observers' | 'media' | 'system' | 'storage' | 'realtime' | 'location';

@Component({
  selector: 'app-browser-apis',
  imports: [
    RouterLink,
    PageVisibilityDemoComponent,
    NetworkInformationDemoComponent,
    ResizeObserverDemoComponent,
    IntersectionObserverDemoComponent,
    CameraDemoComponent,
    MediaDevicesDemoComponent,
    MediaRecorderDemoComponent,
    SpeechSynthesisDemoComponent,
    ScreenWakeLockDemoComponent,
    ScreenOrientationDemoComponent,
    FullscreenDemoComponent,
    VibrationDemoComponent,
    ClipboardDemoComponent,
    FileSystemAccessDemoComponent,
    BroadcastChannelDemoComponent,
    ServerSentEventsDemoComponent,
    WebTransportDemoComponent,
    GeolocationDemoComponent,
    NotificationDemoComponent,
    EyeDropperDemoComponent,
    IdleDetectorDemoComponent,
  ],
  styleUrls: ['../services/demo.styles.css'],
  template: `
    <div
      class="max-width-container py-12 sm:py-20 animate-in fade-in duration-700"
      [class.demo-embedded]="embedded()"
    >
      @if (!embedded()) {
        <header class="mb-16 text-center sm:text-left">
          <div class="flex flex-wrap items-center justify-center sm:justify-start gap-5 mb-8">
            <div
              class="w-20 h-20 rounded-[2rem] bg-secondary/10 flex items-center justify-center text-5xl shadow-2xl border border-secondary/20 ring-1 ring-secondary/10"
            >
              🌐
            </div>
            <div>
              <h1 class="text-3xl sm:text-5xl font-black text-base-content m-0 tracking-tighter">
                Browser Web APIs
              </h1>
              <p class="text-lg text-base-content/50 m-0 mt-2 font-medium leading-relaxed">
                Interactive demonstrations of 18 native Web APIs powered by Angular signals.
              </p>
            </div>
          </div>
          <div class="flex flex-wrap gap-2.5 justify-center sm:justify-start" aria-hidden="true">
            <span class="badge badge-primary font-black">Angular 21+</span>
            <span class="badge badge-secondary font-black">Signals</span>
            <span class="badge badge-accent font-black">OnPush</span>
          </div>
        </header>

        <nav
          class="flex flex-wrap gap-2.5 mb-12 p-2 bg-base-200/50 rounded-3xl border border-base-content/5 shadow-inner"
          role="tablist"
          aria-label="Demo sections"
        >
          @for (tab of tabs; track tab.id) {
            <button
              class="flex-1 min-w-[140px] py-4 px-6 rounded-2xl transition-all duration-300 font-black flex flex-col items-center gap-2 group border border-transparent"
              [class.bg-primary]="activeTab() === tab.id"
              [class.text-base-content]="activeTab() === tab.id"
              [class.shadow-2xl]="activeTab() === tab.id"
              [class.border-primary/20]="activeTab() === tab.id"
              [class.hover:bg-base-content/5]="activeTab() !== tab.id"
              [class.text-base-content/30]="activeTab() !== tab.id"
              (click)="setTab(tab.id)"
              [attr.aria-selected]="activeTab() === tab.id"
              [attr.aria-controls]="'panel-' + tab.id"
              [id]="'tab-' + tab.id"
              role="tab"
              type="button"
            >
              <span
                class="text-3xl transition-transform group-hover:scale-125 duration-300"
                aria-hidden="true"
                >{{ tab.icon }}</span
              >
              <span
                class="text-[10px] uppercase tracking-[0.2em] group-hover:text-base-content transition-colors"
                >{{ tab.label }}</span
              >
            </button>
          }
        </nav>
      }

      <div class="demo-tab-content min-h-[600px]">
        @if (activeTab() === 'observers') {
          <div
            id="panel-observers"
            class="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in slide-in-from-bottom-6 duration-500"
            role="tabpanel"
            aria-labelledby="tab-observers"
          >
            <app-page-visibility-demo />
            <app-network-information-demo />
            <app-resize-observer-demo />
            <app-intersection-observer-demo />
          </div>
        }
        @if (activeTab() === 'media') {
          <div
            id="panel-media"
            class="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in slide-in-from-bottom-6 duration-500"
            role="tabpanel"
            aria-labelledby="tab-media"
          >
            <app-camera-demo />
            <app-media-devices-demo />
            <app-media-recorder-demo />
            <app-speech-synthesis-demo />
          </div>
        }
        @if (activeTab() === 'system') {
          <div
            id="panel-system"
            class="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in slide-in-from-bottom-6 duration-500"
            role="tabpanel"
            aria-labelledby="tab-system"
          >
            <app-screen-wake-lock-demo />
            <app-screen-orientation-demo />
            <app-fullscreen-demo />
            <app-vibration-demo />
            <app-eye-dropper-demo />
            <app-idle-detector-demo />
          </div>
        }
        @if (activeTab() === 'storage') {
          <div
            id="panel-storage"
            class="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in slide-in-from-bottom-6 duration-500"
            role="tabpanel"
            aria-labelledby="tab-storage"
          >
            <app-clipboard-demo />
            <app-file-system-access-demo />
          </div>
        }
        @if (activeTab() === 'realtime') {
          <div
            id="panel-realtime"
            class="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in slide-in-from-bottom-6 duration-500"
            role="tabpanel"
            aria-labelledby="tab-realtime"
          >
            <app-broadcast-channel-demo />
            <app-server-sent-events-demo />
            <app-web-transport-demo />
          </div>
        }
        @if (activeTab() === 'location') {
          <div
            id="panel-location"
            class="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in slide-in-from-bottom-6 duration-500"
            role="tabpanel"
            aria-labelledby="tab-location"
          >
            <app-geolocation-demo />
            <app-notification-demo />
          </div>
        }
      </div>

      @if (!embedded()) {
        <footer class="mt-32 pt-12 border-t border-base-content/5 flex justify-center">
          <a
            routerLink="/demo/security"
            class="btn btn-ghost font-black text-primary flex items-center gap-3 group text-sm tracking-tighter"
          >
            Explore Security Engine Demos
            <span class="transition-transform group-hover:translate-x-2 text-2xl">→</span>
          </a>
        </footer>
      }
    </div>
  `,
})
export class BrowserApisComponent {
  readonly embedded = input<boolean>(false);

  activeTab = signal<DemoTab>('observers');

  readonly tabs: ReadonlyArray<{ id: DemoTab; icon: string; label: string }> = [
    { id: 'observers', icon: '👁', label: 'Observers' },
    { id: 'media', icon: '🎥', label: 'Media' },
    { id: 'system', icon: '⚙️', label: 'System' },
    { id: 'storage', icon: '💾', label: 'Storage' },
    { id: 'realtime', icon: '📡', label: 'Realtime' },
    { id: 'location', icon: '📍', label: 'Location' },
  ];

  setTab(tab: DemoTab): void {
    this.activeTab.set(tab);
  }
}
