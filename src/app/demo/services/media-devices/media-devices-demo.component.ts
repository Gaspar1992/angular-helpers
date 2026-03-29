import {
  Component,
  OnInit,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  signal,
} from '@angular/core';

@Component({
  selector: 'app-media-devices-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: '../demo.styles.css',
  template: `
    <section class="svc-card" aria-labelledby="mdev-title">
      <div class="svc-card-head">
        <h2 class="svc-card-title" id="mdev-title">Media Devices</h2>
        <div class="svc-badges">
          @if (supported) {
            <span class="badge badge-ok">supported</span>
          } @else {
            <span class="badge badge-no">unsupported</span>
          }
        </div>
      </div>
      <p class="svc-desc">Enumerate connected audio/video input devices.</p>
      <div class="devices-grid">
        <div class="device-group">
          <h3 class="device-group-title">Video inputs ({{ cameras().length }})</h3>
          @for (d of cameras(); track d.deviceId) {
            <div class="device-item">
              <span class="device-name">{{ d.label || 'Unnamed device' }}</span>
              <span class="device-id">{{ d.deviceId.substring(0, 8) }}…</span>
            </div>
          }
          @if (cameras().length === 0) {
            <p class="no-devices">None detected</p>
          }
        </div>
        <div class="device-group">
          <h3 class="device-group-title">Audio inputs ({{ audioDevices().length }})</h3>
          @for (d of audioDevices(); track d.deviceId) {
            <div class="device-item">
              <span class="device-name">{{ d.label || 'Unnamed device' }}</span>
              <span class="device-id">{{ d.deviceId.substring(0, 8) }}…</span>
            </div>
          }
          @if (audioDevices().length === 0) {
            <p class="no-devices">None detected</p>
          }
        </div>
      </div>
    </section>
  `,
})
export class MediaDevicesDemoComponent implements OnInit {
  readonly supported = typeof navigator !== 'undefined' && 'mediaDevices' in navigator;
  readonly cameras = signal<MediaDeviceInfo[]>([]);
  readonly audioDevices = signal<MediaDeviceInfo[]>([]);

  ngOnInit(): void {
    void this.loadDevices();
  }

  private async loadDevices(): Promise<void> {
    if (!this.supported) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.cameras.set(devices.filter((d) => d.kind === 'videoinput'));
      this.audioDevices.set(devices.filter((d) => d.kind === 'audioinput'));
    } catch {
      // no permission yet
    }
  }
}
