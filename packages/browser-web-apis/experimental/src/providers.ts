import { makeEnvironmentProviders, EnvironmentProviders, Provider } from '@angular/core';

import { IdleDetectorService } from './idle-detector.service';
import { EyeDropperService } from './eye-dropper.service';
import { BarcodeDetectorService } from './barcode-detector.service';
import { WebBluetoothService } from './web-bluetooth.service';
import { WebUsbService } from './web-usb.service';
import { WebNfcService } from './web-nfc.service';
import { PaymentRequestService } from './payment-request.service';
import { CredentialManagementService } from './credential-management.service';

// PermissionsService comes from the main entry point
import { PermissionsService } from '@angular-helpers/browser-web-apis';

export function provideIdleDetector(): EnvironmentProviders {
  return makeEnvironmentProviders([PermissionsService, IdleDetectorService]);
}

export function provideEyeDropper(): EnvironmentProviders {
  return makeEnvironmentProviders([EyeDropperService]);
}

export function provideBarcodeDetector(): EnvironmentProviders {
  return makeEnvironmentProviders([BarcodeDetectorService]);
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
