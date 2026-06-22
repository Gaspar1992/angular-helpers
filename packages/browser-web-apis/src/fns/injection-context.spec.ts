import { describe, it, expect } from 'vitest';
import { injectBarcodeDetector } from './inject-barcode-detector';
import { injectBatteryResource } from './inject-battery-resource';
import { injectBattery } from './inject-battery';
import { injectClipboard } from './inject-clipboard';
import { injectEyeDropper } from './inject-eye-dropper';
import { injectGamepad } from './inject-gamepad';
import { injectGeolocationResource } from './inject-geolocation-resource';
import { injectGeolocation } from './inject-geolocation';
import { injectIdleBatterySaver } from './inject-idle-battery-saver';
import { injectIdleDetector } from './inject-idle-detector';
import { injectIntersectionObserver } from './inject-intersection-observer';
import { injectMutationObserver } from './inject-mutation-observer';
import { injectNetworkInformationResource } from './inject-network-information-resource';
import { injectNetworkInformation } from './inject-network-information';
import { injectPageVisibility } from './inject-page-visibility';
import { injectPerformanceObserver } from './inject-performance-observer';
import { injectResizeObserver } from './inject-resize-observer';
import { injectScreenOrientation } from './inject-screen-orientation';
import { injectSpeechRecognition } from './inject-speech-recognition';
import { injectWakeLock } from './inject-wake-lock';

const injectFns = [
  { name: 'injectBarcodeDetector', fn: injectBarcodeDetector },
  { name: 'injectBatteryResource', fn: injectBatteryResource },
  { name: 'injectBattery', fn: injectBattery },
  { name: 'injectClipboard', fn: injectClipboard },
  { name: 'injectEyeDropper', fn: injectEyeDropper },
  { name: 'injectGamepad', fn: injectGamepad },
  { name: 'injectGeolocationResource', fn: injectGeolocationResource },
  { name: 'injectGeolocation', fn: injectGeolocation },
  { name: 'injectIdleBatterySaver', fn: injectIdleBatterySaver },
  { name: 'injectIdleDetector', fn: injectIdleDetector },
  { name: 'injectIntersectionObserver', fn: injectIntersectionObserver },
  { name: 'injectMutationObserver', fn: injectMutationObserver },
  { name: 'injectNetworkInformationResource', fn: injectNetworkInformationResource },
  { name: 'injectNetworkInformation', fn: injectNetworkInformation },
  { name: 'injectPageVisibility', fn: injectPageVisibility },
  { name: 'injectPerformanceObserver', fn: injectPerformanceObserver },
  { name: 'injectResizeObserver', fn: injectResizeObserver },
  { name: 'injectScreenOrientation', fn: injectScreenOrientation },
  { name: 'injectSpeechRecognition', fn: injectSpeechRecognition },
  { name: 'injectWakeLock', fn: injectWakeLock },
];

describe('Browser Web APIs Injection Context Checks', () => {
  injectFns.forEach(({ name, fn }) => {
    it(`should throw an error mentioning ${name} when called outside an injection context`, () => {
      expect(() => fn()).toThrow(new RegExp(`${name}`));
    });
  });
});
