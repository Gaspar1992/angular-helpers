import { Injectable } from '@angular/core';
import { BrowserApiBaseService } from './base/browser-api-base.service';

export interface ColorSelectionResult {
  sRGBHex: string;
}

interface EyeDropperInstance {
  open(options?: { signal?: AbortSignal }): Promise<ColorSelectionResult>;
}

interface EyeDropperConstructor {
  new (): EyeDropperInstance;
}

function getEyeDropperClass(): EyeDropperConstructor | undefined {
  return (window as unknown as { EyeDropper?: EyeDropperConstructor }).EyeDropper;
}

@Injectable()
export class EyeDropperService extends BrowserApiBaseService {
  protected override getApiName(): string {
    return 'eye-dropper';
  }

  isSupported(): boolean {
    return this.isBrowserEnvironment() && 'EyeDropper' in window;
  }

  async open(signal?: AbortSignal): Promise<ColorSelectionResult> {
    if (!this.isSupported()) {
      throw new Error('EyeDropper API not supported');
    }
    const dropper = new (getEyeDropperClass()!)();
    return dropper.open(signal ? { signal } : undefined);
  }
}
