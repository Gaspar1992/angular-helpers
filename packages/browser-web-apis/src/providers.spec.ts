import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import {
  BrowserWebApisConfig,
  defaultBrowserWebApisConfig,
  provideBrowserWebApis,
} from './providers';
import { PermissionsService } from './services/permissions.service';
import { CameraService } from './services/camera.service';
import { GeolocationService } from './services/geolocation.service';
import { NotificationService } from './services/notification.service';
import { ClipboardService } from './services/clipboard.service';
import { MediaDevicesService } from './services/media-devices.service';
import { BatteryService } from './services/battery.service';
import { WebShareService } from './services/web-share.service';
import { WebStorageService } from './services/web-storage.service';
import { WebSocketService } from './services/web-socket.service';
import { WebWorkerService } from './services/web-worker.service';
import { RegexSecurityService } from './services/regex-security.service';

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
  const allDisabledConfig: BrowserWebApisConfig = {
    enableCamera: false,
    enableGeolocation: false,
    enableNotifications: false,
    enableClipboard: false,
    enableMediaDevices: false,
    enableBattery: false,
    enableWebShare: false,
    enableWebStorage: false,
    enableWebSocket: false,
    enableWebWorker: false,
    enableRegexSecurity: false,
  };

  it('always provides PermissionsService even when all flags are false', () => {
    const providers = extractProviders(allDisabledConfig);
    expect(hasProvider(providers, PermissionsService)).toBe(true);
  });

  it('does not provide optional services when all flags are false', () => {
    const providers = extractProviders(allDisabledConfig);

    expect(hasProvider(providers, CameraService)).toBe(false);
    expect(hasProvider(providers, GeolocationService)).toBe(false);
    expect(hasProvider(providers, NotificationService)).toBe(false);
    expect(hasProvider(providers, ClipboardService)).toBe(false);
    expect(hasProvider(providers, MediaDevicesService)).toBe(false);
    expect(hasProvider(providers, BatteryService)).toBe(false);
    expect(hasProvider(providers, WebShareService)).toBe(false);
    expect(hasProvider(providers, WebStorageService)).toBe(false);
    expect(hasProvider(providers, WebSocketService)).toBe(false);
    expect(hasProvider(providers, WebWorkerService)).toBe(false);
    expect(hasProvider(providers, RegexSecurityService)).toBe(false);
  });

  it('enables only the explicitly configured optional services', () => {
    const providers = extractProviders({
      ...allDisabledConfig,
      enableBattery: true,
      enableWebStorage: true,
    });

    expect(hasProvider(providers, PermissionsService)).toBe(true);
    expect(hasProvider(providers, BatteryService)).toBe(true);
    expect(hasProvider(providers, WebStorageService)).toBe(true);
    expect(hasProvider(providers, CameraService)).toBe(false);
    expect(hasProvider(providers, RegexSecurityService)).toBe(false);
  });

  it('uses default config values when no config is provided', () => {
    const providers = extractProviders();

    expect(hasProvider(providers, PermissionsService)).toBe(true);
    expect(hasProvider(providers, CameraService)).toBe(
      Boolean(defaultBrowserWebApisConfig.enableCamera),
    );
    expect(hasProvider(providers, RegexSecurityService)).toBe(
      Boolean(defaultBrowserWebApisConfig.enableRegexSecurity),
    );
    expect(hasProvider(providers, BatteryService)).toBe(
      Boolean(defaultBrowserWebApisConfig.enableBattery),
    );
    expect(hasProvider(providers, WebStorageService)).toBe(
      Boolean(defaultBrowserWebApisConfig.enableWebStorage),
    );
  });
});
