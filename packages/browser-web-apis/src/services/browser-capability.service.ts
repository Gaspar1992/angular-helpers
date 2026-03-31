import { Injectable } from '@angular/core';

export type BrowserCapabilityId =
  | 'permissions'
  | 'geolocation'
  | 'clipboard'
  | 'notification'
  | 'mediaDevices'
  | 'camera'
  | 'webWorker'
  | 'regexSecurity'
  | 'webStorage'
  | 'webShare'
  | 'battery'
  | 'webSocket'
  | 'intersectionObserver'
  | 'resizeObserver'
  | 'pageVisibility'
  | 'broadcastChannel'
  | 'networkInformation'
  | 'screenWakeLock'
  | 'screenOrientation'
  | 'fullscreen'
  | 'fileSystemAccess'
  | 'mediaRecorder'
  | 'serverSentEvents'
  | 'vibration'
  | 'speechSynthesis'
  | 'mutationObserver'
  | 'performanceObserver'
  | 'idleDetector'
  | 'eyeDropper'
  | 'barcodeDetector'
  | 'webAudio'
  | 'gamepad'
  | 'webBluetooth'
  | 'webUsb'
  | 'webNfc'
  | 'paymentRequest'
  | 'credentialManagement';

const BROWSER_CAPABILITIES = [
  { id: 'permissions', label: 'Permissions API', requiresSecureContext: false },
  { id: 'geolocation', label: 'Geolocation API', requiresSecureContext: true },
  { id: 'clipboard', label: 'Clipboard API', requiresSecureContext: true },
  { id: 'notification', label: 'Notification API', requiresSecureContext: true },
  { id: 'mediaDevices', label: 'MediaDevices API', requiresSecureContext: true },
  { id: 'camera', label: 'Camera API', requiresSecureContext: true },
  { id: 'webWorker', label: 'Web Worker API', requiresSecureContext: false },
  { id: 'regexSecurity', label: 'Regex Security', requiresSecureContext: false },
  { id: 'webStorage', label: 'Web Storage', requiresSecureContext: false },
  { id: 'webShare', label: 'Web Share', requiresSecureContext: true },
  { id: 'battery', label: 'Battery API', requiresSecureContext: false },
  { id: 'webSocket', label: 'WebSocket API', requiresSecureContext: false },
  { id: 'intersectionObserver', label: 'Intersection Observer', requiresSecureContext: false },
  { id: 'resizeObserver', label: 'Resize Observer', requiresSecureContext: false },
  { id: 'pageVisibility', label: 'Page Visibility API', requiresSecureContext: false },
  { id: 'broadcastChannel', label: 'Broadcast Channel API', requiresSecureContext: false },
  { id: 'networkInformation', label: 'Network Information API', requiresSecureContext: false },
  { id: 'screenWakeLock', label: 'Screen Wake Lock API', requiresSecureContext: true },
  { id: 'screenOrientation', label: 'Screen Orientation API', requiresSecureContext: false },
  { id: 'fullscreen', label: 'Fullscreen API', requiresSecureContext: false },
  { id: 'fileSystemAccess', label: 'File System Access API', requiresSecureContext: true },
  { id: 'mediaRecorder', label: 'MediaRecorder API', requiresSecureContext: true },
  { id: 'serverSentEvents', label: 'Server-Sent Events', requiresSecureContext: false },
  { id: 'vibration', label: 'Vibration API', requiresSecureContext: false },
  { id: 'speechSynthesis', label: 'Speech Synthesis API', requiresSecureContext: false },
  { id: 'mutationObserver', label: 'Mutation Observer', requiresSecureContext: false },
  { id: 'performanceObserver', label: 'Performance Observer', requiresSecureContext: false },
  { id: 'idleDetector', label: 'Idle Detection API', requiresSecureContext: true },
  { id: 'eyeDropper', label: 'EyeDropper API', requiresSecureContext: true },
  { id: 'barcodeDetector', label: 'Barcode Detection API', requiresSecureContext: true },
  { id: 'webAudio', label: 'Web Audio API', requiresSecureContext: false },
  { id: 'gamepad', label: 'Gamepad API', requiresSecureContext: true },
  { id: 'webBluetooth', label: 'Web Bluetooth API', requiresSecureContext: true },
  { id: 'webUsb', label: 'WebUSB API', requiresSecureContext: true },
  { id: 'webNfc', label: 'Web NFC API', requiresSecureContext: true },
  { id: 'paymentRequest', label: 'Payment Request API', requiresSecureContext: true },
  { id: 'credentialManagement', label: 'Credential Management API', requiresSecureContext: true },
] as const satisfies ReadonlyArray<{
  id: BrowserCapabilityId;
  label: string;
  requiresSecureContext: boolean;
}>;

@Injectable({ providedIn: 'root' })
export class BrowserCapabilityService {
  getCapabilities() {
    return BROWSER_CAPABILITIES;
  }

  isSecureContext(): boolean {
    return typeof window !== 'undefined' && window.isSecureContext;
  }

  isSupported(capability: BrowserCapabilityId): boolean {
    switch (capability) {
      case 'permissions':
        return typeof navigator !== 'undefined' && 'permissions' in navigator;
      case 'geolocation':
        return typeof navigator !== 'undefined' && 'geolocation' in navigator;
      case 'clipboard':
        return typeof navigator !== 'undefined' && 'clipboard' in navigator;
      case 'notification':
        return typeof window !== 'undefined' && 'Notification' in window;
      case 'mediaDevices':
      case 'camera':
        return typeof navigator !== 'undefined' && 'mediaDevices' in navigator;
      case 'webWorker':
      case 'regexSecurity':
        return typeof Worker !== 'undefined';
      case 'webStorage':
        return typeof Storage !== 'undefined';
      case 'webShare':
        return typeof navigator !== 'undefined' && 'share' in navigator;
      case 'battery':
        return typeof navigator !== 'undefined' && 'getBattery' in navigator;
      case 'webSocket':
        return typeof WebSocket !== 'undefined';
      case 'intersectionObserver':
        return typeof IntersectionObserver !== 'undefined';
      case 'resizeObserver':
        return typeof ResizeObserver !== 'undefined';
      case 'pageVisibility':
        return typeof document !== 'undefined' && 'hidden' in document;
      case 'broadcastChannel':
        return typeof BroadcastChannel !== 'undefined';
      case 'networkInformation':
        return (
          typeof navigator !== 'undefined' &&
          ('connection' in navigator || 'mozConnection' in navigator)
        );
      case 'screenWakeLock':
        return typeof navigator !== 'undefined' && 'wakeLock' in navigator;
      case 'screenOrientation':
        return typeof screen !== 'undefined' && 'orientation' in screen;
      case 'fullscreen':
        return (
          typeof document !== 'undefined' &&
          ('fullscreenEnabled' in document || 'webkitFullscreenEnabled' in document)
        );
      case 'fileSystemAccess':
        return typeof window !== 'undefined' && 'showOpenFilePicker' in window;
      case 'mediaRecorder':
        return typeof MediaRecorder !== 'undefined';
      case 'serverSentEvents':
        return typeof EventSource !== 'undefined';
      case 'vibration':
        return typeof navigator !== 'undefined' && 'vibrate' in navigator;
      case 'speechSynthesis':
        return typeof window !== 'undefined' && 'speechSynthesis' in window;
      case 'mutationObserver':
        return typeof MutationObserver !== 'undefined';
      case 'performanceObserver':
        return typeof PerformanceObserver !== 'undefined';
      case 'idleDetector':
        return typeof window !== 'undefined' && 'IdleDetector' in window;
      case 'eyeDropper':
        return typeof window !== 'undefined' && 'EyeDropper' in window;
      case 'barcodeDetector':
        return typeof window !== 'undefined' && 'BarcodeDetector' in window;
      case 'webAudio':
        return typeof window !== 'undefined' && 'AudioContext' in window;
      case 'gamepad':
        return typeof navigator !== 'undefined' && 'getGamepads' in navigator;
      case 'webBluetooth':
        return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
      case 'webUsb':
        return typeof navigator !== 'undefined' && 'usb' in navigator;
      case 'webNfc':
        return typeof window !== 'undefined' && 'NDEFReader' in window;
      case 'paymentRequest':
        return typeof window !== 'undefined' && 'PaymentRequest' in window;
      case 'credentialManagement':
        return typeof navigator !== 'undefined' && 'credentials' in navigator;
      default:
        return false;
    }
  }

  getAllStatuses() {
    const secureContext = this.isSecureContext();

    return this.getCapabilities().map((capability) => ({
      id: capability.id,
      label: capability.label,
      supported: this.isSupported(capability.id),
      secureContext,
      requiresSecureContext: capability.requiresSecureContext,
    }));
  }

  async getPermissionState(permission: PermissionName): Promise<PermissionState | 'unknown'> {
    if (typeof navigator === 'undefined' || !('permissions' in navigator)) {
      return 'unknown';
    }

    try {
      const status = await navigator.permissions.query({ name: permission as PermissionName });
      return status.state;
    } catch {
      return 'unknown';
    }
  }
}
