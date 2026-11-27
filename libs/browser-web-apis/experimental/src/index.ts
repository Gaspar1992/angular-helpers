// Secondary entry point: @angular-helpers/browser-web-apis/experimental
// Experimental Chromium-only APIs that require specific browser support

// --- Services ---
export {
  IdleDetectorService,
  type IdleState,
  type IdleDetectorOptions,
  type UserIdleState,
  type ScreenIdleState,
  EyeDropperService,
  type EyeDropperResult as ColorSelectionResult,
  BarcodeDetectorService,
  type BarcodeFormat,
  type DetectedBarcode,
  WebBluetoothService,
  type BluetoothRequestDeviceOptions,
  type BluetoothRemoteGATTServer,
  CredentialManagementService,
  type PasswordCredentialData,
  type PublicKeyCredentialOptions,
  type CredentialResult,
  injectIdleDetector,
  type IdleDetectorRef,
} from '@angular-helpers/browser-web-apis';

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

// --- Experimental API Types ---
export type {
  BluetoothDeviceRef,
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
