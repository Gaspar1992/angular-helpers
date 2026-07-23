import { makeEnvironmentProviders, type EnvironmentProviders, type Provider } from '@angular/core';
import { PermissionsService } from './services/permissions.service';

export { providePermissions } from './providers/permissions';
export { provideCamera } from './providers/camera';
export { provideGeolocation } from './providers/geolocation';
export { provideNotifications } from './providers/notifications';
export { provideClipboard } from './providers/clipboard';
export { provideMediaDevices } from './providers/media-devices';
export { provideScreenWakeLock } from './providers/screen-wake-lock';
export { provideFileSystemAccess } from './providers/file-system-access';
export { provideMediaRecorder } from './providers/media-recorder';
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
export { provideSpeechRecognition } from './providers/speech-recognition';
export { provideMutationObserver } from './providers/mutation-observer';
export { providePerformanceObserver } from './providers/performance-observer';
export { provideWebAudio } from './providers/web-audio';
export { provideGamepad } from './providers/gamepad';
export { provideWebLocks } from './providers/web-locks';
export { provideStorageManager } from './providers/storage-manager';
export { provideCompression } from './providers/compression';
export { provideEyeDropper } from './providers/eye-dropper';
export { provideIdleDetector } from './providers/idle-detector';
export { provideBarcodeDetector } from './providers/barcode-detector';
export { provideCredentialManagement } from './providers/credential-management';
export { provideDeviceOrientation } from './providers/device-orientation';
export { provideDeviceMotion } from './providers/device-motion';
export {
  provideMediaApis,
  provideLocationApis,
  provideStorageApis,
  provideCommunicationApis,
} from './providers/combos';

/**
 * Composition-first config: pass an array of `provide*()` calls and we merge them
 * into a single `EnvironmentProviders`.
 *
 * ```ts
 * provideBrowserWebApis({
 *   services: [provideCamera(), provideClipboard(), provideMediaApis()],
 * })
 * ```
 */
export interface BrowserWebApisConfig {
  services?: EnvironmentProviders[];
}

export function provideBrowserWebApis(config: BrowserWebApisConfig = {}): EnvironmentProviders {
  const { services = [] } = config;

  return makeEnvironmentProviders([
    PermissionsService,
    ...services.reduce<Provider[]>((acc, env) => {
      const inner = (env as any).ɵproviders;
      return inner ? acc.concat(inner) : acc;
    }, []),
  ]);
}
