import {
  computed,
  inject,
  PLATFORM_ID,
  signal,
  type Signal,
  type ResourceRef,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';

export interface GeolocationResourceOptions extends PositionOptions {
  /** Start watching immediately. Defaults to `false`. */
  watch?: boolean;
}

export interface GeolocationResourceRef {
  readonly resource: ResourceRef<GeolocationPosition | null>;
  readonly position: Signal<GeolocationPosition | null | undefined>;
  readonly error: Signal<unknown>;
  readonly watching: Signal<boolean>;
  readonly isSupported: Signal<boolean>;
  /** Start watching position. Idempotent — safe to call when already watching. */
  watch(opts?: PositionOptions): void;
  /** Stop watching. Idempotent. */
  stop(): void;
  /** One-shot read of the current position. */
  getCurrent(opts?: PositionOptions): Promise<GeolocationPosition>;
}

export function injectGeolocationResource(
  opts: GeolocationResourceOptions = {},
): GeolocationResourceRef {
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);

  const supported = signal<boolean>(false);
  if (isBrowser) {
    supported.set(typeof navigator !== 'undefined' && 'geolocation' in navigator);
  }

  const requestState = signal<GeolocationResourceOptions & { trigger?: number }>({
    watch: opts.watch ?? false,
    enableHighAccuracy: opts.enableHighAccuracy,
    maximumAge: opts.maximumAge,
    timeout: opts.timeout,
    trigger: 0,
  });

  const resource = rxResource<
    GeolocationPosition | null,
    GeolocationResourceOptions & { trigger?: number }
  >({
    params: () => requestState(),
    stream: ({ params: request, abortSignal }) => {
      if (!isBrowser || !supported()) {
        throw new Error('Geolocation API not supported');
      }

      return new Observable<GeolocationPosition | null>((subscriber) => {
        if (request.watch) {
          const watchId = navigator.geolocation.watchPosition(
            (pos) => {
              subscriber.next(pos);
            },
            (err) => {
              subscriber.error(err);
            },
            request,
          );

          const abortHandler = () => {
            navigator.geolocation.clearWatch(watchId);
            subscriber.complete();
          };
          abortSignal.addEventListener('abort', abortHandler);

          return () => {
            navigator.geolocation.clearWatch(watchId);
            abortSignal.removeEventListener('abort', abortHandler);
          };
        } else {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              subscriber.next(pos);
              subscriber.complete();
            },
            (err) => {
              subscriber.error(err);
            },
            request,
          );

          const abortHandler = () => {
            subscriber.complete();
          };
          abortSignal.addEventListener('abort', abortHandler);

          return () => {
            abortSignal.removeEventListener('abort', abortHandler);
          };
        }
      });
    },
  });

  const watch = (positionOpts?: PositionOptions): void => {
    requestState.update((prev) => ({
      ...prev,
      ...positionOpts,
      watch: true,
      trigger: (prev.trigger ?? 0) + 1,
    }));
  };

  const stop = (): void => {
    requestState.update((prev) => ({
      ...prev,
      watch: false,
      trigger: (prev.trigger ?? 0) + 1,
    }));
  };

  const getCurrent = (positionOpts?: PositionOptions): Promise<GeolocationPosition> => {
    if (!supported()) {
      return Promise.reject(new Error('Geolocation API not supported'));
    }
    return new Promise<GeolocationPosition>((resolve, reject) => {
      requestState.update((prev) => ({
        ...prev,
        ...positionOpts,
        watch: false,
        trigger: (prev.trigger ?? 0) + 1,
      }));

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve(pos);
        },
        (err) => {
          reject(err);
        },
        positionOpts,
      );
    });
  };

  const watching = computed(() => !!requestState().watch);

  return {
    resource: resource as unknown as ResourceRef<GeolocationPosition | null>,
    position: resource.value,
    error: resource.error,
    watching,
    isSupported: supported.asReadonly(),
    watch,
    stop,
    getCurrent,
  };
}
