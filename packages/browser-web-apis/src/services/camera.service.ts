import { Injectable, signal, computed } from '@angular/core';
import { from, Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { 
  MediaDevice, 
  MediaDeviceKind, 
  MediaStreamConstraints, 
  CameraInfo,
  MediaDevicesInfo 
} from '../interfaces/media.interface';
import { BrowserSupportUtil } from '../utils/browser-support.util';
import { PermissionsService } from './permissions.service';

@Injectable({
  providedIn: 'root'
})
export class CameraService {
  private currentStream = signal<MediaStream | null>(null);
  private availableDevices = signal<MediaDevice[]>([]);
  private isStreaming = signal<boolean>(false);

  readonly currentStream$ = computed(() => this.currentStream());
  readonly availableDevices$ = computed(() => this.availableDevices());
  readonly isStreaming$ = computed(() => this.isStreaming());

  constructor(private permissionsService: PermissionsService) {
    this.initializeDevices();
  }

  private async initializeDevices(): Promise<void> {
    if (!this.isSupported()) {
      console.warn('Camera API not supported in this browser');
      return;
    }

    try {
      await this.refreshDevices();
    } catch (error) {
      console.error('Error initializing camera devices:', error);
    }
  }

  async refreshDevices(): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Camera API not supported');
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      this.availableDevices.set(videoDevices);
    } catch (error) {
      console.error('Error enumerating devices:', error);
      throw error;
    }
  }

  async startCamera(constraints?: MediaStreamConstraints): Promise<MediaStream> {
    if (!this.isSupported()) {
      throw new Error('Camera API not supported');
    }

    if (this.isStreaming()) {
      this.stopCamera();
    }

    try {
      // Verificar permisos
      const hasPermission = await this.permissionsService.isGranted('camera');
      if (!hasPermission) {
        await this.permissionsService.request({ name: 'camera' });
      }

      const streamConstraints: MediaStreamConstraints = constraints || {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(streamConstraints);
      this.currentStream.set(stream);
      this.isStreaming.set(true);

      // Escuchar cambios en dispositivos
      this.setupDeviceChangeListener();

      return stream;
    } catch (error) {
      console.error('Error starting camera:', error);
      throw error;
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
    if (!this.isSupported()) {
      throw new Error('Camera API not supported');
    }

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
    if (!this.isSupported()) {
      return null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } }
      });

      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities();
      
      stream.getTracks().forEach(t => t.stop());
      return capabilities;
    } catch (error) {
      console.error('Error getting camera capabilities:', error);
      return null;
    }
  }

  async getCameraInfo(deviceId: string): Promise<CameraInfo | null> {
    const devices = this.availableDevices();
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
          min: (capabilities.width as any)?.min || 0,
          max: (capabilities.width as any)?.max || 0,
          step: (capabilities.width as any)?.step || 1
        },
        height: {
          min: (capabilities.height as any)?.min || 0,
          max: (capabilities.height as any)?.max || 0,
          step: (capabilities.height as any)?.step || 1
        },
        aspectRatio: {
          min: (capabilities.aspectRatio as any)?.min || 0,
          max: (capabilities.aspectRatio as any)?.max || 0,
          step: (capabilities.aspectRatio as any)?.step || 0.1
        },
        frameRate: {
          min: (capabilities.frameRate as any)?.min || 0,
          max: (capabilities.frameRate as any)?.max || 0,
          step: (capabilities.frameRate as any)?.step || 1
        },
        facingMode: capabilities.facingMode ? [(capabilities.facingMode as unknown) as string] : ['user']
      } : undefined,
      kind: 'videoinput'
    };
  }

  getMediaDevicesInfo(): MediaDevicesInfo {
    const devices = this.availableDevices();
    
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
    const stream = this.currentStream();
    if (!stream) {
      throw new Error('No active camera stream');
    }

    try {
      const track = stream.getVideoTracks()[0];
      const imageCapture = new ImageCapture(track);
      return await imageCapture.takePhoto();
    } catch (error) {
      console.error('Error taking picture:', error);
      return null;
    }
  }

  isSupported(): boolean {
    return BrowserSupportUtil.isSupported('camera');
  }

  hasMultipleCameras(): boolean {
    const videoDevices = this.availableDevices().filter(d => d.kind === 'videoinput');
    return videoDevices.length > 1;
  }

  getActiveCamera(): MediaDevice | null {
    const stream = this.currentStream();
    if (!stream) {
      return null;
    }

    const track = stream.getVideoTracks()[0];
    const deviceId = track.getSettings().deviceId;
    
    return this.availableDevices().find(d => d.deviceId === deviceId) || null;
  }

  observeDevices(): Observable<MediaDevice[]> {
    return from(this.refreshDevices()).pipe(
      map(() => this.availableDevices()),
      catchError(() => from([[]]))
    );
  }

  private setupDeviceChangeListener(): void {
    navigator.mediaDevices.addEventListener('devicechange', () => {
      this.refreshDevices();
    });
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }
}
