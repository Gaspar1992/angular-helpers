import { Injectable } from '@angular/core';
import { BrowserApiBaseService } from './base/browser-api-base.service';
import type { BrowserCapabilityId } from './browser-capability.service';

export interface EyeDropperResult {
  sRGBHex: string;
}

interface EyeDropperLike {
  open(options?: { signal?: AbortSignal }): Promise<EyeDropperResult>;
}

interface WindowWithEyeDropper extends Window {
  EyeDropper?: {
    new (): EyeDropperLike;
  };
}

@Injectable({
  providedIn: 'root',
})
export class EyeDropperService extends BrowserApiBaseService {
  protected override getApiName(): string {
    return 'eye-dropper';
  }

  protected override getCapabilityId(): BrowserCapabilityId {
    return 'eyeDropper';
  }

  /** Override to also assert secure context (required by the spec). */
  override isSupported(): boolean {
    return (
      super.isSupported() &&
      typeof window !== 'undefined' &&
      'EyeDropper' in window &&
      window.isSecureContext
    );
  }

  protected override ensureSupported(): void {
    super.ensureSupported();
    if (!window.isSecureContext) {
      throw new Error('EyeDropper API requires a secure context (HTTPS)');
    }
  }

  /**
   * Opens the system eye dropper tool and returns the selected color.
   *
   * @param options Optional configuration including an AbortSignal to cancel the dropper.
   * @returns A promise that resolves with the selected color in sRGB Hex format (e.g., "#000000").
   * @throws DOMException if the user cancels the selection (AbortError).
   */
  async open(options?: { signal?: AbortSignal }): Promise<EyeDropperResult> {
    this.ensureSupported();

    const EyeDropperClass = (window as unknown as WindowWithEyeDropper).EyeDropper;
    if (!EyeDropperClass) {
      throw new Error('EyeDropper is not supported in this browser.');
    }

    const eyeDropper = new EyeDropperClass();
    return eyeDropper.open(options);
  }
}
