import {
  Component,
  OnDestroy,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { SpeechSynthesisService } from '@angular-helpers/browser-web-apis';

@Component({
  selector: 'app-speech-synthesis-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [SpeechSynthesisService],
  imports: [FormsModule],
  styleUrl: '../demo.styles.css',
  template: `
    <section class="svc-card" aria-labelledby="speech-title">
      <div class="svc-card-head">
        <h2 class="svc-card-title" id="speech-title">Speech Synthesis</h2>
        <div class="svc-badges">
          @if (supported) {
            <span class="badge badge-ok">supported</span>
          } @else {
            <span class="badge badge-no">unsupported</span>
          }
          <span class="badge" [class]="speechState() === 'speaking' ? 'badge-recording' : 'badge-no'">
            {{ speechState() }}
          </span>
        </div>
      </div>
      <p class="svc-desc">Text-to-speech via the Web Speech API.</p>
      <div class="svc-controls svc-controls--col">
        <textarea
          class="demo-textarea"
          [ngModel]="text"
          (ngModelChange)="text = $event"
          rows="2"
          aria-label="Text to speak"
          placeholder="Enter text to speak…"
        ></textarea>
        <div class="svc-controls">
          <select
            class="demo-select"
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
            class="btn btn-primary"
            (click)="speak()"
            [disabled]="!supported || speechState() === 'speaking'"
          >
            Speak
          </button>
          <button class="btn btn-secondary" (click)="stop()" [disabled]="speechState() === 'idle'">
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
