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

// New web platform services
export { WebLocksService } from './services/web-locks.service';
export {
  StorageManagerService,
  type StorageQuotaEstimate,
} from './services/storage-manager.service';
export { CompressionService, type CompressionFormat } from './services/compression.service';

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
export { injectBattery, type BatteryRef, type BatteryInfo } from './fns/inject-battery';
export { injectWakeLock, type WakeLockRef } from './fns/inject-wake-lock';

// Utils and Guards
export * from './utils/browser-support.util';
export * from './guards/permission.guard';

// Providers
export * from './providers';

// Version
export const version = '0.1.0';
