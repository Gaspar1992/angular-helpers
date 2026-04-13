import { Injectable } from '@angular/core';
import { BrowserApiBaseService } from '@angular-helpers/browser-web-apis';

export interface ColorSelectionResult {
  sRGBHex: string;
}

interface EyeDropperInstance {
  open(): Promise<ColorSelectionResult>;
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

  async open(): Promise<ColorSelectionResult> {
    if (!this.isSupported()) {
      throw new Error('EyeDropper API not supported');
    }

    const eyeDropper = new (getEyeDropperClass()!)();
    return eyeDropper.open();
  }
}
