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
  styleUrl: '../demo.styles.css',
  template: `
    <section class="svc-card" aria-labelledby="cam-title">
      <div class="svc-card-head">
        <h2 class="svc-card-title" id="cam-title">Camera</h2>
        <div class="svc-badges">
          @if (supported) {
            <span class="badge badge-ok">supported</span>
          } @else {
            <span class="badge badge-no">unsupported</span>
          }
          <span class="badge badge-secure">secure context</span>
        </div>
      </div>
      <div class="svc-controls">
        <select
          [ngModel]="selectedCamera"
          (ngModelChange)="selectedCamera = $event"
          class="demo-select"
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
        <button class="btn btn-primary" (click)="start()" [disabled]="loading() || !!videoStream()">
          Start
        </button>
        <button class="btn btn-danger" (click)="stop()" [disabled]="!videoStream()">Stop</button>
        <button class="btn btn-secondary" (click)="takePhoto()" [disabled]="!videoStream()">
          Snapshot
        </button>
      </div>
      @if (videoStream()) {
        <video
          class="media-preview"
          [srcObject]="videoStream()"
          autoplay
          muted
          playsinline
          aria-label="Camera preview"
        ></video>
      }
      @if (photoUrl()) {
        <div class="photo-wrap">
          <img [src]="photoUrl()" alt="Captured snapshot" class="media-preview" />
          <button class="btn-icon-close" (click)="photoUrl.set('')" aria-label="Dismiss photo">
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
