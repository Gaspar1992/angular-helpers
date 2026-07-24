import { Observable, of } from 'rxjs';

import { type OrientationInfo, type OrientationType } from '../services/screen-orientation.service';

export type { OrientationInfo, OrientationType };

export function isScreenOrientationSupported(): boolean {
  return typeof window !== 'undefined' && 'screen' in window && 'orientation' in screen;
}

export function getOrientationSnapshot(): OrientationInfo {
  if (!isScreenOrientationSupported()) {
    return { type: 'portrait-primary', angle: 0 };
  }
  return {
    type: screen.orientation.type as OrientationType,
    angle: screen.orientation.angle,
  };
}

export function screenOrientationStream(): Observable<OrientationInfo> {
  if (!isScreenOrientationSupported()) {
    return of({ type: 'portrait-primary' as OrientationType, angle: 0 });
  }

  return new Observable<OrientationInfo>((observer) => {
    const handler = () => observer.next(getOrientationSnapshot());
    screen.orientation.addEventListener('change', handler);
    observer.next(getOrientationSnapshot());
    return () => screen.orientation.removeEventListener('change', handler);
  });
}
