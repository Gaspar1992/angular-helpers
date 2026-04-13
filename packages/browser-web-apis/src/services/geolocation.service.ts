import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BrowserApiBaseService } from './base/browser-api-base.service';

@Injectable()
export class GeolocationService extends BrowserApiBaseService {
  protected override getApiName(): string {
    return 'geolocation';
  }

  protected override ensureSupported(): void {
    super.ensureSupported();
    if (!('geolocation' in navigator)) {
      throw new Error('Geolocation API not supported in this browser');
    }
  }

  getCurrentPosition(options?: PositionOptions): Promise<GeolocationPosition> {
    this.ensureSupported();

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => {
          this.logError('Error getting position:', error);
          reject(error);
        },
        options,
      );
    });
  }

  watchPosition(options?: PositionOptions): Observable<GeolocationPosition> {
    this.ensureSupported();

    return new Observable<GeolocationPosition>((observer) => {
      const watchId = navigator.geolocation.watchPosition(
        (position) => observer.next(position),
        (error) => {
          this.logError('Error watching position:', error);
          observer.error(error);
        },
        options,
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    });
  }

  clearWatch(watchId: number): void {
    navigator.geolocation.clearWatch(watchId);
  }

  // Direct access to native geolocation API
  getNativeGeolocation(): Geolocation {
    this.ensureSupported();
    return navigator.geolocation;
  }
}
