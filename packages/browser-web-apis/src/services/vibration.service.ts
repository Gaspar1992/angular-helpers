import { Injectable } from '@angular/core';
import { BrowserApiBaseService } from './base/browser-api-base.service';

export type VibrationPattern = number | number[];

export interface VibrationPreset {
  success: VibrationPattern;
  error: VibrationPattern;
  notification: VibrationPattern;
  doubleTap: VibrationPattern;
}

@Injectable()
export class VibrationService extends BrowserApiBaseService {
  protected override getApiName(): string {
    return 'vibration';
  }

  readonly presets: VibrationPreset = {
    success: [50, 30, 50],
    error: [100, 50, 100, 50, 100],
    notification: [200],
    doubleTap: [50, 100, 50],
  };

  isSupported(): boolean {
    return this.isBrowserEnvironment() && 'vibrate' in navigator;
  }

  vibrate(pattern: VibrationPattern = 200): boolean {
    if (!this.isSupported()) return false;
    return navigator.vibrate(pattern);
  }

  success(): boolean {
    return this.vibrate(this.presets.success);
  }

  error(): boolean {
    return this.vibrate(this.presets.error);
  }

  notification(): boolean {
    return this.vibrate(this.presets.notification);
  }

  doubleTap(): boolean {
    return this.vibrate(this.presets.doubleTap);
  }

  stop(): boolean {
    return this.vibrate(0);
  }
}
