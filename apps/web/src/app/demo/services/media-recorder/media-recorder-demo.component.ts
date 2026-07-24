import { Component, type OnDestroy, signal } from '@angular/core';
import { MediaRecorderService } from '@angular-helpers/browser-web-apis';

@Component({
  selector: 'app-media-recorder-demo',
  providers: [MediaRecorderService],
  styleUrls: ['../demo.styles.css'],
  template: `
    <section class="svc-card" aria-labelledby="rec-title">
      <div class="svc-card-head">
        <h2 class="svc-card-title" id="rec-title">
          <span class="text-primary text-2xl">⏺️</span> Media Recorder
        </h2>
        <div class="flex gap-2 flex-wrap">
          @if (supported) {
            <span class="badge badge-success font-black">supported</span>
          } @else {
            <span class="badge badge-error font-black">unsupported</span>
          }
          @if (recording()) {
            <span class="badge badge-primary animate-pulse font-black">REC</span>
          }
        </div>
      </div>
      <p class="svc-desc">
        Capture and record audio/video streams from the device or application elements.
      </p>

      <div class="svc-controls mb-8">
        <button
          class="btn btn-primary font-black"
          (click)="start()"
          [disabled]="recording() || !supported"
        >
          Start Recording
        </button>
        <button class="btn btn-danger font-black" (click)="stop()" [disabled]="!recording()">
          Stop & Save
        </button>
      </div>

      <div class="space-y-6">
        @if (recording()) {
          <div class="feedback feedback-info animate-pulse">
            <span class="w-3 h-3 rounded-full bg-primary animate-ping"></span>
            <span>Recording in progress... chunks are being buffered.</span>
          </div>
        }

        @if (videoUrl()) {
          <div class="svc-result space-y-4 animate-in zoom-in-95 duration-500">
            <label class="m-0">Recording Preview</label>
            <video
              [src]="videoUrl()"
              controls
              class="w-full rounded-2xl border border-base-content/10 shadow-2xl bg-black"
            ></video>
            <div class="flex justify-end">
              <a
                [href]="videoUrl()"
                download="recording.webm"
                class="btn btn-secondary btn-sm font-black"
                >Download File</a
              >
            </div>
          </div>
        }
      </div>
    </section>
  `,
})
export class MediaRecorderDemoComponent implements OnDestroy {
  readonly supported = typeof navigator !== 'undefined' && 'MediaRecorder' in window;
  readonly recording = signal(false);
  readonly videoUrl = signal<string | null>(null);
  private stream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];

  async start(): Promise<void> {
    if (!this.supported) return;
    this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    this.recorder = new MediaRecorder(this.stream);
    this.chunks = [];

    this.recorder.ondataavailable = (e) => this.chunks.push(e.data);
    this.recorder.onstop = () => {
      const blob = new Blob(this.chunks, { type: 'video/webm' });
      this.videoUrl.set(URL.createObjectURL(blob));
    };

    this.recorder.start();
    this.recording.set(true);
  }

  stop(): void {
    this.recorder?.stop();
    this.stream?.getTracks().forEach((t) => t.stop());
    this.recording.set(false);
  }

  ngOnDestroy(): void {
    this.stop();
  }
}
