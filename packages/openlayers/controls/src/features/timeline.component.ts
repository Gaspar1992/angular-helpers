import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { OlTimeService } from '@angular-helpers/openlayers/core';
import type { TimelinePosition } from '../models/timeline.types';

/**
 * A premium, reactive visual timeline component for OpenLayers.
 * Orchestrates time-series animations by binding directly to OlTimeService.
 *
 * Uses native controls, CSS grid/flex layouts, and a sleek glassmorphic theme.
 * Completely free of CommonModule or FormsModule dependencies for maximum performance.
 *
 * @usageNotes
 * ```html
 * <ol-timeline
 *   [startTime]="1700000000000"
 *   [endTime]="1700086400000"
 *   [playSpeed]="60"
 *   [loop]="true"
 *   position="bottom-center">
 * </ol-timeline>
 * ```
 */
@Component({
  selector: 'ol-timeline',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="ol-timeline"
      [class.ol-timeline--top-left]="position() === 'top-left'"
      [class.ol-timeline--top-center]="position() === 'top-center'"
      [class.ol-timeline--top-right]="position() === 'top-right'"
      [class.ol-timeline--bottom-left]="position() === 'bottom-left'"
      [class.ol-timeline--bottom-center]="position() === 'bottom-center'"
      [class.ol-timeline--bottom-right]="position() === 'bottom-right'"
    >
      <div class="ol-timeline__controls">
        <button
          type="button"
          class="ol-timeline__btn ol-timeline__btn--play"
          (click)="togglePlay()"
          [attr.aria-label]="isPlaying() ? 'Pause animation' : 'Play animation'"
        >
          @if (isPlaying()) {
            <!-- Pause Icon -->
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          } @else {
            <!-- Play Icon -->
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          }
        </button>

        <span class="ol-timeline__time-display" aria-live="polite">
          {{ formattedTime() }}
        </span>
      </div>

      <div class="ol-timeline__slider-container">
        <input
          type="range"
          class="ol-timeline__slider"
          [min]="startTime()"
          [max]="endTime()"
          [value]="currentTime()"
          (input)="onScrub($event)"
          aria-label="Timeline progress slider"
        />
      </div>

      <div class="ol-timeline__settings">
        <select
          class="ol-timeline__speed-select"
          [value]="speed()"
          (change)="onSpeedChange($event)"
          aria-label="Playback speed multiplier"
        >
          <option [value]="1">1x (Real)</option>
          <option [value]="5">5x</option>
          <option [value]="10">10x</option>
          <option [value]="30">30x</option>
          <option [value]="60">60x (1m/s)</option>
          <option [value]="300">300x (5m/s)</option>
          <option [value]="3600">3600x (1h/s)</option>
        </select>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .ol-timeline {
        position: absolute;
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 8px 16px;
        background: rgba(30, 30, 30, 0.75);
        backdrop-filter: blur(12px) saturate(160%);
        -webkit-backdrop-filter: blur(12px) saturate(160%);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 24px;
        box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
        color: #f3f3f3;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 13px;
        z-index: 10;
        width: calc(100% - 32px);
        max-width: 600px;
        box-sizing: border-box;
      }

      /* Placements */
      .ol-timeline--top-left {
        top: 12px;
        left: 12px;
      }

      .ol-timeline--top-center {
        top: 12px;
        left: 50%;
        transform: translateX(-50%);
      }

      .ol-timeline--top-right {
        top: 12px;
        right: 12px;
      }

      .ol-timeline--bottom-left {
        bottom: 12px;
        left: 12px;
      }

      .ol-timeline--bottom-center {
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
      }

      .ol-timeline--bottom-right {
        bottom: 12px;
        right: 12px;
      }

      /* Control elements */
      .ol-timeline__controls {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-shrink: 0;
      }

      .ol-timeline__btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border: none;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
        cursor: pointer;
        transition:
          background 0.15s ease,
          transform 0.15s ease;
      }

      .ol-timeline__btn:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: scale(1.05);
      }

      .ol-timeline__btn:active {
        transform: scale(0.95);
      }

      .ol-timeline__time-display {
        font-variant-numeric: tabular-nums;
        font-weight: 500;
        color: #e0e0e0;
        min-width: 140px;
        text-align: center;
      }

      /* Slider */
      .ol-timeline__slider-container {
        flex-grow: 1;
        display: flex;
        align-items: center;
      }

      .ol-timeline__slider {
        -webkit-appearance: none;
        width: 100%;
        height: 4px;
        border-radius: 2px;
        background: rgba(255, 255, 255, 0.2);
        outline: none;
        cursor: pointer;
        transition: background 0.15s ease;
      }

      .ol-timeline__slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: #1a73e8;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
        cursor: pointer;
        transition:
          background 0.15s ease,
          transform 0.15s ease;
      }

      .ol-timeline__slider::-webkit-slider-thumb:hover {
        background: #2b84f0;
        transform: scale(1.15);
      }

      .ol-timeline__slider::-moz-range-thumb {
        width: 14px;
        height: 14px;
        border: none;
        border-radius: 50%;
        background: #1a73e8;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
        cursor: pointer;
        transition:
          background 0.15s ease,
          transform 0.15s ease;
      }

      .ol-timeline__slider::-moz-range-thumb:hover {
        background: #2b84f0;
        transform: scale(1.15);
      }

      /* Settings */
      .ol-timeline__settings {
        flex-shrink: 0;
      }

      .ol-timeline__speed-select {
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 4px 8px;
        font-size: 11px;
        font-weight: 500;
        outline: none;
        cursor: pointer;
        transition: background 0.15s ease;
      }

      .ol-timeline__speed-select:hover {
        background: rgba(255, 255, 255, 0.15);
      }

      .ol-timeline__speed-select option {
        background: #1e1e1e;
        color: #ffffff;
      }
    `,
  ],
})
export class OlTimelineComponent {
  private timeService = inject(OlTimeService);

  /** Start bounds of time-series (Epoch ms) */
  startTime = input.required<number>();
  /** End bounds of time-series (Epoch ms) */
  endTime = input.required<number>();
  /** Default speed multiplier (e.g. 1, 5, 10, 60, 3600) */
  playSpeed = input<number>(1);
  /** Loop playback when reaching endTime */
  loop = input<boolean>(false);
  /** Position overlay alignment */
  position = input<TimelinePosition>('bottom-center');
  /** Custom label formatter */
  formatLabel = input<(time: number) => string>((t) => new Date(t).toLocaleString());

  /** Outputs */
  timeChange = output<number>();
  playStateChange = output<boolean>();

  /** Computeds binding directly to OlTimeService */
  currentTime = computed(() => this.timeService.currentTime());
  isPlaying = computed(() => this.timeService.isPlaying());
  speed = computed(() => this.timeService.speed());

  formattedTime = computed(() => this.formatLabel()(this.currentTime()));

  constructor() {
    // Sync default configuration settings when the inputs initialize
    effect(() => {
      this.timeService.setSpeed(this.playSpeed());
    });

    // Make sure initial time starts at the startTime bounds
    effect(() => {
      this.timeService.setTime(this.startTime());
    });

    // Reactive time-based loop boundaries check
    effect(() => {
      const current = this.currentTime();
      const end = this.endTime();
      const isAnimPlaying = this.isPlaying();

      if (current >= end && isAnimPlaying) {
        if (this.loop()) {
          this.timeService.setTime(this.startTime());
        } else {
          this.timeService.pause();
          this.timeService.setTime(end);
          this.playStateChange.emit(false);
        }
      }
    });

    // Emit reactive output when current time advances
    effect(() => {
      this.timeChange.emit(this.currentTime());
    });
  }

  togglePlay(): void {
    if (this.isPlaying()) {
      this.timeService.pause();
      this.playStateChange.emit(false);
    } else {
      // If we are at the end, reset to start before playing
      if (this.currentTime() >= this.endTime()) {
        this.timeService.setTime(this.startTime());
      }
      this.timeService.play();
      this.playStateChange.emit(true);
    }
  }

  onScrub(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = Number(target.value);
    this.timeService.setTime(value);
  }

  onSpeedChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const value = Number(target.value);
    this.timeService.setSpeed(value);
  }
}
