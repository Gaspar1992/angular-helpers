import { Injectable, signal } from '@angular/core';
import { PermissionAwareBrowserApiBaseService } from './permission-aware-browser-api-base.service';
import { MediaDevice, MediaDeviceKind } from '../../interfaces/media.interface';

/**
 * Base class for media device services (Camera, Microphone, etc.)
 * Provides common functionality for:
 * - Device enumeration
 * - Stream management
 * - Device change detection
 * - Permission handling for media APIs
 */
@Injectable()
export abstract class MediaDeviceBaseService extends PermissionAwareBrowserApiBaseService {
  protected devices = signal<MediaDevice[]>([]);
  protected activeStreams = signal<Map<string, MediaStream>>(new Map());
  protected error = signal<string>('');

  readonly devices$ = this.devices.asReadonly();
  readonly activeStreams$ = this.activeStreams.asReadonly();
  readonly error$ = this.error.asReadonly();

  // Computed properties for device filtering
  readonly videoInputs = signal<MediaDevice[]>([]);
  readonly audioInputs = signal<MediaDevice[]>([]);
  readonly audioOutputs = signal<MediaDevice[]>([]);

  /**
   * Get the media constraint type for this service
   * Must be implemented by child services
   */
  protected abstract getMediaConstraintType(): 'video' | 'audio';

  /**
   * Initialize the media device service
   */
  protected async onInitialize(): Promise<void> {
    try {
      await this.refreshDevices();
      this.setupDeviceChangeListener();
      this.updateDeviceFilters();
    } catch (error) {
      this.logError('Error initializing media devices:', error);
      this.error.set('Failed to initialize media devices');
    }
  }

  /**
   * Refresh the list of available devices
   */
  async refreshDevices(): Promise<void> {
    return this.executeWithErrorHandling(async () => {
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.devices.set(devices);
      this.updateDeviceFilters();
    }, 'Failed to refresh devices');
  }

  /**
   * Update device filter signals
   */
  private updateDeviceFilters(): void {
    const devices = this.devices();
    this.videoInputs.set(devices.filter((d) => d.kind === 'videoinput'));
    this.audioInputs.set(devices.filter((d) => d.kind === 'audioinput'));
    this.audioOutputs.set(devices.filter((d) => d.kind === 'audiooutput'));
  }

  /**
   * Get user media with proper permission handling
   */
  async getUserMedia(constraints?: MediaStreamConstraints): Promise<MediaStream> {
    return this.executeWithErrorHandling(async () => {
      const defaultConstraints: MediaStreamConstraints = {
        [this.getMediaConstraintType()]: true,
      };

      const finalConstraints = constraints || defaultConstraints;

      // Check permissions first
      const permissionType = this.getMediaConstraintType() === 'video' ? 'camera' : 'microphone';
      const hasPermission = await this.requestPermission(permissionType);

      if (!hasPermission) {
        const granted = await this.requestPermission(permissionType);
        if (!granted) {
          throw new Error(`${permissionType} permission denied`);
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia(finalConstraints);

      // Store the stream immutably
      const streamId = this.generateStreamId();
      this.activeStreams.update((streams) => {
        const newStreams = new Map(streams);
        newStreams.set(streamId, stream);
        return newStreams;
      });

      return stream;
    }, 'Failed to get user media');
  }

  /**
   * Get display media for screen sharing
   */
  async getDisplayMedia(constraints?: MediaStreamConstraints): Promise<MediaStream> {
    return this.executeWithErrorHandling(async () => {
      const defaultConstraints: MediaStreamConstraints = {
        video: true,
        audio: false,
      };

      const finalConstraints = constraints || defaultConstraints;
      const stream = await navigator.mediaDevices.getDisplayMedia(finalConstraints);

      // Store the stream immutably
      const streamId = this.generateStreamId();
      this.activeStreams.update((streams) => {
        const newStreams = new Map(streams);
        newStreams.set(streamId, stream);
        return newStreams;
      });

      return stream;
    }, 'Failed to get display media');
  }

  /**
   * Stop a specific stream
   */
  stopStream(streamId: string): void {
    const streams = this.activeStreams();
    const stream = streams.get(streamId);

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      this.activeStreams.update((current) => {
        const newStreams = new Map(current);
        newStreams.delete(streamId);
        return newStreams;
      });
    }
  }

  /**
   * Stop all active streams
   */
  stopAllStreams(): void {
    const streams = this.activeStreams();
    streams.forEach((stream, streamId) => {
      this.stopStream(streamId);
    });
  }

  /**
   * Get devices by kind
   */
  getDevicesByKind(kind: MediaDeviceKind): MediaDevice[] {
    return this.devices().filter((device) => device.kind === kind);
  }

  /**
   * Get active streams count
   */
  getActiveStreamsCount(): number {
    return this.activeStreams().size;
  }

  /**
   * Check if there are active streams
   */
  hasActiveStreams(): boolean {
    return this.activeStreams().size > 0;
  }

  /**
   * Get devices with labels (permission granted)
   */
  getLabeledDevices(): MediaDevice[] {
    return this.devices().filter((device) => device.label.length > 0);
  }

  /**
   * Setup device change listener
   */
  private setupDeviceChangeListener(): void {
    if (!navigator.mediaDevices) return;

    const handler = () => {
      this.refreshDevices().catch((error) => {
        this.logError('Error handling device change:', error);
      });
    };

    navigator.mediaDevices.addEventListener('devicechange', handler);

    // Auto-cleanup when service is destroyed
    this.destroyRef.onDestroy(() => {
      navigator.mediaDevices.removeEventListener('devicechange', handler);
      this.logInfo('Device change listener cleaned up');
    });
  }

  /**
   * Generate a unique stream ID
   */
  private generateStreamId(): string {
    return `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Handle media-specific errors
   */
  protected handleMediaError(error: unknown): Error {
    let message: string;

    if (error instanceof Error) {
      switch (error.name) {
        case 'NotAllowedError':
          message = 'Permission denied by user';
          break;
        case 'NotFoundError':
          message = 'No media device found';
          break;
        case 'NotReadableError':
          message = 'Media device is already in use';
          break;
        case 'OverconstrainedError':
          message = 'Media constraints cannot be satisfied';
          break;
        case 'TypeError':
          message = 'Invalid media constraints provided';
          break;
        default:
          message = `Media error: ${error.message}`;
      }
    } else {
      message = 'Unknown media error occurred';
    }

    return this.createError(message, error);
  }

  /**
   * Cleanup when service is destroyed
   */
  protected onDestroy(): void {
    this.stopAllStreams();
  }

  private async executeWithErrorHandling<T>(
    operation: () => Promise<T>,
    errorMessage: string,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      this.logError(errorMessage, error);
      throw this.createError(errorMessage, error);
    }
  }
}
