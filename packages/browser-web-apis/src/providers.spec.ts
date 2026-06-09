import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import {
  BrowserWebApisConfig,
  provideBrowserWebApis,
  provideCamera,
  provideGeolocation,
  provideBattery,
  provideWebStorage,
} from './providers';
import { PermissionsService } from './services/permissions.service';
import { CameraService } from './services/camera.service';
import { GeolocationService } from './services/geolocation.service';
import { BatteryService } from './services/battery.service';
import { WebStorageService } from './services/web-storage.service';

type EnvironmentProvidersLike = {
  ɵproviders: unknown[];
};

function extractProviders(config?: BrowserWebApisConfig): unknown[] {
  return (provideBrowserWebApis(config) as unknown as EnvironmentProvidersLike).ɵproviders;
}

function hasProvider(providers: unknown[], service: unknown): boolean {
  return providers.includes(service);
}

describe('provideBrowserWebApis', () => {
  it('always provides PermissionsService by default', () => {
    const providers = extractProviders();
    expect(hasProvider(providers, PermissionsService)).toBe(true);
  });

  it('provides PermissionsService and composition-configured services', () => {
    const providers = extractProviders({
      services: [provideCamera(), provideGeolocation()],
    });

    expect(hasProvider(providers, PermissionsService)).toBe(true);
    expect(hasProvider(providers, CameraService)).toBe(true);
    expect(hasProvider(providers, GeolocationService)).toBe(true);
    expect(hasProvider(providers, BatteryService)).toBe(false);
  });

  it('does not provide optional services when not specified in services array', () => {
    const providers = extractProviders({
      services: [provideBattery(), provideWebStorage()],
    });

    expect(hasProvider(providers, PermissionsService)).toBe(true);
    expect(hasProvider(providers, BatteryService)).toBe(true);
    expect(hasProvider(providers, WebStorageService)).toBe(true);
    expect(hasProvider(providers, CameraService)).toBe(false);
    expect(hasProvider(providers, GeolocationService)).toBe(false);
  });
});
