import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';

@Component({
  selector: 'app-media-devices-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="bg-base-200 border border-base-300 rounded-xl p-5 sm:p-6 mb-5"
      aria-labelledby="mdev-title"
    >
      <div class="flex items-center justify-between gap-3 flex-wrap mb-3">
        <h2 class="text-lg sm:text-xl font-bold text-base-content m-0" id="mdev-title">
          Media Devices
        </h2>
        <div class="flex gap-2 flex-wrap">
          @if (supported) {
            <span class="badge badge-success badge-sm">supported</span>
          } @else {
            <span class="badge badge-error badge-sm">unsupported</span>
          }
        </div>
      </div>
      <p class="text-sm text-base-content/80 mb-4 leading-relaxed">
        Enumerate connected audio/video input devices.
      </p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="bg-base-300 border border-base-300 rounded-lg p-4">
          <h3 class="text-xs font-bold text-base-content/80 uppercase tracking-wider mb-3">
            Video inputs ({{ cameras().length }})
          </h3>
          @for (d of cameras(); track d.deviceId) {
            <div
              class="flex items-center justify-between py-2 border-b border-base-300 last:border-b-0 last:mb-0 mb-2"
            >
              <span class="text-sm text-base-content font-medium">{{
                d.label || 'Unnamed device'
              }}</span>
              <span class="text-xs text-base-content/80 font-mono"
                >{{ d.deviceId.substring(0, 8) }}…</span
              >
            </div>
          }
          @if (cameras().length === 0) {
            <p class="text-sm text-base-content/80 italic">None detected</p>
          }
        </div>
        <div class="bg-base-300 border border-base-300 rounded-lg p-4">
          <h3 class="text-xs font-bold text-base-content/80 uppercase tracking-wider mb-3">
            Audio inputs ({{ audioDevices().length }})
          </h3>
          @for (d of audioDevices(); track d.deviceId) {
            <div
              class="flex items-center justify-between py-2 border-b border-base-300 last:border-b-0 last:mb-0 mb-2"
            >
              <span class="text-sm text-base-content font-medium">{{
                d.label || 'Unnamed device'
              }}</span>
              <span class="text-xs text-base-content/80 font-mono"
                >{{ d.deviceId.substring(0, 8) }}…</span
              >
            </div>
          }
          @if (audioDevices().length === 0) {
            <p class="text-sm text-base-content/80 italic">None detected</p>
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
