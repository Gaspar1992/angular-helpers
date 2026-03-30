import { makeEnvironmentProviders, EnvironmentProviders, Provider } from '@angular/core';
import { PermissionsService } from './services/permissions.service';
import { CameraService } from './services/camera.service';
import { GeolocationService } from './services/geolocation.service';
import { MediaDevicesService } from './services/media-devices.service';
import { NotificationService } from './services/notification.service';
import { ClipboardService } from './services/clipboard.service';
import { BatteryService } from './services/battery.service';
import { WebShareService } from './services/web-share.service';
import { WebStorageService } from './services/web-storage.service';
import { WebSocketService } from './services/web-socket.service';
import { WebWorkerService } from './services/web-worker.service';
import { IntersectionObserverService } from './services/intersection-observer.service';
import { ResizeObserverService } from './services/resize-observer.service';
import { PageVisibilityService } from './services/page-visibility.service';
import { BroadcastChannelService } from './services/broadcast-channel.service';
import { NetworkInformationService } from './services/network-information.service';
import { ScreenWakeLockService } from './services/screen-wake-lock.service';
import { ScreenOrientationService } from './services/screen-orientation.service';
import { FullscreenService } from './services/fullscreen.service';
import { FileSystemAccessService } from './services/file-system-access.service';
import { MediaRecorderService } from './services/media-recorder.service';
import { ServerSentEventsService } from './services/server-sent-events.service';
import { VibrationService } from './services/vibration.service';
import { SpeechSynthesisService } from './services/speech-synthesis.service';
import { MutationObserverService } from './services/mutation-observer.service';
import { PerformanceObserverService } from './services/performance-observer.service';
import { IdleDetectorService } from './services/idle-detector.service';
import { EyeDropperService } from './services/eye-dropper.service';
import { BarcodeDetectorService } from './services/barcode-detector.service';
import { WebAudioService } from './services/web-audio.service';
import { GamepadService } from './services/gamepad.service';
import { WebBluetoothService } from './services/web-bluetooth.service';
import { WebUsbService } from './services/web-usb.service';
import { WebNfcService } from './services/web-nfc.service';
import { PaymentRequestService } from './services/payment-request.service';
import { CredentialManagementService } from './services/credential-management.service';

export interface BrowserWebApisConfig {
  enableCamera?: boolean;
  enableGeolocation?: boolean;
  enableNotifications?: boolean;
  enableClipboard?: boolean;
  enableMediaDevices?: boolean;
  enableBattery?: boolean;
  enableWebShare?: boolean;
  enableWebStorage?: boolean;
  enableWebSocket?: boolean;
  enableWebWorker?: boolean;
  enableIntersectionObserver?: boolean;
  enableResizeObserver?: boolean;
  enablePageVisibility?: boolean;
  enableBroadcastChannel?: boolean;
  enableNetworkInformation?: boolean;
  enableScreenWakeLock?: boolean;
  enableScreenOrientation?: boolean;
  enableFullscreen?: boolean;
  enableFileSystemAccess?: boolean;
  enableMediaRecorder?: boolean;
  enableServerSentEvents?: boolean;
  enableVibration?: boolean;
  enableSpeechSynthesis?: boolean;
  enableMutationObserver?: boolean;
  enablePerformanceObserver?: boolean;
  enableIdleDetector?: boolean;
  enableEyeDropper?: boolean;
  enableBarcodeDetector?: boolean;
  enableWebAudio?: boolean;
  enableGamepad?: boolean;
  enableWebBluetooth?: boolean;
  enableWebUsb?: boolean;
  enableWebNfc?: boolean;
  enablePaymentRequest?: boolean;
  enableCredentialManagement?: boolean;
}

export const defaultBrowserWebApisConfig: BrowserWebApisConfig = {
  enableCamera: true,
  enableGeolocation: true,
  enableNotifications: true,
  enableClipboard: true,
  enableBattery: false,
  enableMediaDevices: true,
  enableWebShare: false,
  enableWebStorage: false,
  enableWebSocket: false,
  enableWebWorker: false,
  enableIntersectionObserver: false,
  enableResizeObserver: false,
  enablePageVisibility: false,
  enableBroadcastChannel: false,
  enableNetworkInformation: false,
  enableScreenWakeLock: false,
  enableScreenOrientation: false,
  enableFullscreen: false,
  enableFileSystemAccess: false,
  enableMediaRecorder: false,
  enableServerSentEvents: false,
  enableVibration: false,
  enableSpeechSynthesis: false,
  enableMutationObserver: false,
  enablePerformanceObserver: false,
  enableIdleDetector: false,
  enableEyeDropper: false,
  enableBarcodeDetector: false,
  enableWebAudio: false,
  enableGamepad: false,
  enableWebBluetooth: false,
  enableWebUsb: false,
  enableWebNfc: false,
  enablePaymentRequest: false,
  enableCredentialManagement: false,
};

export function provideBrowserWebApis(config: BrowserWebApisConfig = {}): EnvironmentProviders {
  const mergedConfig = { ...defaultBrowserWebApisConfig, ...config };

  const providers: Provider[] = [PermissionsService];

  const conditionalProviders: Array<[boolean | undefined, Provider]> = [
    [mergedConfig.enableCamera, CameraService],
    [mergedConfig.enableGeolocation, GeolocationService],
    [mergedConfig.enableNotifications, NotificationService],
    [mergedConfig.enableClipboard, ClipboardService],
    [mergedConfig.enableMediaDevices, MediaDevicesService],
    [mergedConfig.enableBattery, BatteryService],
    [mergedConfig.enableWebShare, WebShareService],
    [mergedConfig.enableWebStorage, WebStorageService],
    [mergedConfig.enableWebSocket, WebSocketService],
    [mergedConfig.enableWebWorker, WebWorkerService],
    [mergedConfig.enableIntersectionObserver, IntersectionObserverService],
    [mergedConfig.enableResizeObserver, ResizeObserverService],
    [mergedConfig.enablePageVisibility, PageVisibilityService],
    [mergedConfig.enableBroadcastChannel, BroadcastChannelService],
    [mergedConfig.enableNetworkInformation, NetworkInformationService],
    [mergedConfig.enableScreenWakeLock, ScreenWakeLockService],
    [mergedConfig.enableScreenOrientation, ScreenOrientationService],
    [mergedConfig.enableFullscreen, FullscreenService],
    [mergedConfig.enableFileSystemAccess, FileSystemAccessService],
    [mergedConfig.enableMediaRecorder, MediaRecorderService],
    [mergedConfig.enableServerSentEvents, ServerSentEventsService],
    [mergedConfig.enableVibration, VibrationService],
    [mergedConfig.enableSpeechSynthesis, SpeechSynthesisService],
    [mergedConfig.enableMutationObserver, MutationObserverService],
    [mergedConfig.enablePerformanceObserver, PerformanceObserverService],
    [mergedConfig.enableIdleDetector, IdleDetectorService],
    [mergedConfig.enableEyeDropper, EyeDropperService],
    [mergedConfig.enableBarcodeDetector, BarcodeDetectorService],
    [mergedConfig.enableWebAudio, WebAudioService],
    [mergedConfig.enableGamepad, GamepadService],
    [mergedConfig.enableWebBluetooth, WebBluetoothService],
    [mergedConfig.enableWebUsb, WebUsbService],
    [mergedConfig.enableWebNfc, WebNfcService],
    [mergedConfig.enablePaymentRequest, PaymentRequestService],
    [mergedConfig.enableCredentialManagement, CredentialManagementService],
  ];

  for (const [enabled, provider] of conditionalProviders) {
    if (enabled) {
      providers.push(provider);
    }
  }

  return makeEnvironmentProviders(providers);
}

// Feature-specific providers for tree-shaking
export function provideCamera(): EnvironmentProviders {
  return makeEnvironmentProviders([PermissionsService, CameraService]);
}

export function provideGeolocation(): EnvironmentProviders {
  return makeEnvironmentProviders([PermissionsService, GeolocationService]);
}

export function provideNotifications(): EnvironmentProviders {
  return makeEnvironmentProviders([PermissionsService, NotificationService]);
}

export function provideClipboard(): EnvironmentProviders {
  return makeEnvironmentProviders([PermissionsService, ClipboardService]);
}

export function provideMediaDevices(): EnvironmentProviders {
  return makeEnvironmentProviders([PermissionsService, MediaDevicesService]);
}

export function provideBattery(): EnvironmentProviders {
  return makeEnvironmentProviders([BatteryService]);
}

export function provideWebShare(): EnvironmentProviders {
  return makeEnvironmentProviders([WebShareService]);
}

export function provideWebStorage(): EnvironmentProviders {
  return makeEnvironmentProviders([WebStorageService]);
}

export function provideWebSocket(): EnvironmentProviders {
  return makeEnvironmentProviders([WebSocketService]);
}

export function provideWebWorker(): EnvironmentProviders {
  return makeEnvironmentProviders([WebWorkerService]);
}

export function providePermissions(): EnvironmentProviders {
  return makeEnvironmentProviders([PermissionsService]);
}

// Combined providers for common use cases
export function provideMediaApis(): EnvironmentProviders {
  return makeEnvironmentProviders([PermissionsService, CameraService, MediaDevicesService]);
}

export function provideLocationApis(): EnvironmentProviders {
  return makeEnvironmentProviders([PermissionsService, GeolocationService]);
}

export function provideStorageApis(): EnvironmentProviders {
  return makeEnvironmentProviders([PermissionsService, ClipboardService, WebStorageService]);
}

export function provideCommunicationApis(): EnvironmentProviders {
  return makeEnvironmentProviders([
    PermissionsService,
    NotificationService,
    WebShareService,
    WebSocketService,
  ]);
}

export function provideIntersectionObserver(): EnvironmentProviders {
  return makeEnvironmentProviders([IntersectionObserverService]);
}

export function provideResizeObserver(): EnvironmentProviders {
  return makeEnvironmentProviders([ResizeObserverService]);
}

export function providePageVisibility(): EnvironmentProviders {
  return makeEnvironmentProviders([PageVisibilityService]);
}

export function provideBroadcastChannel(): EnvironmentProviders {
  return makeEnvironmentProviders([BroadcastChannelService]);
}

export function provideNetworkInformation(): EnvironmentProviders {
  return makeEnvironmentProviders([NetworkInformationService]);
}

export function provideScreenWakeLock(): EnvironmentProviders {
  return makeEnvironmentProviders([PermissionsService, ScreenWakeLockService]);
}

export function provideScreenOrientation(): EnvironmentProviders {
  return makeEnvironmentProviders([ScreenOrientationService]);
}

export function provideFullscreen(): EnvironmentProviders {
  return makeEnvironmentProviders([FullscreenService]);
}

export function provideFileSystemAccess(): EnvironmentProviders {
  return makeEnvironmentProviders([PermissionsService, FileSystemAccessService]);
}

export function provideMediaRecorder(): EnvironmentProviders {
  return makeEnvironmentProviders([PermissionsService, MediaRecorderService]);
}

export function provideServerSentEvents(): EnvironmentProviders {
  return makeEnvironmentProviders([ServerSentEventsService]);
}

export function provideVibration(): EnvironmentProviders {
  return makeEnvironmentProviders([VibrationService]);
}

export function provideSpeechSynthesis(): EnvironmentProviders {
  return makeEnvironmentProviders([SpeechSynthesisService]);
}

export function provideMutationObserver(): EnvironmentProviders {
  return makeEnvironmentProviders([MutationObserverService]);
}

export function providePerformanceObserver(): EnvironmentProviders {
  return makeEnvironmentProviders([PerformanceObserverService]);
}

export function provideIdleDetector(): EnvironmentProviders {
  return makeEnvironmentProviders([PermissionsService, IdleDetectorService]);
}

export function provideEyeDropper(): EnvironmentProviders {
  return makeEnvironmentProviders([EyeDropperService]);
}

export function provideBarcodeDetector(): EnvironmentProviders {
  return makeEnvironmentProviders([BarcodeDetectorService]);
}

export function provideWebAudio(): EnvironmentProviders {
  return makeEnvironmentProviders([WebAudioService]);
}

export function provideGamepad(): EnvironmentProviders {
  return makeEnvironmentProviders([GamepadService]);
}

export function provideWebBluetooth(): EnvironmentProviders {
  return makeEnvironmentProviders([WebBluetoothService]);
}

export function provideWebUsb(): EnvironmentProviders {
  return makeEnvironmentProviders([WebUsbService]);
}

export function provideWebNfc(): EnvironmentProviders {
  return makeEnvironmentProviders([WebNfcService]);
}

export function providePaymentRequest(): EnvironmentProviders {
  return makeEnvironmentProviders([PaymentRequestService]);
}

export function provideCredentialManagement(): EnvironmentProviders {
  return makeEnvironmentProviders([CredentialManagementService]);
}
