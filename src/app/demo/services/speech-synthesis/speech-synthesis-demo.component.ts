import { Component, OnDestroy, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { SpeechSynthesisService } from '@angular-helpers/browser-web-apis';

@Component({
  selector: 'app-speech-synthesis-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SpeechSynthesisService],
  imports: [FormsModule],
  template: `
    <section
      class="bg-base-200 border border-base-300 rounded-xl p-5 sm:p-6 mb-5"
      aria-labelledby="speech-title"
    >
      <div class="flex items-center justify-between gap-3 flex-wrap mb-3">
        <h2 class="text-lg sm:text-xl font-bold text-base-content m-0" id="speech-title">
          Speech Synthesis
        </h2>
        <div class="flex gap-2 flex-wrap">
          @if (supported) {
            <span class="badge badge-success badge-sm">supported</span>
          } @else {
            <span class="badge badge-error badge-sm">unsupported</span>
          }
          @if (speechState() === 'speaking') {
            <span class="badge badge-error badge-sm animate-pulse">{{ speechState() }}</span>
          } @else {
            <span class="badge badge-ghost badge-sm">{{ speechState() }}</span>
          }
        </div>
      </div>
      <p class="text-sm text-base-content/80 mb-4 leading-relaxed">
        Text-to-speech via the Web Speech API.
      </p>
      <div class="flex flex-col gap-2 mb-4">
        <textarea
          class="textarea textarea-bordered w-full"
          [ngModel]="text"
          (ngModelChange)="text = $event"
          rows="2"
          aria-label="Text to speak"
          placeholder="Enter text to speak…"
        ></textarea>
        <div class="flex flex-wrap gap-2 items-center">
          <select
            class="select select-bordered select-sm"
            [disabled]="voices().length === 0"
            [ngModel]="selectedVoiceIdx"
            (ngModelChange)="selectedVoiceIdx = $event"
            aria-label="Select voice"
          >
            @for (v of voices(); track v.name; let i = $index) {
              <option [value]="i">{{ v.name }} ({{ v.lang }})</option>
            }
            @if (voices().length === 0) {
              <option>Loading voices…</option>
            }
          </select>
          <button
            class="btn btn-primary btn-sm"
            (click)="speak()"
            [disabled]="!supported || speechState() === 'speaking'"
          >
            Speak
          </button>
          <button
            class="btn btn-secondary btn-sm"
            (click)="stop()"
            [disabled]="speechState() === 'idle'"
          >
            Stop
          </button>
        </div>
      </div>
    </section>
  `,
})
export class SpeechSynthesisDemoComponent implements OnDestroy {
  private readonly svc = inject(SpeechSynthesisService);
  private readonly subs: Subscription[] = [];

  readonly supported = this.svc.isSupported();
  text = 'Hello from Angular Helpers!';
  selectedVoiceIdx = 0;
  readonly voices = signal<SpeechSynthesisVoice[]>([]);
  readonly speechState = signal<'idle' | 'speaking' | 'paused'>('idle');

  constructor() {
    if (this.supported) {
      this.subs.push(this.svc.watchVoices().subscribe((v) => this.voices.set(v)));
    }
  }

  speak(): void {
    if (!this.supported) return;
    const voice = this.voices()[this.selectedVoiceIdx] ?? null;
    this.subs.push(this.svc.speak(this.text, { voice }).subscribe((s) => this.speechState.set(s)));
  }

  stop(): void {
    this.svc.cancel();
    this.speechState.set('idle');
  }

  ngOnDestroy(): void {
    this.svc.cancel();
    this.subs.forEach((s) => s.unsubscribe());
  }
}
