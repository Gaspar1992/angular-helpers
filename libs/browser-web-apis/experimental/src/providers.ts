import { makeEnvironmentProviders, type EnvironmentProviders, type Provider } from '@angular/core';

import { WebUsbService } from './web-usb.service';
import { WebNfcService } from './web-nfc.service';
import { PaymentRequestService } from './payment-request.service';

// Main entry point imports
import {
  BarcodeDetectorService,
  CredentialManagementService,
  WebBluetoothService,
  IdleDetectorService,
  EyeDropperService,
  provideBarcodeDetector,
  provideCredentialManagement,
  provideWebBluetooth,
  provideIdleDetector,
  provideEyeDropper,
} from '@angular-helpers/browser-web-apis';

export {
  provideBarcodeDetector,
  provideCredentialManagement,
  provideWebBluetooth,
  provideIdleDetector,
  provideEyeDropper,
};

export function provideWebUsb(): EnvironmentProviders {
  return makeEnvironmentProviders([WebUsbService]);
}

export function provideWebNfc(): EnvironmentProviders {
  return makeEnvironmentProviders([WebNfcService]);
}

export function providePaymentRequest(): EnvironmentProviders {
  return makeEnvironmentProviders([PaymentRequestService]);
}

// --- Combo provider ---

export interface ExperimentalWebApisConfig {
  enableIdleDetector?: boolean;
  enableEyeDropper?: boolean;
  enableBarcodeDetector?: boolean;
  enableWebBluetooth?: boolean;
  enableWebUsb?: boolean;
  enableWebNfc?: boolean;
  enablePaymentRequest?: boolean;
  enableCredentialManagement?: boolean;
}

export const defaultExperimentalWebApisConfig: ExperimentalWebApisConfig = {
  enableIdleDetector: false,
  enableEyeDropper: false,
  enableBarcodeDetector: false,
  enableWebBluetooth: false,
  enableWebUsb: false,
  enableWebNfc: false,
  enablePaymentRequest: false,
  enableCredentialManagement: false,
};

export function provideExperimentalWebApis(
  config: ExperimentalWebApisConfig = {},
): EnvironmentProviders {
  const mergedConfig = { ...defaultExperimentalWebApisConfig, ...config };

  const providers: Provider[] = [];

  const conditionalProviders: Array<[boolean | undefined, Provider]> = [
    [mergedConfig.enableIdleDetector, IdleDetectorService],
    [mergedConfig.enableEyeDropper, EyeDropperService],
    [mergedConfig.enableBarcodeDetector, BarcodeDetectorService],
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
