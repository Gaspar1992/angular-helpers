import { ChangeDetectionStrategy, Component, OnInit, input, signal } from '@angular/core';
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
import { GeolocationDemoComponent } from '../services/geolocation/geolocation-demo.component';
import { NotificationDemoComponent } from '../services/notification/notification-demo.component';

export type DemoTab = 'observers' | 'media' | 'system' | 'storage' | 'realtime' | 'location';

@Component({
  selector: 'app-browser-apis',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    GeolocationDemoComponent,
    NotificationDemoComponent,
  ],
  templateUrl: './browser-apis.html',
  styleUrls: ['./browser-apis.css', '../shared/demo-shared.styles.css'],
})
export class BrowserApisComponent {
  readonly embedded = input<boolean>(false);

  activeTab = signal<DemoTab>('observers');

  readonly tabs: ReadonlyArray<{ id: DemoTab; icon: string; label: string }> = [
    { id: 'observers', icon: '👁', label: 'Observers' },
    { id: 'media', icon: '🎥', label: 'Media' },
    { id: 'system', icon: '⚙️', label: 'System' },
    { id: 'storage', icon: '💾', label: 'Storage & I/O' },
    { id: 'realtime', icon: '📡', label: 'Realtime' },
    { id: 'location', icon: '📍', label: 'Location' },
  ];

  setTab(tab: DemoTab): void {
    this.activeTab.set(tab);
  }
}
