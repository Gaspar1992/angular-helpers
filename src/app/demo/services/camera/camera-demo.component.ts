import {
  Component,
  OnDestroy,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-camera-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [FormsModule],
  template: `
    <section
      class="bg-base-200 border border-base-300 rounded-xl p-5 sm:p-6 mb-5"
      aria-labelledby="cam-title"
    >
      <div class="flex items-center justify-between gap-3 flex-wrap mb-3">
        <h2 class="text-lg sm:text-xl font-bold text-base-content m-0" id="cam-title">Camera</h2>
        <div class="flex gap-2 flex-wrap">
          @if (supported) {
            <span class="badge badge-success badge-sm">supported</span>
          } @else {
            <span class="badge badge-error badge-sm">unsupported</span>
          }
          <span class="badge badge-info badge-sm">secure context</span>
        </div>
      </div>
      <div class="flex flex-wrap gap-2 items-center mb-4">
        <select
          [ngModel]="selectedCamera"
          (ngModelChange)="selectedCamera = $event"
          class="select select-bordered select-sm"
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
        <button
          class="btn btn-primary btn-sm"
          (click)="start()"
          [disabled]="loading() || !!videoStream()"
        >
          Start
        </button>
        <button class="btn btn-error btn-sm" (click)="stop()" [disabled]="!videoStream()">
          Stop
        </button>
        <button class="btn btn-secondary btn-sm" (click)="takePhoto()" [disabled]="!videoStream()">
          Snapshot
        </button>
      </div>
      @if (videoStream()) {
        <video
          class="max-w-full h-auto rounded-lg border border-base-300 mt-3"
          [srcObject]="videoStream()"
          autoplay
          muted
          playsinline
          aria-label="Camera preview"
        ></video>
      }
      @if (photoUrl()) {
        <div class="relative inline-block mt-3">
          <img
            [src]="photoUrl()"
            alt="Captured snapshot"
            class="max-w-full h-auto rounded-lg border border-base-300"
          />
          <button
            class="absolute top-2 right-2 w-8 h-8 rounded-full bg-error/80 text-white flex items-center justify-center hover:bg-error transition-colors"
            (click)="photoUrl.set('')"
            aria-label="Dismiss photo"
          >
            ✕
          </button>
        </div>
      }
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
