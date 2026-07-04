import { Observable, of } from 'rxjs';
import { throttleTime } from 'rxjs';
import { NgZone } from '@angular/core';

export interface DeviceSensorConfig {
  runOutsideAngular?: boolean;
  throttleTime?: number;
}

export interface DeviceOrientationData {
  alpha: number | null;
  beta: number | null;
  gamma: number | null;
  absolute: boolean;
}

export interface DeviceMotionData {
  acceleration: DeviceMotionEventAcceleration | null;
  accelerationIncludingGravity: DeviceMotionEventAcceleration | null;
  rotationRate: DeviceMotionEventRotationRate | null;
  interval: number;
}

export function isDeviceOrientationSupported(): boolean {
  return typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;
}

export function isDeviceMotionSupported(): boolean {
  return typeof window !== 'undefined' && 'DeviceMotionEvent' in window;
}

export async function requestDeviceOrientationPermission(): Promise<PermissionState> {
  if (
    typeof DeviceOrientationEvent !== 'undefined' &&
    typeof (DeviceOrientationEvent as any).requestPermission === 'function'
  ) {
    return (DeviceOrientationEvent as any).requestPermission();
  }
  return 'granted';
}

export async function requestDeviceMotionPermission(): Promise<PermissionState> {
  if (
    typeof DeviceMotionEvent !== 'undefined' &&
    typeof (DeviceMotionEvent as any).requestPermission === 'function'
  ) {
    return (DeviceMotionEvent as any).requestPermission();
  }
  return 'granted';
}

export function createDeviceOrientationStream(
  config?: DeviceSensorConfig,
  zone?: NgZone,
): Observable<DeviceOrientationData | null> {
  if (!isDeviceOrientationSupported()) {
    return of(null);
  }

  const stream$ = new Observable<DeviceOrientationData | null>((subscriber) => {
    const handler = (event: DeviceOrientationEvent) => {
      subscriber.next({
        alpha: event.alpha,
        beta: event.beta,
        gamma: event.gamma,
        absolute: event.absolute,
      });
    };

    const register = () => {
      window.addEventListener('deviceorientation', handler);
    };

    if (config?.runOutsideAngular !== false && zone) {
      zone.runOutsideAngular(register);
    } else {
      register();
    }

    return () => {
      window.removeEventListener('deviceorientation', handler);
    };
  });

  if (config?.throttleTime !== undefined && config.throttleTime > 0) {
    return stream$.pipe(throttleTime(config.throttleTime));
  }

  return stream$;
}

export function createDeviceMotionStream(
  config?: DeviceSensorConfig,
  zone?: NgZone,
): Observable<DeviceMotionData | null> {
  if (!isDeviceMotionSupported()) {
    return of(null);
  }

  const stream$ = new Observable<DeviceMotionData | null>((subscriber) => {
    const handler = (event: DeviceMotionEvent) => {
      subscriber.next({
        acceleration: event.acceleration,
        accelerationIncludingGravity: event.accelerationIncludingGravity,
        rotationRate: event.rotationRate,
        interval: event.interval,
      });
    };

    const register = () => {
      window.addEventListener('devicemotion', handler);
    };

    if (config?.runOutsideAngular !== false && zone) {
      zone.runOutsideAngular(register);
    } else {
      register();
    }

    return () => {
      window.removeEventListener('devicemotion', handler);
    };
  });

  if (config?.throttleTime !== undefined && config.throttleTime > 0) {
    return stream$.pipe(throttleTime(config.throttleTime));
  }

  return stream$;
}
