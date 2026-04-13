// Secondary entry point: @angular-helpers/browser-web-apis/experimental
// Experimental Chromium-only APIs that require specific browser support

// --- Services ---
export {
  IdleDetectorService,
  type IdleState,
  type IdleDetectorOptions,
} from './idle-detector.service';
export type { UserIdleState, ScreenIdleState } from './idle-detector.service';

export { EyeDropperService, type ColorSelectionResult } from './eye-dropper.service';

export {
  BarcodeDetectorService,
  type BarcodeFormat,
  type DetectedBarcode,
} from './barcode-detector.service';

export {
  WebBluetoothService,
  type BluetoothRequestDeviceOptions,
  type BluetoothDeviceRef,
  type BluetoothRemoteGATTServer,
} from './web-bluetooth.service';

export { WebUsbService, type UsbDeviceFilterDef, type UsbDeviceRef } from './web-usb.service';

export {
  WebNfcService,
  type NdefMessage,
  type NdefReadingEvent,
  type NdefWriteOptions,
} from './web-nfc.service';

export {
  PaymentRequestService,
  type PaymentMethodConfig,
  type PaymentDetailsInit,
  type PaymentOptionsConfig,
  type PaymentResult,
} from './payment-request.service';

export {
  CredentialManagementService,
  type PasswordCredentialData,
  type PublicKeyCredentialOptions,
  type CredentialResult,
} from './credential-management.service';

// --- Experimental API Types ---
export type {
  BluetoothRemoteGATTService,
  BluetoothRemoteGATTCharacteristic,
  BluetoothApi,
  UsbTransferResult,
  UsbApi,
  NdefRecord,
  NdefScanOptions,
  NdefReaderInstance,
  NdefReaderConstructor,
  NavigatorWithExperimentalApis,
} from './experimental-apis.types';

// --- Signal-based injection functions ---
export { injectIdleDetector, type IdleDetectorRef } from './inject-idle-detector';

// --- Providers ---
export {
  provideIdleDetector,
  provideEyeDropper,
  provideBarcodeDetector,
  provideWebBluetooth,
  provideWebUsb,
  provideWebNfc,
  providePaymentRequest,
  provideCredentialManagement,
  provideExperimentalWebApis,
  type ExperimentalWebApisConfig,
  defaultExperimentalWebApisConfig,
} from './providers';
