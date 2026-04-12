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
  template: `
    <section
      class="bg-base-200 border border-base-300 rounded-xl p-5 sm:p-6 mb-5"
      aria-labelledby="rec-title"
    >
      <div class="flex items-center justify-between gap-3 flex-wrap mb-3">
        <h2 class="text-lg sm:text-xl font-bold text-base-content m-0" id="rec-title">
          Media Recorder
        </h2>
        <div class="flex gap-2 flex-wrap">
          @if (supported) {
            <span class="badge badge-success badge-sm">supported</span>
          } @else {
            <span class="badge badge-error badge-sm">unsupported</span>
          }
          <span class="badge badge-info badge-sm">secure context</span>
        </div>
      </div>
      <p class="text-sm text-base-content/70 mb-4 leading-relaxed">
        Record audio from the microphone. Requires microphone permission.
      </p>
      <div class="flex flex-wrap gap-2 items-center mb-4">
        <button
          class="btn btn-error btn-sm"
          (click)="startRecording()"
          [disabled]="!supported || recordingState() === 'recording'"
        >
          <span
            class="w-2 h-2 rounded-full bg-white animate-pulse inline-block mr-1"
            aria-hidden="true"
          ></span>
          Record
        </button>
        <button
          class="btn btn-secondary btn-sm"
          (click)="stopRecording()"
          [disabled]="recordingState() !== 'recording'"
        >
          Stop
        </button>
        @if (recordingState() === 'recording') {
          <span class="badge badge-error badge-sm animate-pulse">recording</span>
        } @else {
          <span class="badge badge-ghost badge-sm">inactive</span>
        }
      </div>
      @if (recordedUrl()) {
        <div class="bg-base-300 border border-base-300 rounded-lg p-4">
          <p class="text-xs text-base-content/60 mb-2">Recording: {{ recordedDuration() }}s</p>
          <audio [src]="recordedUrl()" controls class="w-full" aria-label="Recorded audio"></audio>
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
