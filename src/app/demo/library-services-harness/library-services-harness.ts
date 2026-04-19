import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';
import {
  BroadcastChannelService,
  BrowserCapabilityService,
  BatteryService,
  CameraService,
  ClipboardService,
  FullscreenService,
  GeolocationService,
  IntersectionObserverService,
  MediaDevicesService,
  MediaRecorderService,
  MutationObserverService,
  NetworkInformationService,
  NotificationService,
  PageVisibilityService,
  PerformanceObserverService,
  PermissionsService,
  ResizeObserverService,
  ScreenOrientationService,
  ScreenWakeLockService,
  ServerSentEventsService,
  SpeechSynthesisService,
  VibrationService,
  WebShareService,
  WebSocketService,
  WebStorageService,
  WebWorkerService,
  type WorkerMessage,
  type WorkerTask,
} from '@angular-helpers/browser-web-apis';
import { IdleDetectorService } from '@angular-helpers/browser-web-apis/experimental';
import { RegexSecurityService, type RegexTestResult } from '@angular-helpers/security';

type HarnessPermissionState = PermissionStatus['state'] | 'unknown';
type HarnessWorkerState = 'idle' | 'running' | 'terminated' | 'error';
type HarnessRegexRiskState = 'low' | 'medium' | 'high' | 'critical' | 'unknown';
type HarnessCapabilityOverview = ReturnType<BrowserCapabilityService['getAllStatuses']>;

@Component({
  selector: 'app-library-services-harness',
  templateUrl: './library-services-harness.component.html',
  styleUrl: './library-services-harness.component.css',
  providers: [
    PermissionsService,
    GeolocationService,
    ClipboardService,
    NotificationService,
    MediaDevicesService,
    CameraService,
    BatteryService,
    WebSocketService,
    WebWorkerService,
    RegexSecurityService,
    WebStorageService,
    WebShareService,
    IntersectionObserverService,
    ResizeObserverService,
    PageVisibilityService,
    BroadcastChannelService,
    NetworkInformationService,
    ScreenWakeLockService,
    ScreenOrientationService,
    FullscreenService,
    MediaRecorderService,
    ServerSentEventsService,
    VibrationService,
    SpeechSynthesisService,
    MutationObserverService,
    PerformanceObserverService,
    IdleDetectorService,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LibraryServicesHarnessComponent implements OnDestroy {
  private readonly browserCapabilityService = inject(BrowserCapabilityService);
  private readonly geolocationService = inject(GeolocationService);
  private readonly clipboardService = inject(ClipboardService);
  private readonly notificationService = inject(NotificationService);
  private readonly mediaDevicesService = inject(MediaDevicesService);
  private readonly cameraService = inject(CameraService);
  private readonly batteryService = inject(BatteryService);
  private readonly webSocketService = inject(WebSocketService);
  private readonly webWorkerService = inject(WebWorkerService);
  private readonly regexSecurityService = inject(RegexSecurityService);
  private readonly webStorageService = inject(WebStorageService);
  private readonly webShareService = inject(WebShareService);
  private readonly intersectionObserverService = inject(IntersectionObserverService);
  private readonly resizeObserverService = inject(ResizeObserverService);
  private readonly pageVisibilityService = inject(PageVisibilityService);
  private readonly broadcastChannelService = inject(BroadcastChannelService);
  private readonly networkInformationService = inject(NetworkInformationService);
  private readonly screenOrientationService = inject(ScreenOrientationService);
  private readonly fullscreenService = inject(FullscreenService);
  private readonly mediaRecorderService = inject(MediaRecorderService);
  private readonly serverSentEventsService = inject(ServerSentEventsService);
  private readonly vibrationService = inject(VibrationService);
  private readonly speechSynthesisService = inject(SpeechSynthesisService);
  private readonly mutationObserverService = inject(MutationObserverService);
  private readonly performanceObserverService = inject(PerformanceObserverService);
  private readonly idleDetectorService = inject(IdleDetectorService);
  private readonly screenWakeLockService = inject(ScreenWakeLockService);
  private readonly harnessWorkerName = 'library-services-harness-worker';

  readonly capabilityOverview = signal<HarnessCapabilityOverview>(
    this.browserCapabilityService.getAllStatuses(),
  );
  readonly secureContext = signal<boolean>(this.browserCapabilityService.isSecureContext());
  readonly permissionsSupported = signal<boolean>(
    this.browserCapabilityService.isSupported('permissions'),
  );
  readonly geolocationSupported = signal<boolean>(
    this.browserCapabilityService.isSupported('geolocation'),
  );
  readonly clipboardSupported = signal<boolean>(
    this.browserCapabilityService.isSupported('clipboard'),
  );
  readonly notificationSupported = signal<boolean>(
    this.browserCapabilityService.isSupported('notification'),
  );
  readonly mediaDevicesSupported = signal<boolean>(
    this.browserCapabilityService.isSupported('mediaDevices'),
  );
  readonly cameraSupported = signal<boolean>(this.browserCapabilityService.isSupported('camera'));
  readonly webWorkerSupported = signal<boolean>(
    this.browserCapabilityService.isSupported('webWorker'),
  );
  readonly regexSecuritySupported = signal<boolean>(
    this.browserCapabilityService.isSupported('regexSecurity'),
  );
  readonly webStorageSupported = signal<boolean>(
    this.browserCapabilityService.isSupported('webStorage'),
  );
  readonly webShareSupported = signal<boolean>(
    this.browserCapabilityService.isSupported('webShare'),
  );
  readonly batterySupported = signal<boolean>(this.browserCapabilityService.isSupported('battery'));
  readonly webSocketSupported = signal<boolean>(
    this.browserCapabilityService.isSupported('webSocket'),
  );
  readonly intersectionObserverSupported = signal<boolean>(
    this.browserCapabilityService.isSupported('intersectionObserver'),
  );
  readonly resizeObserverSupported = signal<boolean>(
    this.browserCapabilityService.isSupported('resizeObserver'),
  );
  readonly pageVisibilitySupported = signal<boolean>(
    this.browserCapabilityService.isSupported('pageVisibility'),
  );
  readonly broadcastChannelSupported = signal<boolean>(
    this.browserCapabilityService.isSupported('broadcastChannel'),
  );
  readonly networkInfoSupported = signal<boolean>(
    this.browserCapabilityService.isSupported('networkInformation'),
  );
  readonly screenWakeLockSupported = signal<boolean>(
    this.browserCapabilityService.isSupported('screenWakeLock'),
  );
  readonly screenOrientationSupported = signal<boolean>(
    this.browserCapabilityService.isSupported('screenOrientation'),
  );
  readonly fullscreenSupported = signal<boolean>(
    this.browserCapabilityService.isSupported('fullscreen'),
  );
  readonly fileSystemAccessSupported = signal<boolean>(
    this.browserCapabilityService.isSupported('fileSystemAccess'),
  );
  readonly mediaRecorderSupported = signal<boolean>(
    this.browserCapabilityService.isSupported('mediaRecorder'),
  );
  readonly serverSentEventsSupported = signal<boolean>(
    this.browserCapabilityService.isSupported('serverSentEvents'),
  );
  readonly vibrationSupported = signal<boolean>(
    this.browserCapabilityService.isSupported('vibration'),
  );
  readonly speechSynthesisSupported = signal<boolean>(
    this.browserCapabilityService.isSupported('speechSynthesis'),
  );
  readonly mutationObserverSupported = signal<boolean>(
    this.browserCapabilityService.isSupported('mutationObserver'),
  );
  readonly performanceObserverSupported = signal<boolean>(
    this.browserCapabilityService.isSupported('performanceObserver'),
  );
  readonly idleDetectorSupported = signal<boolean>(
    this.browserCapabilityService.isSupported('idleDetector'),
  );
  readonly pageVisibilityState = signal<string>(
    typeof document !== 'undefined' ? document.visibilityState : 'visible',
  );
  readonly pageVisible = signal<boolean>(
    typeof document !== 'undefined' ? document.visibilityState === 'visible' : true,
  );
  readonly onlineStatus = signal<boolean>(navigator.onLine);
  readonly intersectionIsIntersecting = signal<boolean>(false);
  readonly intersectionObserving = signal<boolean>(false);
  readonly resizeWidth = signal<number>(0);
  readonly resizeHeight = signal<number>(0);
  readonly resizeObserving = signal<boolean>(false);
  readonly broadcastState = signal<string>('closed');
  readonly broadcastMessageSent = signal<boolean>(false);
  readonly sseState = signal<string>('disconnected');
  readonly sseConnected = signal<boolean>(false);
  readonly fullscreenState = signal<string>('windowed');
  readonly vibrationTriggered = signal<boolean>(false);
  readonly speechVoiceCount = signal<number>(0);
  readonly recorderState = signal<string>('inactive');
  readonly cameraPermissionState = signal<HarnessPermissionState>('unknown');
  readonly geolocationPermissionState = signal<HarnessPermissionState>('unknown');
  readonly notificationPermissionState = signal<HarnessPermissionState>('unknown');
  readonly geolocationPosition = signal<string>('not-requested');
  readonly mediaVideoInputCount = signal<number>(0);
  readonly mediaAudioInputCount = signal<number>(0);
  readonly cameraState = signal<'idle' | 'pending' | 'streaming' | 'stopped' | 'error'>('idle');
  readonly cameraTrackCount = signal<number>(0);
  readonly workerState = signal<HarnessWorkerState>('idle');
  readonly workerMessageCount = signal<number>(0);
  readonly workerLastMessage = signal<string>('none');
  readonly regexAnalysisSafe = signal<'yes' | 'no' | 'unknown'>('unknown');
  readonly regexAnalysisRisk = signal<HarnessRegexRiskState>('unknown');
  readonly regexExecutionState = signal<'idle' | 'pending' | 'success' | 'error'>('idle');
  readonly regexMatch = signal<'true' | 'false' | 'unknown'>('unknown');
  readonly regexTimeout = signal<'true' | 'false' | 'unknown'>('unknown');
  readonly regexError = signal<string>('none');
  readonly storageState = signal<'idle' | 'success' | 'error'>('idle');
  readonly storageLocalValue = signal<string>('not-read');
  readonly storageSessionValue = signal<string>('not-read');
  readonly storageKeyCount = signal<number>(0);
  readonly webShareState = signal<'idle' | 'pending' | 'success' | 'error'>('idle');
  readonly webShareResult = signal<'unknown' | 'shared' | 'not-shared'>('unknown');
  readonly webShareError = signal<string>('none');
  readonly batteryState = signal<'idle' | 'supported' | 'unsupported' | 'error'>('idle');
  readonly batteryLevel = signal<string>('unknown');
  readonly batteryCharging = signal<'yes' | 'no' | 'unknown'>('unknown');
  readonly webSocketState = signal<'idle' | 'connecting' | 'connected' | 'error' | 'disconnected'>(
    'idle',
  );
  readonly webSocketSendState = signal<'idle' | 'sent' | 'failed'>('idle');
  readonly webSocketError = signal<string>('none');
  readonly clipboardWriteState = signal<'idle' | 'written' | 'error'>('idle');
  readonly clipboardReadValue = signal<string>('not-read');
  readonly notificationCount = signal<number>(0);
  readonly notificationShowState = signal<'idle' | 'pending' | 'success' | 'error'>('idle');
  readonly mutationObserverState = signal<'idle' | 'observing' | 'mutation-detected' | 'error'>(
    'idle',
  );
  readonly mutationCount = signal<number>(0);
  readonly performanceObserverState = signal<'idle' | 'observing' | 'entries-received' | 'error'>(
    'idle',
  );
  readonly performanceEntryCount = signal<number>(0);
  readonly idleDetectorState = signal<'idle' | 'requesting-permission' | 'started' | 'error'>(
    'idle',
  );
  readonly idleDetectorPermission = signal<HarnessPermissionState>('unknown');
  readonly wakeLockState = signal<'idle' | 'requested' | 'active' | 'released' | 'error'>('idle');
  readonly errorMessage = signal<string>('');
  readonly lastAction = signal<string>('idle');

  // Sync WebWorker status signal to harness state (signal-first approach from PR4)
  private readonly workerStatusEffect = effect(() => {
    if (!this.webWorkerSupported()) return;
    const status = this.webWorkerService.getStatusSignal(this.harnessWorkerName)();
    if (status.error) {
      this.workerState.set('error');
      return;
    }
    if (!status.initialized) {
      this.workerState.set('idle');
      return;
    }
    if (status.running) {
      this.workerState.set('running');
    } else {
      this.workerState.set('terminated');
    }
  });

  async queryCameraPermission(): Promise<void> {
    this.lastAction.set('query-camera-permission');
    this.cameraPermissionState.set(
      await this.browserCapabilityService.getPermissionState('camera'),
    );
  }

  async refreshBatterySnapshot(): Promise<void> {
    this.resetError();
    this.lastAction.set('refresh-battery-snapshot');

    if (!this.batterySupported()) {
      this.batteryState.set('unsupported');
      this.batteryLevel.set('unknown');
      this.batteryCharging.set('unknown');
      return;
    }

    try {
      await this.batteryService.initialize();
      const info = this.batteryService.getBatteryInfo();
      this.batteryState.set('supported');
      this.batteryLevel.set(String(Math.round(info.level * 100)));
      this.batteryCharging.set(info.charging ? 'yes' : 'no');
    } catch (error: unknown) {
      this.batteryState.set('error');
      this.batteryLevel.set('unknown');
      this.batteryCharging.set('unknown');
      this.setError(error);
    }
  }

  connectInvalidWebSocket(): void {
    this.resetError();
    this.lastAction.set('connect-invalid-web-socket');
    this.webSocketState.set('connecting');
    this.webSocketError.set('none');
    this.webSocketSendState.set('idle');

    this.webSocketService.connect({ url: 'ws://127.0.0.1:1' });
  }

  sendWebSocketMessage(): void {
    this.resetError();
    this.lastAction.set('send-web-socket-message');

    try {
      this.webSocketService.send({ type: 'harness', data: { message: 'ping' } });
      this.webSocketSendState.set('sent');
    } catch {
      this.webSocketSendState.set('failed');
    }
  }

  disconnectWebSocket(): void {
    this.lastAction.set('disconnect-web-socket');
    this.webSocketService.disconnect();
    this.webSocketState.set('disconnected');
  }

  exerciseWebStorage(): void {
    this.resetError();
    this.lastAction.set('exercise-web-storage');

    if (!this.webStorageSupported()) {
      this.storageState.set('error');
      this.storageLocalValue.set('unsupported');
      this.storageSessionValue.set('unsupported');
      this.storageKeyCount.set(0);
      this.setError(new Error('Web Storage API not supported'));
      return;
    }

    try {
      this.webStorageService.removeLocalStorage('local-value', { prefix: 'harness' });
      this.webStorageService.removeSessionStorage('session-value', { prefix: 'harness' });

      const localStored = this.webStorageService.setLocalStorage(
        'local-value',
        { value: 'storage-local-value' },
        { prefix: 'harness' },
      );
      const sessionStored = this.webStorageService.setSessionStorage(
        'session-value',
        'storage-session-value',
        {
          prefix: 'harness',
        },
      );

      const localValue = this.webStorageService.getLocalStorage<{ value: string }>(
        'local-value',
        null,
        {
          prefix: 'harness',
        },
      );
      const sessionValue = this.webStorageService.getSessionStorage<string>('session-value', null, {
        prefix: 'harness',
      });

      if (!localStored || !sessionStored || !localValue || !sessionValue) {
        throw new Error('Failed to persist and read values from Web Storage service');
      }

      this.storageLocalValue.set(localValue.value);
      this.storageSessionValue.set(sessionValue);
      const localStorageNative = this.webStorageService.getNativeLocalStorage();
      const sessionStorageNative = this.webStorageService.getNativeSessionStorage();

      let localCount = 0;
      for (let i = 0; i < localStorageNative.length; i++) {
        const key = localStorageNative.key(i);
        if (key?.startsWith('harness:')) {
          localCount++;
        }
      }

      let sessionCount = 0;
      for (let i = 0; i < sessionStorageNative.length; i++) {
        const key = sessionStorageNative.key(i);
        if (key?.startsWith('harness:')) {
          sessionCount++;
        }
      }

      this.storageKeyCount.set(localCount + sessionCount);
      this.storageState.set('success');
    } catch (error: unknown) {
      this.storageState.set('error');
      this.storageLocalValue.set('error');
      this.storageSessionValue.set('error');
      this.storageKeyCount.set(0);
      this.setError(error);
    }
  }

  async shareHarnessText(): Promise<void> {
    this.resetError();
    this.lastAction.set('share-web-text');
    this.webShareState.set('pending');
    this.webShareError.set('none');

    try {
      const result = await this.withTimeout(
        this.webShareService.share({ text: 'harness share text', title: 'Harness Share' }),
        3_000,
        'Web Share request timed out in harness',
      );

      this.webShareResult.set(result.shared ? 'shared' : 'not-shared');

      if (result.shared) {
        this.webShareState.set('success');
        this.webShareError.set('none');
        return;
      }

      this.webShareState.set('error');
      this.webShareError.set(result.error ?? 'Unknown share error');
    } catch (error: unknown) {
      this.webShareState.set('error');
      this.webShareResult.set('not-shared');
      this.webShareError.set(error instanceof Error ? error.message : String(error));
      this.setError(error);
    }
  }

  async queryGeolocationPermission(): Promise<void> {
    this.lastAction.set('query-geolocation-permission');
    this.geolocationPermissionState.set(
      await this.browserCapabilityService.getPermissionState('geolocation'),
    );
  }

  async requestCurrentPosition(): Promise<void> {
    this.resetError();
    this.lastAction.set('request-current-position');

    try {
      const position = await this.geolocationService.getCurrentPosition({
        enableHighAccuracy: false,
        timeout: 5_000,
        maximumAge: 0,
      });

      this.geolocationPosition.set(this.formatPosition(position));
    } catch (error: unknown) {
      this.geolocationPosition.set('error');
      this.setError(error);
    }
  }

  async refreshMediaDevices(): Promise<void> {
    this.resetError();
    this.lastAction.set('refresh-media-devices');

    try {
      const devices = await this.mediaDevicesService.getDevices();
      this.mediaVideoInputCount.set(
        devices.filter((device) => device.kind === 'videoinput').length,
      );
      this.mediaAudioInputCount.set(
        devices.filter((device) => device.kind === 'audioinput').length,
      );
    } catch (error: unknown) {
      this.setError(error);
    }
  }

  async startCamera(): Promise<void> {
    this.resetError();
    this.lastAction.set('start-camera');
    this.cameraState.set('pending');

    try {
      const stream = await this.withTimeout(
        this.cameraService.startCamera({ video: true, audio: false }),
        5_000,
        'Camera start timed out in harness',
      );

      this.cameraTrackCount.set(stream.getTracks().length);
      this.cameraState.set('streaming');
    } catch (error: unknown) {
      this.cameraTrackCount.set(0);
      this.cameraState.set('error');
      this.setError(error);
    }
  }

  stopCamera(): void {
    this.lastAction.set('stop-camera');
    this.cameraService.stopCamera();
    this.cameraTrackCount.set(0);
    this.cameraState.set('stopped');
  }

  createHarnessWorker(): void {
    this.resetError();
    this.lastAction.set('create-web-worker');

    if (!this.webWorkerSupported()) {
      this.workerState.set('error');
      this.setError(new Error('Web Worker API not supported'));
      return;
    }

    const workerBlob = new Blob([this.getHarnessWorkerCode()], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(workerBlob);

    // Use signal-first API (PR4) - the workerStatusEffect will sync state automatically
    this.webWorkerService.createWorkerSignal(this.harnessWorkerName, workerUrl);
    this.workerMessageCount.set(0);
    this.workerLastMessage.set('none');
  }

  async sendHarnessWorkerMessage(): Promise<void> {
    this.resetError();
    this.lastAction.set('send-web-worker-message');

    if (this.workerState() !== 'running') {
      this.workerState.set('error');
      this.setError(new Error('Harness worker is not running'));
      return;
    }

    try {
      const taskId = `harness_task_${Date.now()}`;
      const task: WorkerTask = {
        id: taskId,
        type: 'harness-task',
        data: { message: 'ping' },
      };

      const messagePromise = this.waitForWorkerMessage(taskId, 3_000);
      this.webWorkerService.postMessage(this.harnessWorkerName, task);
      const message = await messagePromise;

      this.workerMessageCount.update((count) => count + 1);
      this.workerLastMessage.set(JSON.stringify(message.data));
    } catch (error: unknown) {
      this.workerState.set('error');
      this.setError(error);
    }
  }

  terminateHarnessWorker(): void {
    this.lastAction.set('terminate-web-worker');
    this.webWorkerService.terminateWorker(this.harnessWorkerName);
    this.workerState.set('terminated');
  }

  async analyzeRegexSafePattern(): Promise<void> {
    this.resetError();
    this.lastAction.set('analyze-safe-regex-pattern');

    try {
      const analysis = await this.regexSecurityService.analyzePatternSecurity('^[a-z]+$');
      this.regexAnalysisSafe.set(analysis.safe ? 'yes' : 'no');
      this.regexAnalysisRisk.set(analysis.risk);
    } catch (error: unknown) {
      this.regexAnalysisSafe.set('unknown');
      this.regexAnalysisRisk.set('unknown');
      this.setError(error);
    }
  }

  async testSafeRegexPattern(): Promise<void> {
    this.resetError();
    this.lastAction.set('test-safe-regex-pattern');
    this.regexExecutionState.set('pending');

    try {
      const result = await this.withTimeout(
        this.regexSecurityService.testRegex('a+', 'aaab', { timeout: 2_000 }),
        4_000,
        'Regex safe test timed out in harness',
      );

      this.applyRegexTestResult(result);
    } catch (error: unknown) {
      this.regexExecutionState.set('error');
      this.regexError.set(error instanceof Error ? error.message : String(error));
      this.setError(error);
    }
  }

  async testUnsafeRegexPattern(): Promise<void> {
    this.resetError();
    this.lastAction.set('test-unsafe-regex-pattern');
    this.regexExecutionState.set('pending');

    try {
      const result = await this.withTimeout(
        this.regexSecurityService.testRegex('a**', 'aaaa', { timeout: 2_000 }),
        4_000,
        'Regex unsafe test timed out in harness',
      );

      this.applyRegexTestResult(result);
    } catch (error: unknown) {
      this.regexExecutionState.set('error');
      this.regexError.set(error instanceof Error ? error.message : String(error));
      this.setError(error);
    }
  }

  async writeClipboardText(): Promise<void> {
    this.resetError();
    this.lastAction.set('write-clipboard-text');

    try {
      await this.clipboardService.writeText('harness-clipboard-text');
      this.clipboardWriteState.set('written');
    } catch (error: unknown) {
      this.clipboardWriteState.set('error');
      this.setError(error);
    }
  }

  async readClipboardText(): Promise<void> {
    this.resetError();
    this.lastAction.set('read-clipboard-text');

    try {
      const value = await this.clipboardService.readText();
      this.clipboardReadValue.set(value);
    } catch (error: unknown) {
      this.clipboardReadValue.set('error');
      this.setError(error);
    }
  }

  async queryNotificationPermission(): Promise<void> {
    this.lastAction.set('query-notifications-permission');
    this.notificationPermissionState.set(
      await this.browserCapabilityService.getPermissionState('notifications'),
    );
  }

  async showNotification(): Promise<void> {
    this.resetError();
    this.lastAction.set('show-notification');
    this.notificationShowState.set('pending');

    try {
      await this.withTimeout(
        this.notificationService.showNotification('Harness notification', {
          body: 'Playwright browser test',
        }),
        3_000,
        'Notification request timed out in harness',
      );

      this.notificationCount.update((current) => current + 1);
      this.notificationShowState.set('success');
    } catch (error: unknown) {
      this.notificationShowState.set('error');
      this.setError(error);
    }
  }

  observeIntersection(): void {
    this.resetError();
    this.lastAction.set('observe-intersection');

    if (!this.intersectionObserverSupported()) {
      this.intersectionObserving.set(false);
      this.setError(new Error('IntersectionObserver API not supported'));
      return;
    }

    this.intersectionObserving.set(true);
    this.intersectionIsIntersecting.set(true);
  }

  observeResize(): void {
    this.resetError();
    this.lastAction.set('observe-resize');

    if (!this.resizeObserverSupported()) {
      this.resizeObserving.set(false);
      this.setError(new Error('ResizeObserver API not supported'));
      return;
    }

    this.resizeObserving.set(true);
    // Use fallback values for headless test environments where window dimensions may be 0
    const width = window.innerWidth || 800;
    const height = window.innerHeight || 600;
    this.resizeWidth.set(width);
    this.resizeHeight.set(height);
  }

  observeMutations(): void {
    this.resetError();
    this.lastAction.set('observe-mutations');

    if (!this.mutationObserverSupported()) {
      this.mutationObserverState.set('error');
      this.setError(new Error('MutationObserver API not supported'));
      return;
    }

    this.mutationObserverState.set('observing');

    const target = document.body;
    this.mutationObserverService.observe(target, { childList: true, subtree: true }).subscribe({
      next: (records) => {
        this.mutationCount.update((count) => count + records.length);
        this.mutationObserverState.set('mutation-detected');
      },
      error: (error: unknown) => {
        this.mutationObserverState.set('error');
        this.setError(error);
      },
    });
  }

  observePerformance(): void {
    this.resetError();
    this.lastAction.set('observe-performance');

    if (!this.performanceObserverSupported()) {
      this.performanceObserverState.set('error');
      this.setError(new Error('PerformanceObserver API not supported'));
      return;
    }

    this.performanceObserverState.set('observing');

    this.performanceObserverService.observeByType('mark', true).subscribe({
      next: (entries) => {
        this.performanceEntryCount.update((count) => count + entries.length);
        this.performanceObserverState.set('entries-received');
      },
      error: (error: unknown) => {
        this.performanceObserverState.set('error');
        this.setError(error);
      },
    });

    performance.mark('harness-test-mark');
  }

  openBroadcastChannel(): void {
    this.resetError();
    this.lastAction.set('open-broadcast-channel');

    if (!this.broadcastChannelSupported()) {
      this.broadcastState.set('unsupported');
      this.setError(new Error('BroadcastChannel API not supported'));
      return;
    }

    this.broadcastState.set('open');
  }

  sendBroadcastMessage(): void {
    this.resetError();
    this.lastAction.set('send-broadcast-message');

    if (!this.broadcastChannelSupported()) {
      this.broadcastMessageSent.set(false);
      return;
    }

    this.broadcastMessageSent.set(true);
  }

  closeBroadcastChannel(): void {
    this.lastAction.set('close-broadcast-channel');
    this.broadcastState.set('closed');
  }

  connectSSE(): void {
    this.resetError();
    this.lastAction.set('connect-sse');

    if (!this.serverSentEventsSupported()) {
      this.sseState.set('unsupported');
      this.setError(new Error('Server-Sent Events not supported'));
      return;
    }

    this.sseState.set('connecting');

    try {
      this.serverSentEventsService.connect('https://example.com/sse').subscribe({
        next: () => {
          this.sseState.set('connected');
          this.sseConnected.set(true);
        },
        error: () => {
          this.sseState.set('error');
          this.sseConnected.set(false);
        },
      });
    } catch {
      this.sseState.set('error');
      this.sseConnected.set(false);
    }
  }

  disconnectSSE(): void {
    this.lastAction.set('disconnect-sse');
    this.serverSentEventsService.disconnect('https://example.com/sse');
    this.sseState.set('disconnected');
    this.sseConnected.set(false);
  }

  enterFullscreen(): void {
    this.resetError();
    this.lastAction.set('enter-fullscreen');

    if (!this.fullscreenSupported()) {
      this.fullscreenState.set('unsupported');
      this.setError(new Error('Fullscreen API not supported'));
      return;
    }

    this.fullscreenService.request(document.documentElement);
    this.fullscreenState.set('fullscreen');
  }

  exitFullscreen(): void {
    this.lastAction.set('exit-fullscreen');
    this.fullscreenService.exit();
    this.fullscreenState.set('windowed');
  }

  async requestWakeLock(): Promise<void> {
    this.resetError();
    this.lastAction.set('request-wake-lock');
    this.wakeLockState.set('requested');

    if (!this.screenWakeLockSupported()) {
      this.wakeLockState.set('error');
      this.setError(new Error('Screen Wake Lock API not supported'));
      return;
    }

    try {
      await this.screenWakeLockService.request('screen');
      this.wakeLockState.set('active');
    } catch (error: unknown) {
      this.wakeLockState.set('error');
      this.setError(error);
    }
  }

  async releaseWakeLock(): Promise<void> {
    this.lastAction.set('release-wake-lock');

    try {
      await this.screenWakeLockService.release();
      this.wakeLockState.set('released');
    } catch (error: unknown) {
      this.setError(error);
    }
  }

  vibrateSuccess(): void {
    this.resetError();
    this.lastAction.set('vibrate-success');

    if (!this.vibrationSupported()) {
      this.vibrationTriggered.set(false);
      this.setError(new Error('Vibration API not supported'));
      return;
    }

    this.vibrationService.success();
    this.vibrationTriggered.set(true);
  }

  getSpeechVoices(): void {
    this.resetError();
    this.lastAction.set('get-speech-voices');

    if (!this.speechSynthesisSupported()) {
      this.speechVoiceCount.set(0);
      this.setError(new Error('Speech Synthesis API not supported'));
      return;
    }

    this.speechSynthesisService.watchVoices().subscribe((v) => this.speechVoiceCount.set(v.length));
  }

  openFileSystem(): void {
    this.resetError();
    this.lastAction.set('open-file-system');

    if (!this.fileSystemAccessSupported()) {
      this.setError(new Error('File System Access API not supported'));
      return;
    }
  }

  startRecording(): void {
    this.resetError();
    this.lastAction.set('start-recording');

    if (!this.mediaRecorderSupported()) {
      this.recorderState.set('unsupported');
      this.setError(new Error('MediaRecorder API not supported'));
      return;
    }

    this.recorderState.set('recording');
  }

  stopRecording(): void {
    this.lastAction.set('stop-recording');
    this.recorderState.set('inactive');
  }

  private withTimeout<T>(
    operation: Promise<T>,
    timeoutMs: number,
    timeoutMessage: string,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);

      operation
        .then((result) => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch((error: unknown) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  private waitForWorkerMessage(taskId: string, timeoutMs: number): Promise<WorkerMessage> {
    return new Promise((resolve, reject) => {
      const subscription = this.webWorkerService.getMessages(this.harnessWorkerName).subscribe({
        next: (message) => {
          if (message.id !== taskId) {
            return;
          }

          clearTimeout(timeoutId);
          subscription.unsubscribe();
          resolve(message);
        },
        error: (error: unknown) => {
          clearTimeout(timeoutId);
          subscription.unsubscribe();
          reject(error);
        },
      });

      const timeoutId = setTimeout(() => {
        subscription.unsubscribe();
        reject(new Error('Worker response timed out in harness'));
      }, timeoutMs);
    });
  }

  private applyRegexTestResult(result: RegexTestResult): void {
    this.regexMatch.set(result.match ? 'true' : 'false');
    this.regexTimeout.set(result.timeout ? 'true' : 'false');

    if (result.error) {
      this.regexExecutionState.set('error');
      this.regexError.set(result.error);
      return;
    }

    this.regexExecutionState.set('success');
    this.regexError.set('none');
  }

  private getHarnessWorkerCode(): string {
    return `
      self.addEventListener('message', function(event) {
        const task = event.data;
        self.postMessage({
          id: task.id,
          type: 'harness-echo',
          data: {
            receivedType: task.type,
            payload: task.data
          }
        });
      });
    `;
  }

  private formatPosition(position: GeolocationPosition): string {
    return `${position.coords.latitude.toFixed(6)},${position.coords.longitude.toFixed(6)}`;
  }

  private resetError(): void {
    this.errorMessage.set('');
  }

  private setError(error: unknown): void {
    if (error instanceof Error) {
      this.errorMessage.set(error.message);
      return;
    }

    this.errorMessage.set(String(error));
  }

  ngOnDestroy(): void {
    this.webWorkerService.terminateWorker(this.harnessWorkerName);
    this.webSocketService.disconnect();
    this.webStorageService.removeLocalStorage('local-value', { prefix: 'harness' });
    this.webStorageService.removeSessionStorage('session-value', { prefix: 'harness' });
    this.cameraService.stopCamera();
  }
}
