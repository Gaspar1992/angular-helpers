import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

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
export class EyeDropperService {
  private readonly platformId = inject(PLATFORM_ID);

  isSupported(): boolean {
    return isPlatformBrowser(this.platformId) && 'EyeDropper' in window;
  }

  async open(signal?: AbortSignal): Promise<ColorSelectionResult> {
    if (!this.isSupported()) {
      throw new Error('EyeDropper API not supported');
    }
    const dropper = new (getEyeDropperClass()!)();
    return dropper.open(signal ? { signal } : undefined);
  }
}
