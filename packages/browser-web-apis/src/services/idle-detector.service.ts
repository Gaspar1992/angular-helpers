import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';

export type UserIdleState = 'active' | 'idle';
export type ScreenIdleState = 'locked' | 'unlocked';

export interface IdleState {
  user: UserIdleState;
  screen: ScreenIdleState;
}

export interface IdleDetectorOptions {
  threshold?: number;
}

interface IdleDetectorInstance extends EventTarget {
  readonly userState: UserIdleState;
  readonly screenState: ScreenIdleState;
  start(options?: { threshold?: number; signal?: AbortSignal }): Promise<void>;
}

interface IdleDetectorConstructor {
  new (): IdleDetectorInstance;
  requestPermission(): Promise<PermissionState>;
}

function getIdleDetectorClass(): IdleDetectorConstructor | undefined {
  return (window as unknown as { IdleDetector?: IdleDetectorConstructor }).IdleDetector;
}

@Injectable()
export class IdleDetectorService {
  private readonly platformId = inject(PLATFORM_ID);

  isSupported(): boolean {
    return isPlatformBrowser(this.platformId) && 'IdleDetector' in window;
  }

  async requestPermission(): Promise<PermissionState> {
    if (!this.isSupported()) {
      throw new Error('IdleDetector API not supported');
    }
    return getIdleDetectorClass()!.requestPermission();
  }

  watch(options: IdleDetectorOptions = {}): Observable<IdleState> {
    if (!this.isSupported()) {
      return new Observable((o) => o.error(new Error('IdleDetector API not supported')));
    }

    return new Observable<IdleState>((subscriber) => {
      const abortController = new AbortController();
      const detector = new (getIdleDetectorClass()!)();

      detector.addEventListener('change', () => {
        subscriber.next({
          user: detector.userState,
          screen: detector.screenState,
        });
      });

      detector
        .start({
          threshold: options.threshold ?? 60_000,
          signal: abortController.signal,
        })
        .catch((err: unknown) => subscriber.error(err));

      return () => abortController.abort();
    });
  }
}
