export interface GeolocationPosition {
  coords: GeolocationCoordinates;
  timestamp: number;
}

export interface GeolocationCoordinates {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export interface GeolocationError {
  code: number;
  message: string;
  PERMISSION_DENIED: number;
  POSITION_UNAVAILABLE: number;
  TIMEOUT: number;
}

export interface GeolocationWatchOptions extends GeolocationOptions {
  maximumAge?: number;
}

export interface GeolocationService {
  getCurrentPosition(options?: GeolocationOptions): Promise<GeolocationPosition>;
  watchPosition(
    successCallback: (position: GeolocationPosition) => void,
    errorCallback?: (error: GeolocationError) => void,
    options?: GeolocationWatchOptions,
  ): number;
  clearWatch(watchId: number): void;
  isSupported(): boolean;
}
