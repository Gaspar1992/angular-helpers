import { Injectable, signal, inject } from '@angular/core';
import { from, Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { 
  MediaDevice, 
  MediaStreamConstraints, 
  CameraInfo,
  MediaDevicesInfo 
} from '../interfaces/media.interface';
import { CameraPermissionHelperService } from './camera-permission-helper.service';
import { MediaDeviceBaseService } from './base/media-device-base.service';

@Injectable()
export class CameraService extends MediaDeviceBaseService {
  private currentStream = signal<MediaStream | null>(null);
  private isStreaming = signal<boolean>(false);

  readonly currentStream$ = this.currentStream.asReadonly();
  readonly isStreaming$ = this.isStreaming.asReadonly();
  readonly videoInputs$ = this.videoInputs.asReadonly();

  private permissionHelper = inject(CameraPermissionHelperService);

  protected override getApiName(): string {
    return 'camera';
  }

  protected override getMediaConstraintType(): 'video' | 'audio' {
    return 'video';
  }

  async startCamera(constraints?: MediaStreamConstraints): Promise<MediaStream> {
    if (this.isServerEnvironment()) {
      throw new Error('Camera API not available in server environment');
    }

    if (this.isStreaming()) {
      this.stopCamera();
    }

    try {
      // Use the helper to check and request permissions
      const hasPermission = await this.permissionHelper.checkAndRequestPermission();
      
      if (!hasPermission) {
        throw new Error('Camera permission is required to use the camera. Please allow camera access in your browser settings.');
      }

      const streamConstraints: MediaStreamConstraints = constraints || {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      };

      // Get the camera stream using the base method
      const stream = await this.getUserMedia(streamConstraints);
      this.currentStream.set(stream);
      this.isStreaming.set(true);

      return stream;
    } catch (error: unknown) {
      this.logError('Error starting camera:', error);
      
      // Provide a more descriptive error
      if (error instanceof Error && error.name === 'NotAllowedError') {
        throw new Error('Camera permission denied by user. Please allow camera access in your browser settings and refresh the page.', { cause: error });
      } else if (error instanceof Error && error.name === 'NotFoundError') {
        throw new Error('No camera device found. Please connect a camera and try again.', { cause: error });
      } else if (error instanceof Error && error.name === 'NotReadableError') {
        throw new Error('Camera is already in use by another application. Please close other applications using the camera and try again.', { cause: error });
      } else if (error instanceof Error && error.name === 'OverconstrainedError') {
        throw new Error('Camera constraints cannot be satisfied. Try with different camera settings.', { cause: error });
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        throw new Error(`Camera error: ${errorMessage}`, { cause: error });
      }
    }
  }

  stopCamera(): void {
    const stream = this.currentStream();
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
      });
      this.currentStream.set(null);
      this.isStreaming.set(false);
    }
  }

  async switchCamera(deviceId: string): Promise<MediaStream> {
    this.stopCamera();

    const constraints: MediaStreamConstraints = {
      video: {
        deviceId: { exact: deviceId },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    };

    return this.startCamera(constraints);
  }

  async getCameraCapabilities(deviceId: string): Promise<MediaTrackCapabilities | null> {
    return this.executeWithErrorHandling(async () => {
      const stream = await this.getUserMedia({
        video: { deviceId: { exact: deviceId } }
      });

      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities();
      
      stream.getTracks().forEach(t => t.stop());
      return capabilities;
    }, 'Failed to get camera capabilities');
  }

  async getCameraInfo(deviceId: string): Promise<CameraInfo | null> {
    const devices = this.devices();
    const device = devices.find(d => d.deviceId === deviceId);
    
    if (!device) {
      return null;
    }

    const capabilities = await this.getCameraCapabilities(deviceId);

    return {
      deviceId: device.deviceId,
      label: device.label,
      capabilities: capabilities ? {
        width: {
          min: capabilities.width?.min || 0,
          max: capabilities.width?.max || 0,
          step: 1
        },
        height: {
          min: capabilities.height?.min || 0,
          max: capabilities.height?.max || 0,
          step: 1
        },
        aspectRatio: {
          min: capabilities.aspectRatio?.min || 0,
          max: capabilities.aspectRatio?.max || 0,
          step: 0.1
        },
        frameRate: {
          min: capabilities.frameRate?.min || 0,
          max: capabilities.frameRate?.max || 0,
          step: 1
        },
        facingMode: capabilities.facingMode ? [(capabilities.facingMode as unknown) as string] : ['user']
      } : undefined,
      kind: 'videoinput'
    };
  }

  getMediaDevicesInfo(): MediaDevicesInfo {
    const devices = this.devices();
    
    return {
      videoInputs: devices.filter(d => d.kind === 'videoinput').map(d => ({
        deviceId: d.deviceId,
        label: d.label,
        kind: 'videoinput'
      })),
      audioInputs: devices.filter(d => d.kind === 'audioinput'),
      audioOutputs: devices.filter(d => d.kind === 'audiooutput')
    };
  }

  async takePicture(): Promise<Blob | null> {
    if (this.isServerEnvironment()) {
      throw new Error('Camera API not available in server environment');
    }

    const stream = this.currentStream();
    if (!stream) {
      throw new Error('No active camera stream');
    }

    try {
      const track = stream.getVideoTracks()[0];
      const imageCapture = new ImageCapture(track);
      return await imageCapture.takePhoto();
    } catch (error) {
      this.logError('Error taking picture:', error);
      return null;
    }
  }

  override isSupported(): boolean {
    return super.isSupported();
  }

  hasMultipleCameras(): boolean {
    return this.videoInputs().length > 1;
  }

  getActiveCamera(): MediaDevice | null {
    const stream = this.currentStream();
    if (!stream) {
      return null;
    }

    const track = stream.getVideoTracks()[0];
    const deviceId = track.getSettings().deviceId;
    
    return this.devices().find(d => d.deviceId === deviceId) || null;
  }

  observeDevices(): Observable<MediaDevice[]> {
    return from(this.refreshDevices()).pipe(
      map(() => this.devices()),
      catchError(() => from([[]]))
    );
  }

  // Public methods for permission handling
  async requestCameraPermission(): Promise<boolean> {
    return await this.permissionHelper.checkAndRequestPermission();
  }

  async requestCameraPermissionWithDialog(): Promise<boolean> {
    return await this.permissionHelper.requestPermissionWithUserPrompt();
  }

  getCameraPermissionState(): 'prompt' | 'granted' | 'denied' {
    return this.permissionHelper.getPermissionState();
  }

  isCameraPermissionGranted(): boolean {
    return this.permissionHelper.isPermissionGranted();
  }

  isCameraPermissionDenied(): boolean {
    return this.permissionHelper.isPermissionDenied();
  }

  needsCameraPermission(): boolean {
    return this.permissionHelper.needsPermission();
  }

  resetCameraPermission(): void {
    this.permissionHelper.resetPermissionState();
  }
}
