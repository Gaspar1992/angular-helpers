import { DestroyRef, inject, PLATFORM_ID, signal, type Signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface GeolocationOptions extends PositionOptions {
  /** Start watching immediately. Defaults to `false`. */
  watch?: boolean;
}

export interface GeolocationRef {
  readonly position: Signal<GeolocationPosition | null>;
  readonly error: Signal<GeolocationPositionError | null>;
  readonly watching: Signal<boolean>;
  readonly isSupported: Signal<boolean>;
  /** Start watching position. Idempotent — safe to call when already watching. */
  watch(opts?: PositionOptions): void;
  /** Stop watching. Idempotent. */
  stop(): void;
  /** One-shot read of the current position. */
  getCurrent(opts?: PositionOptions): Promise<GeolocationPosition>;
}

export function injectGeolocation(opts: GeolocationOptions = {}): GeolocationRef {
  const destroyRef = inject(DestroyRef);
  const platformId = inject(PLATFORM_ID);

  const isBrowser = isPlatformBrowser(platformId);
  const supported = signal<boolean>(
    isBrowser && typeof navigator !== 'undefined' && 'geolocation' in navigator,
  );
  const position = signal<GeolocationPosition | null>(null);
  const error = signal<GeolocationPositionError | null>(null);
  const watching = signal<boolean>(false);
  let watchId: number | null = null;

  const watch = (positionOpts?: PositionOptions): void => {
    if (!supported() || watchId !== null) return;
    watching.set(true);
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        position.set(pos);
        error.set(null);
      },
      (err) => error.set(err),
      positionOpts,
    );
  };

  const stop = (): void => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
    watching.set(false);
  };

  const getCurrent = (positionOpts?: PositionOptions): Promise<GeolocationPosition> => {
    if (!supported()) {
      return Promise.reject(new Error('Geolocation API not supported'));
    }
    return new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          position.set(pos);
          error.set(null);
          resolve(pos);
        },
        (err) => {
          error.set(err);
          reject(err);
        },
        positionOpts,
      );
    });
  };

  destroyRef.onDestroy(() => stop());

  if (opts.watch) watch(opts);

  return {
    position: position.asReadonly(),
    error: error.asReadonly(),
    watching: watching.asReadonly(),
    isSupported: supported.asReadonly(),
    watch,
    stop,
    getCurrent,
  };
}
