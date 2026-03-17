import { Injectable, signal, inject } from '@angular/core';
import { from, Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { 
  GeolocationPosition, 
  GeolocationOptions, 
  GeolocationError,
  GeolocationWatchOptions 
} from '../interfaces/geolocation.interface';
import { BrowserSupportUtil } from '../utils/browser-support.util';
import { PermissionsService } from './permissions.service';
import { BrowserApiBaseService } from './base/browser-api-base.service';

@Injectable()
export class GeolocationService extends BrowserApiBaseService {
  private currentPosition = signal<GeolocationPosition | null>(null);
  private watchPositions = signal<Map<number, GeolocationPosition>>(new Map());
  private watchErrors = signal<Map<number, GeolocationError>>(new Map());

  readonly currentPosition$ = this.currentPosition.asReadonly();
  readonly watchPositions$ = this.watchPositions.asReadonly();
  readonly watchErrors$ = this.watchErrors.asReadonly();

  protected override getApiName(): string {
    return 'geolocation';
  }

  protected override async onInitialize(): Promise<void> {
    await super.onInitialize();
    this.logInfo('Geolocation service initialized');
  }

  async getCurrentPosition(options?: GeolocationOptions): Promise<GeolocationPosition> {
    if (!this.isSupported()) {
      throw new Error('Geolocation API not supported');
    }

    try {
      // Verificar permisos
      const hasPermission = await this.permissionsService.isGranted('geolocation');
      if (!hasPermission) {
        await this.permissionsService.request({ name: 'geolocation' });
      }

      const position = await this.requestCurrentPosition(options);
      this.currentPosition.set(position);
      return position;
    } catch (error) {
      console.error('Error getting current position:', error);
      throw this.createGeolocationError(error);
    }
  }

  watchPosition(
    successCallback: (position: GeolocationPosition) => void,
    errorCallback?: (error: GeolocationError) => void,
    options?: GeolocationWatchOptions
  ): number {
    if (!this.isSupported()) {
      throw new Error('Geolocation API not supported');
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const geoPosition: GeolocationPosition = {
          coords: position.coords,
          timestamp: position.timestamp
        };
        
        this.watchPositions.update(map => map.set(watchId, geoPosition));
        successCallback(geoPosition);
      },
      (error) => {
        const geoError = this.createGeolocationError(error);
        this.watchErrors.update(map => map.set(watchId, geoError));
        if (errorCallback) {
          errorCallback(geoError);
        }
      },
      options
    );

    return watchId;
  }

  clearWatch(watchId: number): void {
    if (!this.isSupported()) {
      return;
    }

    navigator.geolocation.clearWatch(watchId);
    this.watchPositions.update(map => {
      map.delete(watchId);
      return map;
    });
    this.watchErrors.update(map => {
      map.delete(watchId);
      return map;
    });
  }

  clearAllWatches(): void {
    const watchIds = Array.from(this.watchPositions().keys());
    watchIds.forEach(id => this.clearWatch(id));
  }

  override isSupported(): boolean {
    return super.isSupported();
  }

  hasPermission(): Promise<boolean> {
    return Promise.resolve(this.permissionsService.isGranted('geolocation'));
  }

  requestPermission(): Promise<boolean> {
    return this.permissionsService.request({ name: 'geolocation' })
      .then(status => status.state === 'granted');
  }

  observePosition(options?: GeolocationOptions): Observable<GeolocationPosition> {
    return from(this.getCurrentPosition(options)).pipe(
      catchError(error => {
        console.error('Error observing position:', error);
        return from([null as any]);
      })
    );
  }

  calculateDistance(
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  isWithinRadius(
    centerLat: number,
    centerLon: number,
    targetLat: number,
    targetLon: number,
    radiusMeters: number
  ): boolean {
    const distance = this.calculateDistance(centerLat, centerLon, targetLat, targetLon);
    return distance <= radiusMeters;
  }

  formatCoordinates(position: GeolocationPosition): string {
    const { latitude, longitude } = position.coords;
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  }

  formatAccuracy(position: GeolocationPosition): string {
    const { accuracy } = position.coords;
    return `±${accuracy.toFixed(0)}m`;
  }

  getAddressFromCoordinates(position: GeolocationPosition): Promise<string> {
    // Esta función requeriría una API de geocodificación como Google Maps o Nominatim
    // Por ahora es un placeholder
    return new Promise((resolve) => {
      resolve(this.formatCoordinates(position));
    });
  }

  private async requestCurrentPosition(options?: GeolocationOptions): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            coords: position.coords,
            timestamp: position.timestamp
          });
        },
        (error) => {
          reject(this.createGeolocationError(error));
        },
        options
      );
    });
  }

  private createGeolocationError(error: any): GeolocationError {
    const geoError: GeolocationError = {
      code: error.code || 0,
      message: error.message || 'Unknown geolocation error',
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3
    };
    return geoError;
  }

  protected override onDestroy(): void {
    this.clearAllWatches();
    super.onDestroy();
  }
}
