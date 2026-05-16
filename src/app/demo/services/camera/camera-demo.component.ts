import { Component, OnDestroy, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-camera-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  styleUrls: ['../demo.styles.css'],
  template: `
    <section class="svc-card" aria-labelledby="cam-title">
      <div class="svc-card-head">
        <h2 class="svc-card-title" id="cam-title">
          <span class="text-primary text-2xl">📸</span> Camera
        </h2>
        <div class="flex gap-2 flex-wrap">
          @if (supported) {
            <span class="badge badge-success font-black">supported</span>
          } @else {
            <span class="badge badge-error font-black">unsupported</span>
          }
          <span class="badge badge-info font-black">secure context</span>
          @if (videoStream()) {
            <span class="badge badge-primary animate-pulse font-black text-[9px]">LIVE</span>
          }
        </div>
      </div>

      <p class="svc-desc">
        High-performance media stream integration with device selection and instant snapshots.
      </p>

      <div class="svc-controls mb-8">
        <div class="flex-1 min-w-[200px]">
          <label>Select Device</label>
          <select
            [ngModel]="selectedCamera"
            (ngModelChange)="selectedCamera = $event"
            class="demo-select w-full"
            [disabled]="loading() || !!videoStream()"
            aria-label="Select camera"
          >
            @for (cam of availableCameras(); track cam.deviceId) {
              <option [value]="cam.deviceId">{{ cam.label || 'Camera ' + $index }}</option>
            }
            @if (availableCameras().length === 0) {
              <option value="">No cameras detected</option>
            }
          </select>
        </div>

        <div class="flex items-end gap-3 flex-wrap sm:flex-nowrap">
          <button
            class="btn btn-primary font-black"
            (click)="start()"
            [disabled]="loading() || !!videoStream()"
          >
            Start Feed
          </button>
          <button class="btn btn-danger font-black" (click)="stop()" [disabled]="!videoStream()">
            Stop
          </button>
          <button
            class="btn btn-secondary font-black"
            (click)="takePhoto()"
            [disabled]="!videoStream()"
          >
            Snapshot
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
        <!-- Live Feed -->
        <div
          class="relative bg-base-content/5 rounded-[2.5rem] border border-base-content/5 overflow-hidden shadow-inner aspect-video flex items-center justify-center"
        >
          @if (videoStream()) {
            <video
              class="w-full h-full object-cover animate-in fade-in duration-700"
              [srcObject]="videoStream()"
              autoplay
              muted
              playsinline
              aria-label="Camera preview"
            ></video>
          } @else {
            <div class="text-base-content/10 flex flex-col items-center gap-4">
              <span class="text-6xl">📷</span>
              <span class="text-[10px] font-black uppercase tracking-[0.3em]">No Signal</span>
            </div>
          }
        </div>

        <!-- Snapshot -->
        <div
          class="relative bg-base-content/5 rounded-[2.5rem] border border-base-content/5 overflow-hidden shadow-inner aspect-video flex items-center justify-center"
        >
          @if (photoUrl()) {
            <img
              [src]="photoUrl()"
              alt="Captured snapshot"
              class="w-full h-full object-cover animate-in zoom-in-95 duration-300"
            />
            <button
              class="absolute top-4 right-4 w-10 h-10 rounded-full bg-error text-base-content flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl font-black z-10"
              (click)="photoUrl.set('')"
              aria-label="Dismiss photo"
            >
              ✕
            </button>
          } @else {
            <div class="text-base-content/10 flex flex-col items-center gap-4">
              <span class="text-6xl">🖼️</span>
              <span class="text-[10px] font-black uppercase tracking-[0.3em]">Ready</span>
            </div>
          }
        </div>
      </div>
    </section>
  `,
})
export class CameraDemoComponent implements OnDestroy {
  readonly supported = typeof navigator !== 'undefined' && 'mediaDevices' in navigator;

  selectedCamera = '';
  readonly loading = signal(false);
  readonly videoStream = signal<MediaStream | null>(null);
  readonly availableCameras = signal<MediaDeviceInfo[]>([]);
  readonly photoUrl = signal('');

  constructor() {
    void this.loadDevices();
  }

  private async loadDevices(): Promise<void> {
    if (!this.supported) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter((d) => d.kind === 'videoinput');
      this.availableCameras.set(cameras);
      if (cameras.length > 0) this.selectedCamera = cameras[0].deviceId;
    } catch {
      // no permission yet
    }
  }

  async start(): Promise<void> {
    this.loading.set(true);
    try {
      const constraints = this.selectedCamera
        ? { video: { deviceId: { exact: this.selectedCamera } } }
        : { video: true };
      this.videoStream.set(await navigator.mediaDevices.getUserMedia(constraints));
    } finally {
      this.loading.set(false);
    }
  }

  stop(): void {
    this.videoStream()
      ?.getTracks()
      .forEach((t) => t.stop());
    this.videoStream.set(null);
    this.photoUrl.set('');
  }

  async takePhoto(): Promise<void> {
    const stream = this.videoStream();
    if (!stream) return;
    const video = document.createElement('video');
    video.srcObject = stream;
    await video.play();
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext('2d')!.drawImage(video, 0, 0);
    canvas.toBlob((b) => {
      if (b) this.photoUrl.set(URL.createObjectURL(b));
    });
  }

  ngOnDestroy(): void {
    this.stop();
  }
}
