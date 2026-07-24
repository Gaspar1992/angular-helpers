import {
  assertInInjectionContext,
  DestroyRef,
  computed,
  inject,
  PLATFORM_ID,
  signal,
  type Signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type { IdleState, IdleDetectorOptions } from '../services/idle-detector.service';

export interface IdleDetectorRef {
  readonly isSupported: Signal<boolean>;
  readonly state: Signal<IdleState | null>;
  readonly error: Signal<Error | null>;
  readonly isTracking: Signal<boolean>;
  readonly isIdle: Signal<boolean>;
  start(options: IdleDetectorOptions): Promise<void>;
  stop(): void;
  requestPermission(): Promise<PermissionState>;
}

interface WindowWithIdleDetector extends Window {
  IdleDetector?: any;
}

export function injectIdleDetector(): IdleDetectorRef {
  assertInInjectionContext(injectIdleDetector);
  const platformId = inject(PLATFORM_ID);
  const destroyRef = inject(DestroyRef);
  const isBrowser = isPlatformBrowser(platformId);

  const supported = signal<boolean>(false);
  const state = signal<IdleState | null>(null);
  const error = signal<Error | null>(null);
  const isTracking = signal<boolean>(false);

  let detector: any = null;
  let abortController: AbortController | null = null;
  let disposed = false;

  const onStateChange = () => {
    if (disposed || !detector) return;
    state.set({
      userState: detector.userState,
      screenState: detector.screenState,
    });
  };

  if (isBrowser) {
    let destroyed = false;
    queueMicrotask(() => {
      if (destroyed) return;
      const hasDetector = typeof window !== 'undefined' && 'IdleDetector' in window;
      supported.set(hasDetector && window.isSecureContext);
    });

    destroyRef.onDestroy(() => {
      destroyed = true;
      disposed = true;
      stop();
    });
  } else {
    destroyRef.onDestroy(() => {
      disposed = true;
      stop();
    });
  }

  const stop = () => {
    if (detector) {
      detector.removeEventListener('change', onStateChange);
    }
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
    detector = null;
    if (!disposed) {
      isTracking.set(false);
    }
  };

  const requestPermission = async (): Promise<PermissionState> => {
    if (!supported()) return 'denied';
    const IdleDetectorClass = (window as unknown as WindowWithIdleDetector).IdleDetector;
    return IdleDetectorClass.requestPermission();
  };

  const start = async (options: IdleDetectorOptions): Promise<void> => {
    if (!supported() || disposed) {
      error.set(new Error('IdleDetector API is not supported in this environment'));
      return;
    }

    stop();
    error.set(null);

    const IdleDetectorClass = (window as unknown as WindowWithIdleDetector).IdleDetector;
    detector = new IdleDetectorClass();

    abortController = new AbortController();
    const combinedSignal = options.signal
      ? abortSignalAny([options.signal, abortController.signal])
      : abortController.signal;

    detector.addEventListener('change', onStateChange);

    try {
      await detector.start({ ...options, signal: combinedSignal });
      if (!disposed) {
        isTracking.set(true);
        // Initial state emit
        onStateChange();
      }
    } catch (e) {
      stop();
      if (!disposed) {
        if (e instanceof DOMException && e.name === 'AbortError') {
          // Expected when stopped manually
          return;
        }
        error.set(e instanceof Error ? e : new Error(String(e)));
      }
    }
  };

  // Helper to combine abort signals since AbortSignal.any is relatively new
  function abortSignalAny(signals: AbortSignal[]): AbortSignal {
    if (typeof AbortSignal !== 'undefined' && 'any' in AbortSignal) {
      return (AbortSignal as any).any(signals);
    }

    const controller = new AbortController();
    for (const s of signals) {
      if (s.aborted) {
        controller.abort(s.reason);
        return controller.signal;
      }
      s.addEventListener('abort', () => controller.abort(s.reason), { once: true });
    }
    return controller.signal;
  }

  return {
    isSupported: supported.asReadonly(),
    state: state.asReadonly(),
    error: error.asReadonly(),
    isTracking: isTracking.asReadonly(),
    isIdle: computed(() => state()?.userState === 'idle'),
    start,
    stop,
    requestPermission,
  };
}
