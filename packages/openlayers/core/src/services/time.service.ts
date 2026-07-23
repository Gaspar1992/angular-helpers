import { inject, Injectable, signal, computed, Signal } from '@angular/core';
import { OlZoneHelper } from './zone-helper.service';

/**
 * Service for orchestrating time-series animations in OpenLayers.
 * Exposes a reactive currentTime signal that updates outside the Angular zone
 * via requestAnimationFrame, ensuring 60FPS WebGL animations without triggering
 * global change detection.
 */
@Injectable({ providedIn: 'root' })
export class OlTimeService {
  private zoneHelper = inject(OlZoneHelper);

  private timeSignal = signal<number>(Date.now());
  private playingSignal = signal<boolean>(false);
  private speedSignal = signal<number>(1);

  private animationFrameId: number | null = null;
  private lastTick: number = 0;

  readonly currentTime: Signal<number> = computed(() => this.timeSignal());
  readonly isPlaying: Signal<boolean> = computed(() => this.playingSignal());
  readonly speed: Signal<number> = computed(() => this.speedSignal());

  /**
   * Sets the current time manually.
   * @param time Epoch timestamp in milliseconds
   */
  setTime(time: number): void {
    this.timeSignal.set(time);
  }

  /**
   * Sets the playback speed multiplier.
   * @param speed Multiplier (e.g. 1 = real time, 60 = 1 minute per second)
   */
  setSpeed(speed: number): void {
    this.speedSignal.set(speed);
  }

  /**
   * Starts the time animation loop.
   */
  play(): void {
    if (this.playingSignal()) return;

    this.playingSignal.set(true);
    this.lastTick = performance.now();

    this.zoneHelper.runOutsideAngular(() => {
      const loop = (now: number) => {
        if (!this.playingSignal()) return;

        const delta = now - this.lastTick;
        this.lastTick = now;

        // Advance time based on delta and speed multiplier
        const advance = delta * this.speedSignal();
        this.timeSignal.update((t) => t + advance);

        this.animationFrameId = requestAnimationFrame(loop);
      };

      this.animationFrameId = requestAnimationFrame(loop);
    });
  }

  /**
   * Pauses the time animation loop.
   */
  pause(): void {
    this.playingSignal.set(false);
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Stops the animation and resets to a specific time.
   */
  stop(resetTime: number = Date.now()): void {
    this.pause();
    this.setTime(resetTime);
  }
}
