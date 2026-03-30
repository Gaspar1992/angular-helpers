// Type declarations for experimental browser APIs not included in standard TypeScript lib.
// These APIs require user gesture and are only available in secure contexts (HTTPS).

// --- Web Bluetooth API ---

export interface BluetoothRequestDeviceOptions {
  filters?: Array<{
    services?: string[];
    name?: string;
    namePrefix?: string;
  }>;
  optionalServices?: string[];
  acceptAllDevices?: boolean;
}

export interface BluetoothRemoteGATTServer {
  readonly connected: boolean;
  readonly device: BluetoothDeviceRef;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryService(service: string): Promise<BluetoothRemoteGATTService>;
}

export interface BluetoothRemoteGATTService {
  getCharacteristic(characteristic: string): Promise<BluetoothRemoteGATTCharacteristic>;
}

export interface BluetoothRemoteGATTCharacteristic extends EventTarget {
  readonly value: DataView | null;
  readValue(): Promise<DataView>;
  writeValue(value: BufferSource): Promise<void>;
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
}

export interface BluetoothDeviceRef extends EventTarget {
  readonly id: string;
  readonly name: string | undefined;
  readonly gatt: BluetoothRemoteGATTServer | undefined;
}

export interface BluetoothApi {
  requestDevice(options: BluetoothRequestDeviceOptions): Promise<BluetoothDeviceRef>;
}

// --- WebUSB API ---

export interface UsbDeviceRef {
  readonly vendorId: number;
  readonly productId: number;
  readonly productName: string | undefined;
  readonly manufacturerName: string | undefined;
  readonly serialNumber: string | undefined;
  readonly opened: boolean;
  open(): Promise<void>;
  close(): Promise<void>;
  selectConfiguration(configurationValue: number): Promise<void>;
  claimInterface(interfaceNumber: number): Promise<void>;
  releaseInterface(interfaceNumber: number): Promise<void>;
  transferIn(endpointNumber: number, length: number): Promise<UsbTransferResult>;
  transferOut(endpointNumber: number, data: BufferSource): Promise<UsbTransferResult>;
}

export interface UsbTransferResult {
  readonly data: DataView | undefined;
  readonly status: 'ok' | 'stall' | 'babble';
}

export interface UsbApi {
  requestDevice(options: { filters: UsbDeviceFilterDef[] }): Promise<UsbDeviceRef>;
  getDevices(): Promise<UsbDeviceRef[]>;
  addEventListener(type: string, listener: (event: { device: UsbDeviceRef }) => void): void;
  removeEventListener(type: string, listener: (event: { device: UsbDeviceRef }) => void): void;
}

export interface UsbDeviceFilterDef {
  vendorId?: number;
  productId?: number;
  classCode?: number;
  subclassCode?: number;
  protocolCode?: number;
  serialNumber?: string;
}

// --- Web NFC API ---

export interface NdefMessage {
  records: NdefRecord[];
}

export interface NdefRecord {
  recordType: string;
  mediaType?: string;
  id?: string;
  data?: DataView;
  encoding?: string;
  lang?: string;
}

export interface NdefReadingEvent {
  serialNumber: string;
  message: NdefMessage;
}

export interface NdefWriteOptions {
  overwrite?: boolean;
  signal?: AbortSignal;
}

export interface NdefScanOptions {
  signal?: AbortSignal;
}

export interface NdefReaderInstance extends EventTarget {
  scan(options?: NdefScanOptions): Promise<void>;
  write(message: NdefMessage | string, options?: NdefWriteOptions): Promise<void>;
}

export interface NdefReaderConstructor {
  new (): NdefReaderInstance;
}

// --- Navigator extensions ---

export interface NavigatorWithExperimentalApis extends Navigator {
  bluetooth?: BluetoothApi;
  usb?: UsbApi;
}
