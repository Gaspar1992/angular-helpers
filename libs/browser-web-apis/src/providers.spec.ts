import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import {
  BrowserWebApisConfig,
  provideBrowserWebApis,
  provideCamera,
  provideGeolocation,
  provideBattery,
  provideWebStorage,
  provideDeviceOrientation,
  provideDeviceMotion,
  providePermissions,
  provideNotifications,
  provideClipboard,
  provideMediaDevices,
  provideScreenWakeLock,
  provideFileSystemAccess,
  provideMediaRecorder,
  provideWebShare,
  provideWebSocket,
  provideWebTransport,
  provideWebWorker,
  provideIntersectionObserver,
  provideResizeObserver,
  providePageVisibility,
  provideBroadcastChannel,
  provideNetworkInformation,
  provideScreenOrientation,
  provideFullscreen,
  provideServerSentEvents,
  provideVibration,
  provideSpeechSynthesis,
  provideSpeechRecognition,
  provideMutationObserver,
  providePerformanceObserver,
  provideWebAudio,
  provideGamepad,
  provideWebLocks,
  provideStorageManager,
  provideCompression,
  provideEyeDropper,
  provideIdleDetector,
  provideBarcodeDetector,
  provideCredentialManagement,
  provideWebBluetooth,
  provideWebSerial,
  provideWebHid,
  provideMediaApis,
  provideLocationApis,
  provideStorageApis,
  provideCommunicationApis,
  WEB_TRANSPORT_SUPPORTED,
  WEB_TRANSPORT_TOKEN,
} from './providers';
import { PermissionsService } from './services/permissions.service';
import { CameraService } from './services/camera.service';
import { GeolocationService } from './services/geolocation.service';
import { BatteryService } from './services/battery.service';
import { WebStorageService } from './services/web-storage.service';
import { DeviceOrientationService } from './services/device-orientation.service';
import { DeviceMotionService } from './services/device-motion.service';
import { NotificationService } from './services/notification.service';
import { ClipboardService } from './services/clipboard.service';
import { MediaDevicesService } from './services/media-devices.service';
import { ScreenWakeLockService } from './services/screen-wake-lock.service';
import { FileSystemAccessService } from './services/file-system-access.service';
import { MediaRecorderService } from './services/media-recorder.service';
import { WebShareService } from './services/web-share.service';
import { WebSocketService } from './services/web-socket.service';
import { WebTransportService } from './services/web-transport.service';
import { WebWorkerService } from './services/web-worker.service';
import { IntersectionObserverService } from './services/intersection-observer.service';
import { ResizeObserverService } from './services/resize-observer.service';
import { PageVisibilityService } from './services/page-visibility.service';
import { BroadcastChannelService } from './services/broadcast-channel.service';
import { NetworkInformationService } from './services/network-information.service';
import { ScreenOrientationService } from './services/screen-orientation.service';
import { FullscreenService } from './services/fullscreen.service';
import { ServerSentEventsService } from './services/server-sent-events.service';
import { VibrationService } from './services/vibration.service';
import { SpeechSynthesisService } from './services/speech-synthesis.service';
import { SpeechRecognitionService } from './services/speech-recognition.service';
import { MutationObserverService } from './services/mutation-observer.service';
import { PerformanceObserverService } from './services/performance-observer.service';
import { WebAudioService } from './services/web-audio.service';
import { GamepadService } from './services/gamepad.service';
import { WebLocksService } from './services/web-locks.service';
import { StorageManagerService } from './services/storage-manager.service';
import { CompressionService } from './services/compression.service';
import { EyeDropperService } from './services/eye-dropper.service';
import { IdleDetectorService } from './services/idle-detector.service';
import { BarcodeDetectorService } from './services/barcode-detector.service';
import { CredentialManagementService } from './services/credential-management.service';
import { WebBluetoothService } from './services/web-bluetooth.service';
import { WebSerialService } from './services/web-serial.service';
import { WebHidService } from './services/web-hid.service';

type EnvironmentProvidersLike = {
  ɵproviders: unknown[];
};

function extractProviders(config?: BrowserWebApisConfig): unknown[] {
  return (provideBrowserWebApis(config) as unknown as EnvironmentProvidersLike).ɵproviders;
}

function hasProvider(providers: unknown[], service: unknown): boolean {
  return providers.some((p: any) => p === service || p?.provide === service);
}

describe('Browser Web APIs Providers', () => {
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

  describe('Individual providers', () => {
    const singleCases: [string, () => unknown, unknown][] = [
      ['providePermissions', providePermissions, PermissionsService],
      ['provideCamera', provideCamera, CameraService],
      ['provideGeolocation', provideGeolocation, GeolocationService],
      ['provideNotifications', provideNotifications, NotificationService],
      ['provideClipboard', provideClipboard, ClipboardService],
      ['provideMediaDevices', provideMediaDevices, MediaDevicesService],
      ['provideScreenWakeLock', provideScreenWakeLock, ScreenWakeLockService],
      ['provideFileSystemAccess', provideFileSystemAccess, FileSystemAccessService],
      ['provideMediaRecorder', provideMediaRecorder, MediaRecorderService],
      ['provideBattery', provideBattery, BatteryService],
      ['provideWebShare', provideWebShare, WebShareService],
      ['provideWebStorage', provideWebStorage, WebStorageService],
      ['provideWebSocket', provideWebSocket, WebSocketService],
      ['provideWebWorker', provideWebWorker, WebWorkerService],
      ['provideIntersectionObserver', provideIntersectionObserver, IntersectionObserverService],
      ['provideResizeObserver', provideResizeObserver, ResizeObserverService],
      ['providePageVisibility', providePageVisibility, PageVisibilityService],
      ['provideBroadcastChannel', provideBroadcastChannel, BroadcastChannelService],
      ['provideNetworkInformation', provideNetworkInformation, NetworkInformationService],
      ['provideScreenOrientation', provideScreenOrientation, ScreenOrientationService],
      ['provideFullscreen', provideFullscreen, FullscreenService],
      ['provideServerSentEvents', provideServerSentEvents, ServerSentEventsService],
      ['provideVibration', provideVibration, VibrationService],
      ['provideSpeechSynthesis', provideSpeechSynthesis, SpeechSynthesisService],
      ['provideSpeechRecognition', provideSpeechRecognition, SpeechRecognitionService],
      ['provideMutationObserver', provideMutationObserver, MutationObserverService],
      ['providePerformanceObserver', providePerformanceObserver, PerformanceObserverService],
      ['provideWebAudio', provideWebAudio, WebAudioService],
      ['provideGamepad', provideGamepad, GamepadService],
      ['provideWebLocks', provideWebLocks, WebLocksService],
      ['provideStorageManager', provideStorageManager, StorageManagerService],
      ['provideCompression', provideCompression, CompressionService],
      ['provideEyeDropper', provideEyeDropper, EyeDropperService],
      ['provideIdleDetector', provideIdleDetector, IdleDetectorService],
      ['provideBarcodeDetector', provideBarcodeDetector, BarcodeDetectorService],
      ['provideCredentialManagement', provideCredentialManagement, CredentialManagementService],
      ['provideDeviceOrientation', provideDeviceOrientation, DeviceOrientationService],
      ['provideDeviceMotion', provideDeviceMotion, DeviceMotionService],
      ['provideWebBluetooth', provideWebBluetooth, WebBluetoothService],
      ['provideWebSerial', provideWebSerial, WebSerialService],
      ['provideWebHid', provideWebHid, WebHidService],
    ];

    it.each(singleCases)('%s returns provider containing %s', (_name, factory, expectedService) => {
      const ep = factory() as unknown as EnvironmentProvidersLike;
      expect(hasProvider(ep.ɵproviders, expectedService)).toBe(true);
    });

    it('provideWebTransport provides WebTransportService and associated tokens are defined', () => {
      const ep = provideWebTransport() as unknown as EnvironmentProvidersLike;
      expect(hasProvider(ep.ɵproviders, WebTransportService)).toBe(true);
      expect(WEB_TRANSPORT_SUPPORTED).toBeDefined();
      expect(WEB_TRANSPORT_TOKEN).toBeDefined();
    });
  });

  describe('Combo providers', () => {
    it('provideMediaApis includes Camera, MediaDevices and Permissions', () => {
      const ep = provideMediaApis() as unknown as EnvironmentProvidersLike;
      expect(hasProvider(ep.ɵproviders, CameraService)).toBe(true);
      expect(hasProvider(ep.ɵproviders, MediaDevicesService)).toBe(true);
      expect(hasProvider(ep.ɵproviders, PermissionsService)).toBe(true);
    });

    it('provideLocationApis includes Geolocation and Permissions', () => {
      const ep = provideLocationApis() as unknown as EnvironmentProvidersLike;
      expect(hasProvider(ep.ɵproviders, GeolocationService)).toBe(true);
      expect(hasProvider(ep.ɵproviders, PermissionsService)).toBe(true);
    });

    it('provideStorageApis includes WebStorage, Clipboard and Permissions', () => {
      const ep = provideStorageApis() as unknown as EnvironmentProvidersLike;
      expect(hasProvider(ep.ɵproviders, WebStorageService)).toBe(true);
      expect(hasProvider(ep.ɵproviders, ClipboardService)).toBe(true);
      expect(hasProvider(ep.ɵproviders, PermissionsService)).toBe(true);
    });

    it('provideCommunicationApis includes WebSocket, Notification, WebShare and Permissions', () => {
      const ep = provideCommunicationApis() as unknown as EnvironmentProvidersLike;
      expect(hasProvider(ep.ɵproviders, WebSocketService)).toBe(true);
      expect(hasProvider(ep.ɵproviders, NotificationService)).toBe(true);
      expect(hasProvider(ep.ɵproviders, WebShareService)).toBe(true);
      expect(hasProvider(ep.ɵproviders, PermissionsService)).toBe(true);
    });
  });
});
