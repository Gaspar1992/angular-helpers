import {
  Component,
  OnDestroy,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
import { MediaRecorderService, PermissionsService } from '@angular-helpers/browser-web-apis';

@Component({
  selector: 'app-media-recorder-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [PermissionsService, MediaRecorderService],
  styleUrl: '../demo.styles.css',
  template: `
    <section class="svc-card" aria-labelledby="rec-title">
      <div class="svc-card-head">
        <h2 class="svc-card-title" id="rec-title">Media Recorder</h2>
        <div class="svc-badges">
          @if (supported) {
            <span class="badge badge-ok">supported</span>
          } @else {
            <span class="badge badge-no">unsupported</span>
          }
          <span class="badge badge-secure">secure context</span>
        </div>
      </div>
      <p class="svc-desc">Record audio from the microphone. Requires microphone permission.</p>
      <div class="svc-controls">
        <button
          class="btn btn-danger"
          (click)="startRecording()"
          [disabled]="!supported || recordingState() === 'recording'"
        >
          <span class="rec-dot" aria-hidden="true"></span> Record
        </button>
        <button
          class="btn btn-secondary"
          (click)="stopRecording()"
          [disabled]="recordingState() !== 'recording'"
        >
          Stop
        </button>
        <span class="badge" [class]="recordingState() === 'recording' ? 'badge-recording' : 'badge-no'">
          {{ recordingState() }}
        </span>
      </div>
      @if (recordedUrl()) {
        <div class="svc-result">
          <p class="svc-hint">Recording: {{ recordedDuration() }}s</p>
          <audio
            [src]="recordedUrl()"
            controls
            class="audio-player"
            aria-label="Recorded audio"
          ></audio>
        </div>
      }
    </section>
  `,
})
export class MediaRecorderDemoComponent implements OnDestroy {
  private readonly svc = inject(MediaRecorderService);

  readonly supported = this.svc.isSupported();
  readonly recordingState = signal<'inactive' | 'recording'>('inactive');
  readonly recordedUrl = signal('');
  readonly recordedDuration = signal(0);

  async startRecording(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      await this.svc.start(stream, { timeslice: 250 });
      this.recordingState.set('recording');
      this.recordedUrl.set('');
    } catch {
      // permission denied or unsupported
    }
  }

  stopRecording(): void {
    const result = this.svc.stop();
    if (result) {
      this.recordedUrl.set(result.url);
      this.recordedDuration.set(Math.round(result.duration / 1000));
    }
    this.recordingState.set('inactive');
  }

  ngOnDestroy(): void {
    if (this.recordingState() === 'recording') this.svc.stop();
  }
}
