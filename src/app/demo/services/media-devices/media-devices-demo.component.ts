import { Component, ChangeDetectionStrategy, signal } from '@angular/core';

@Component({
  selector: 'app-media-devices-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['../demo.styles.css'],
  template: `
    <section class="svc-card" aria-labelledby="mdev-title">
      <div class="svc-card-head">
        <h2 class="svc-card-title" id="mdev-title">
          <span class="text-primary text-2xl">🎙️</span> Media Devices
        </h2>
        <div class="flex gap-2 flex-wrap">
          @if (supported) {
            <span class="badge badge-success font-black">supported</span>
          } @else {
            <span class="badge badge-error font-black">unsupported</span>
          }
        </div>
      </div>
      <p class="svc-desc">
        Enumerate and monitor all connected audio and video input/output devices.
      </p>

      <div class="svc-controls">
        <button class="btn btn-primary font-black" (click)="enumerate()" [disabled]="!supported">
          Scan Devices
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-4">
        <div class="space-y-4">
          <label>Audio Inputs</label>
          @if (audioInputs().length === 0) {
            <div
              class="p-5 bg-base-content/5 rounded-2xl border border-base-content/5 shadow-inner italic text-xs text-base-content/20"
            >
              No scan results
            </div>
          } @else {
            <div class="svc-result space-y-2 max-h-48 overflow-y-auto no-scrollbar">
              @for (d of audioInputs(); track d.deviceId) {
                <div
                  class="flex items-center gap-3 p-3 rounded-xl bg-base-content/5 border border-base-content/5 animate-in slide-in-from-left-2 duration-300"
                >
                  <span class="text-lg">🎤</span>
                  <span class="font-bold text-xs flex-1 truncate">{{
                    d.label || 'Default Audio'
                  }}</span>
                </div>
              }
            </div>
          }
        </div>

        <div class="space-y-4">
          <label>Video Inputs</label>
          @if (videoInputs().length === 0) {
            <div
              class="p-5 bg-base-content/5 rounded-2xl border border-base-content/5 shadow-inner italic text-xs text-base-content/20"
            >
              No scan results
            </div>
          } @else {
            <div class="svc-result space-y-2 max-h-48 overflow-y-auto no-scrollbar">
              @for (d of videoInputs(); track d.deviceId) {
                <div
                  class="flex items-center gap-3 p-3 rounded-xl bg-base-content/5 border border-base-content/5 animate-in slide-in-from-right-2 duration-300"
                >
                  <span class="text-lg">📷</span>
                  <span class="font-bold text-xs flex-1 truncate">{{
                    d.label || 'Default Camera'
                  }}</span>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </section>
  `,
})
export class MediaDevicesDemoComponent {
  readonly supported = typeof navigator !== 'undefined' && 'mediaDevices' in navigator;
  readonly audioInputs = signal<MediaDeviceInfo[]>([]);
  readonly videoInputs = signal<MediaDeviceInfo[]>([]);

  async enumerate(): Promise<void> {
    if (!this.supported) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.audioInputs.set(devices.filter((d) => d.kind === 'audioinput'));
      this.videoInputs.set(devices.filter((d) => d.kind === 'videoinput'));
    } catch {
      // denied
    }
  }
}
