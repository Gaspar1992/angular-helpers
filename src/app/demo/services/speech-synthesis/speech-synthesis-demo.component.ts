import { Component, OnDestroy, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SpeechSynthesisService } from '@angular-helpers/browser-web-apis';

@Component({
  selector: 'app-speech-synthesis-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SpeechSynthesisService],
  imports: [FormsModule],
  styleUrls: ['../demo.styles.css'],
  template: `
    <section class="svc-card" aria-labelledby="speech-title">
      <div class="svc-card-head">
        <h2 class="svc-card-title" id="speech-title">
          <span class="text-primary text-2xl">🗣️</span> Speech Synthesis
        </h2>
        <div class="flex gap-2 flex-wrap">
          @if (supported) {
            <span class="badge badge-success font-black">supported</span>
          } @else {
            <span class="badge badge-error font-black">unsupported</span>
          }
          @if (speaking()) {
            <span class="badge badge-primary animate-pulse font-black">SPEAKING</span>
          }
        </div>
      </div>
      <p class="svc-desc">
        Convert text into high-quality synthesized speech using the browser's native engine.
      </p>

      <div class="space-y-6">
        <div class="space-y-2">
          <label>Text to Synthesize</label>
          <textarea
            [(ngModel)]="text"
            placeholder="What should I say?"
            class="demo-input w-full min-h-[120px] leading-relaxed font-bold"
          ></textarea>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          <div class="space-y-2">
            <label>Select Voice</label>
            <select [(ngModel)]="selectedVoiceIndex" class="demo-select w-full">
              @for (v of voices(); track v.name) {
                <option [value]="$index">{{ v.name }} ({{ v.lang }})</option>
              }
            </select>
          </div>
          <div class="flex items-end gap-3">
            <button
              class="btn btn-primary font-black flex-1"
              (click)="speak()"
              [disabled]="!text().trim() || !supported"
            >
              {{ speaking() ? 'Synthesizing…' : 'Speak Text' }}
            </button>
            <button class="btn btn-danger font-black" (click)="stop()" [disabled]="!speaking()">
              Stop
            </button>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class SpeechSynthesisDemoComponent implements OnDestroy {
  private readonly svc = inject(SpeechSynthesisService);

  readonly supported = this.svc.isSupported();
  readonly text = signal('Welcome to Angular Helpers. The ultimate technical toolkit.');
  readonly voices = signal<SpeechSynthesisVoice[]>([]);
  readonly speaking = signal(false);
  selectedVoiceIndex = 0;

  constructor() {
    if (this.supported) {
      void this.loadVoices();
    }
  }

  private async loadVoices(): Promise<void> {
    const list = await this.svc.getVoices();
    this.voices.set(list);
  }

  speak(): void {
    const voice = this.voices()[this.selectedVoiceIndex];
    this.speaking.set(true);
    this.svc.speak(this.text(), { voice }).subscribe({
      complete: () => this.speaking.set(false),
      error: () => this.speaking.set(false),
    });
  }

  stop(): void {
    this.svc.cancel();
    this.speaking.set(false);
  }

  ngOnDestroy(): void {
    this.stop();
  }
}
