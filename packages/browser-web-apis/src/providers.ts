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

export { providePermissions } from './providers/permissions';
export { provideCamera } from './providers/camera';
export { provideGeolocation } from './providers/geolocation';
export { provideNotifications } from './providers/notifications';
export { provideClipboard } from './providers/clipboard';
export { provideMediaDevices } from './providers/media-devices';
export { provideScreenWakeLock } from './providers/screen-wake-lock';
export { provideFileSystemAccess } from './providers/file-system-access';
export { provideMediaRecorder } from './providers/media-recorder';
export { provideIdleDetector } from './providers/idle-detector';
export { provideBattery } from './providers/battery';
export { provideWebShare } from './providers/web-share';
export { provideWebStorage } from './providers/web-storage';
export { provideWebSocket } from './providers/web-socket';
export { provideWebWorker } from './providers/web-worker';
export { provideIntersectionObserver } from './providers/intersection-observer';
export { provideResizeObserver } from './providers/resize-observer';
export { providePageVisibility } from './providers/page-visibility';
export { provideBroadcastChannel } from './providers/broadcast-channel';
export { provideNetworkInformation } from './providers/network-information';
export { provideScreenOrientation } from './providers/screen-orientation';
export { provideFullscreen } from './providers/fullscreen';
export { provideServerSentEvents } from './providers/server-sent-events';
export { provideVibration } from './providers/vibration';
export { provideSpeechSynthesis } from './providers/speech-synthesis';
export { provideMutationObserver } from './providers/mutation-observer';
export { providePerformanceObserver } from './providers/performance-observer';
export { provideEyeDropper } from './providers/eye-dropper';
export { provideBarcodeDetector } from './providers/barcode-detector';
export { provideWebAudio } from './providers/web-audio';
export { provideGamepad } from './providers/gamepad';
export { provideWebBluetooth } from './providers/web-bluetooth';
export { provideWebUsb } from './providers/web-usb';
export { provideWebNfc } from './providers/web-nfc';
export { providePaymentRequest } from './providers/payment-request';
export { provideCredentialManagement } from './providers/credential-management';
export {
  provideMediaApis,
  provideLocationApis,
  provideStorageApis,
  provideCommunicationApis,
} from './providers/combos';

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
