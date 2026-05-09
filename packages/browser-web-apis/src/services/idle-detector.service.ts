import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BrowserApiBaseService } from './base/browser-api-base.service';
import type { BrowserCapabilityId } from './browser-capability.service';

export type UserIdleState = 'active' | 'idle';
export type ScreenIdleState = 'locked' | 'unlocked';

export interface IdleState {
  userState: UserIdleState | null;
  screenState: ScreenIdleState | null;
}

export interface IdleDetectorOptions {
  /** The minimum number of milliseconds of inactivity before the user is considered idle. Must be at least 60000. */
  threshold: number;
  /** An AbortSignal to abort the idle detection. */
  signal?: AbortSignal;
}

interface IdleDetectorLike extends EventTarget {
  readonly userState: UserIdleState | null;
  readonly screenState: ScreenIdleState | null;
  start(options?: IdleDetectorOptions): Promise<void>;
}

interface WindowWithIdleDetector extends Window {
  IdleDetector?: {
    new (): IdleDetectorLike;
    requestPermission(): Promise<PermissionState>;
  };
}

@Injectable()
export class IdleDetectorService extends BrowserApiBaseService {
  protected override getApiName(): string {
    return 'idle-detector';
  }

  protected override getCapabilityId(): BrowserCapabilityId {
    return 'idleDetector';
  }

  override isSupported(): boolean {
    return (
      super.isSupported() &&
      typeof window !== 'undefined' &&
      'IdleDetector' in window &&
      window.isSecureContext
    );
  }

  protected override ensureSupported(): void {
    super.ensureSupported();
    if (!window.isSecureContext) {
      throw new Error('IdleDetector API requires a secure context (HTTPS)');
    }
  }

  async requestPermission(): Promise<PermissionState> {
    this.ensureSupported();
    const IdleDetectorClass = (window as unknown as WindowWithIdleDetector).IdleDetector!;
    return IdleDetectorClass.requestPermission();
  }

  /**
   * Starts tracking idle state. Emits the current state and subsequent changes.
   * Note: You must call requestPermission() and be granted access before starting.
   *
   * @param options Configuration for the idle detector, including the threshold (minimum 60000ms).
   * @returns An Observable of the IdleState.
   */
  watch(options: IdleDetectorOptions): Observable<IdleState> {
    return new Observable<IdleState>((observer) => {
      this.ensureSupported();

      const IdleDetectorClass = (window as unknown as WindowWithIdleDetector).IdleDetector!;
      const detector = new IdleDetectorClass();

      const emit = () => {
        observer.next({
          userState: detector.userState,
          screenState: detector.screenState,
        });
      };

      detector.addEventListener('change', emit);

      // We use a custom AbortController if one wasn't provided,
      // so we can abort the detector when the observable is unsubscribed.
      const abortController = new AbortController();
      const signal = options.signal || abortController.signal;

      const combinedOptions = { ...options, signal };

      // Stop tracking if an external signal aborts
      if (options.signal) {
        options.signal.addEventListener(
          'abort',
          () => {
            observer.complete();
          },
          { once: true },
        );
      }

      detector.start(combinedOptions).catch((err) => {
        observer.error(err);
      });

      return () => {
        detector.removeEventListener('change', emit);
        if (!signal.aborted) {
          abortController.abort();
        }
      };
    });
  }
}
