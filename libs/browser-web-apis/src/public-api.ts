// Browser Web APIs Services
export { PermissionsService } from './services/permissions.service';
export { CameraService } from './services/camera.service';
export { GeolocationService } from './services/geolocation.service';
export { MediaDevicesService } from './services/media-devices.service';
export { NotificationService } from './services/notification.service';
export { ClipboardService } from './services/clipboard.service';
export {
  BrowserCapabilityService,
  type BrowserCapabilityId,
} from './services/browser-capability.service';
export { BatteryService } from './services/battery.service';
export { WebShareService } from './services/web-share.service';
export {
  WebStorageService,
  type StorageOptions,
  type StorageEvent,
  type StorageNamespace,
} from './services/web-storage.service';
export {
  WebSocketService,
  type WebSocketConfig,
  type WebSocketMessage,
  type WebSocketStatus,
  type WebSocketStatusV2,
  type WebSocketClientConfig,
  WebSocketClient,
} from './services/web-socket.service';
export { type WebSocketState, type WebSocketRequestOptions } from './clients/web-socket.client';
export {
  WebTransportService,
  type WebTransportState,
  type WebTransportOptions,
  type WebTransportCloseInfo,
  type WebTransportHash,
  type WebTransportBidirectionalStream,
} from './services/web-transport.service';
export {
  WebWorkerService,
  type WorkerMessage,
  type WorkerStatus,
  type WorkerTask,
  type WorkerRequestOptions,
} from './services/web-worker.service';

// Tier 1 — New services
export {
  IntersectionObserverService,
  type IntersectionObserverOptions,
} from './services/intersection-observer.service';
export {
  ResizeObserverService,
  type ResizeObserverOptions,
  type ElementSize,
} from './services/resize-observer.service';
export { PageVisibilityService, type VisibilityState } from './services/page-visibility.service';
export { BroadcastChannelService } from './services/broadcast-channel.service';
export {
  NetworkInformationService,
  type NetworkInformation,
  type ConnectionType,
  type EffectiveConnectionType,
} from './services/network-information.service';
export {
  ScreenWakeLockService,
  type WakeLockType,
  type WakeLockStatus,
} from './services/screen-wake-lock.service';
export {
  ScreenOrientationService,
  type OrientationType,
  type OrientationLockType,
  type OrientationInfo,
} from './services/screen-orientation.service';
export { FullscreenService } from './services/fullscreen.service';
export {
  FileSystemAccessService,
  type FileOpenOptions,
  type FileSaveOptions,
} from './services/file-system-access.service';
export {
  MediaRecorderService,
  type RecordingState,
  type RecordingOptions,
  type RecordingResult,
} from './services/media-recorder.service';
export {
  ServerSentEventsService,
  type SSEConnectionState,
  type SSEMessage,
  type SSEConfig,
} from './services/server-sent-events.service';
export {
  VibrationService,
  type VibrationPattern,
  type VibrationPreset,
} from './services/vibration.service';
export {
  SpeechSynthesisService,
  type SpeechState,
  type SpeechOptions,
} from './services/speech-synthesis.service';
export {
  SpeechRecognitionService,
  type SpeechRecognitionResult,
  type SpeechRecognitionEvent,
  type SpeechRecognitionConfig,
} from './services/speech-recognition.service';
export { VoiceInputDirective } from './directives/voice-input.directive';

// Tier 2 — New services
export {
  MutationObserverService,
  type MutationObserverOptions,
} from './services/mutation-observer.service';
export {
  PerformanceObserverService,
  type PerformanceEntryType,
  type PerformanceObserverConfig,
} from './services/performance-observer.service';
export {
  WebAudioService,
  type AudioContextState,
  type AudioAnalyserData,
} from './services/web-audio.service';
export { GamepadService, type GamepadState } from './services/gamepad.service';
export { EyeDropperService, type EyeDropperResult } from './services/eye-dropper.service';
export {
  IdleDetectorService,
  type IdleState,
  type IdleDetectorOptions,
  type UserIdleState,
  type ScreenIdleState,
} from './services/idle-detector.service';

// New web platform services
export { WebLocksService } from './services/web-locks.service';
export {
  StorageManagerService,
  type StorageQuotaEstimate,
} from './services/storage-manager.service';
export { CompressionService, type CompressionFormat } from './services/compression.service';
export {
  BarcodeDetectorService,
  type DetectedBarcode,
  type BarcodeFormat,
} from './services/barcode-detector.service';
export {
  CredentialManagementService,
  type PasswordCredentialData,
  type PublicKeyCredentialOptions,
  type CredentialResult,
} from './services/credential-management.service';
export { DeviceOrientationService } from './services/device-orientation.service';
export { DeviceMotionService } from './services/device-motion.service';

// Tokens
export {
  BROWSER_API_LOGGER,
  BROWSER_API_LOG_LEVEL,
  provideBrowserApiLogLevel,
  type BrowserApiLogger,
  type BrowserApiLogLevel,
} from './tokens/logger.token';
export {
  BROWSER_API_EXPERIMENTAL_SILENT,
  warnExperimental,
  type ExperimentalWarnContext,
} from './tokens/experimental.token';
export { WINDOW, NAVIGATOR, createBrowserSignal } from './tokens/ssr.token';

// Base classes
export { BrowserApiBaseService } from './services/base/browser-api-base.service';
export { ConnectionRegistryBaseService } from './services/base/connection-registry-base.service';

// Interfaces and Types
export * from './interfaces/permissions.interface';
export * from './interfaces/media.interface';
export * from './interfaces/geolocation.interface';
export * from './interfaces/battery.interface';
export * from './interfaces/common.types';

// Signal Fn primitives
export { injectPageVisibility, type PageVisibilityRef } from './fns/inject-page-visibility';
export { injectResizeObserver, type ResizeRef } from './fns/inject-resize-observer';
export {
  injectIntersectionObserver,
  type IntersectionRef,
} from './fns/inject-intersection-observer';
export {
  injectNetworkInformation,
  type NetworkInformationRef,
} from './fns/inject-network-information';
export {
  injectNetworkInformationResource,
  type NetworkInformationResourceRef,
} from './fns/inject-network-information-resource';
export {
  injectScreenOrientation,
  type ScreenOrientationRef,
} from './fns/inject-screen-orientation';
export { injectMutationObserver, type MutationRef } from './fns/inject-mutation-observer';
export {
  injectPerformanceObserver,
  type PerformanceObserverRef,
} from './fns/inject-performance-observer';
export { injectGamepad, type GamepadRef } from './fns/inject-gamepad';
export { injectClipboard, type ClipboardRef } from './fns/inject-clipboard';
export {
  injectGeolocation,
  type GeolocationRef,
  type GeolocationOptions,
} from './fns/inject-geolocation';
export {
  injectGeolocationResource,
  type GeolocationResourceRef,
  type GeolocationResourceOptions,
} from './fns/inject-geolocation-resource';
export { injectBattery, type BatteryRef, type BatteryInfo } from './fns/inject-battery';
export { injectBatteryResource, type BatteryResourceRef } from './fns/inject-battery-resource';
export { injectWakeLock, type WakeLockRef } from './fns/inject-wake-lock';
export { injectEyeDropper, type EyeDropperRef } from './fns/inject-eye-dropper';
export { injectIdleDetector, type IdleDetectorRef } from './fns/inject-idle-detector';
export { injectBarcodeDetector, type BarcodeDetectorRef } from './fns/inject-barcode-detector';
export {
  injectSpeechRecognition,
  type SpeechRecognitionRef,
} from './fns/inject-speech-recognition';
export {
  injectDeviceOrientation,
  type DeviceOrientationRef,
} from './fns/inject-device-orientation';
export { injectDeviceMotion, type DeviceMotionRef } from './fns/inject-device-motion';
export {
  type DeviceSensorConfig,
  type DeviceOrientationData,
  type DeviceMotionData,
} from './utils/device-orientation.utils';
export {
  injectWebTransportResource,
  injectWebTransport,
  type WebTransportResourceRef,
  type WebTransportResourceOptions,
  type WebTransportSessionInfo,
  type WebTransportStatus,
} from './fns/inject-web-transport-resource';

// Utils and Guards
export * from './utils/browser-support.util';
export * from './guards/permission.guard';

// New High-Level Accessibility Directives and Helpers
export {
  VibrateFeedbackDirective,
  type VibrateFeedbackType,
} from './directives/vibrate-feedback.directive';
export { FullscreenFocusDirective } from './directives/fullscreen-focus.directive';
export { CopyButtonDirective } from './directives/copy-button.directive';
export { injectIdleBatterySaver, type IdleBatterySaverRef } from './fns/inject-idle-battery-saver';

// Providers
export { injectMediaQuery, type MediaQueryOptions } from './fns/inject-media-query';
export { injectBreakpoints, type BreakpointsOptions } from './fns/inject-breakpoints';
export {
  injectPreferredColorScheme,
  type PreferredColorSchemeOptions,
} from './fns/inject-preferred-color-scheme';
export { injectReducedMotion, type ReducedMotionOptions } from './fns/inject-reduced-motion';
export {
  injectDocumentTitle,
  type DocumentTitleOptions,
  type DocumentTitleRef,
} from './fns/inject-document-title';
export { injectMousePosition, type MousePosition } from './fns/inject-mouse-position';
export { injectWindowScroll, type ScrollPosition } from './fns/inject-window-scroll';
export { injectPermissionState, type PermissionStateRef } from './fns/inject-permission-state';

export * from './providers';

// Version
export const version = '22.0.0';
