import { Injectable, signal, inject, computed, OnDestroy } from '@angular/core';
import { from, Observable, Subject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { 
  MediaDevice, 
  MediaDeviceKind, 
  MediaStreamConstraints,
  MediaDevicesInfo
} from '../interfaces/media.interface';
import { BrowserSupportUtil } from '../utils/browser-support.util';
import { PermissionsService } from './permissions.service';
import { BrowserApiBaseService } from './base/browser-api-base.service';

@Injectable()
export class MediaDevicesService extends BrowserApiBaseService implements OnDestroy {
  private devices = signal<MediaDevice[]>([]);
  private activeStreams = signal<Map<string, MediaStream>>(new Map());
  private error = signal<string>('');

  constructor() {
    super();
    this.initializeDevices();
  }

  protected override getApiName(): string {
    return 'media-devices';
  }

  override isSupported(): boolean {
    return BrowserSupportUtil.isSupported('camera') || BrowserSupportUtil.isSupported('microphone');
  }

  private async initializeDevices(): Promise<void> {
    if (!this.isSupported() || this.isServerEnvironment()) {
      this.logWarning('Media Devices API not supported in this browser or server environment');
      return;
    }

    try {
      await this.refreshDevices();
      this.setupDeviceChangeListener();
    } catch (error) {
      this.logError('Error initializing media devices:', error);
    }
  }

  async refreshDevices(): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Media Devices API not supported');
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.devices.set(devices);
    } catch (error) {
      console.error('Error enumerating devices:', error);
      throw error;
    }
  }

  async getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream> {
    if (!this.isSupported()) {
      throw new Error('Media Devices API not supported');
    }

    try {
      // Verificar permisos según los constraints
      if (constraints.video) {
        await this.ensurePermission('camera');
      }
      if (constraints.audio) {
        await this.ensurePermission('microphone');
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.addActiveStream(stream);
      return stream;
    } catch (error) {
      console.error('Error getting user media:', error);
      throw error;
    }
  }

  async getDisplayMedia(constraints?: any): Promise<MediaStream> {
    if (!this.isSupported()) {
      throw new Error('Media Devices API not supported');
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia(constraints || {
        video: true,
        audio: false
      });
      this.addActiveStream(stream);
      return stream;
    } catch (error) {
      console.error('Error getting display media:', error);
      throw error;
    }
  }

  stopStream(stream: MediaStream): void {
    stream.getTracks().forEach(track => {
      track.stop();
    });
    this.removeActiveStream(stream);
  }

  stopAllStreams(): void {
    const streams = this.activeStreams();
    streams.forEach(stream => {
      this.stopStream(stream);
    });
  }

  getDevicesByKind(kind: MediaDeviceKind): MediaDevice[] {
    return this.devices().filter(device => device.kind === kind);
  }

  getDeviceById(deviceId: string): MediaDevice | undefined {
    return this.devices().find(device => device.deviceId === deviceId);
  }

  getDefaultVideoInput(): MediaDevice | undefined {
    const videoInputs = this.getDevicesByKind('videoinput');
    return videoInputs.find(device => device.deviceId === 'default') || videoInputs[0];
  }

  getDefaultAudioInput(): MediaDevice | undefined {
    const audioInputs = this.getDevicesByKind('audioinput');
    return audioInputs.find(device => device.deviceId === 'default') || audioInputs[0];
  }

  getDefaultAudioOutput(): MediaDevice | undefined {
    const audioOutputs = this.getDevicesByKind('audiooutput');
    return audioOutputs.find(device => device.deviceId === 'default') || audioOutputs[0];
  }

  async switchAudioOutput(deviceId: string): Promise<void> {
    if (!('setSinkId' in HTMLAudioElement.prototype)) {
      throw new Error('Audio output switching not supported');
    }

    // Esta función debe ser llamada desde el contexto de un elemento de audio
    // Por ahora es un placeholder
    console.log(`Switch audio output to: ${deviceId}`);
  }

  getMediaDevicesInfo(): MediaDevicesInfo {
    return {
      videoInputs: this.getDevicesByKind('videoinput').map(d => ({
        deviceId: d.deviceId,
        label: d.label,
        kind: 'videoinput'
      })),
      audioInputs: this.getDevicesByKind('audioinput'),
      audioOutputs: this.getDevicesByKind('audiooutput')
    };
  }

  async getDeviceCapabilities(deviceId: string): Promise<MediaTrackCapabilities | null> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } }
      });

      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities();
      
      stream.getTracks().forEach(t => t.stop());
      return capabilities;
    } catch (error) {
      console.error('Error getting device capabilities:', error);
      return null;
    }
  }

  async getDeviceSettings(deviceId: string): Promise<MediaTrackSettings | null> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } }
      });

      const track = stream.getVideoTracks()[0];
      const settings = track.getSettings();
      
      stream.getTracks().forEach(t => t.stop());
      return settings;
    } catch (error) {
      console.error('Error getting device settings:', error);
      return null;
    }
  }

  observeDevices(): Observable<MediaDevice[]> {
    return from(this.refreshDevices()).pipe(
      map(() => this.devices()),
      catchError(() => from([[]]))
    );
  }

  hasVideoInputs(): boolean {
    return this.getDevicesByKind('videoinput').length > 0;
  }

  hasAudioInputs(): boolean {
    return this.getDevicesByKind('audioinput').length > 0;
  }

  hasAudioOutputs(): boolean {
    return this.getDevicesByKind('audiooutput').length > 0;
  }

  getActiveStreamCount(): number {
    return this.activeStreams().size;
  }

  private async ensurePermission(permission: 'camera' | 'microphone'): Promise<void> {
    const hasPermission = await this.permissionsService.isGranted(permission);
    if (!hasPermission) {
      await this.permissionsService.request({ name: permission });
    }
  }

  private addActiveStream(stream: MediaStream): void {
    const streamId = stream.id;
    this.activeStreams.update(map => map.set(streamId, stream));
  }

  private removeActiveStream(stream: MediaStream): void {
    const streamId = stream.id;
    this.activeStreams.update(map => {
      map.delete(streamId);
      return map;
    });
  }

  private setupDeviceChangeListener(): void {
    if (this.isBrowserEnvironment()) {
      if (navigator.mediaDevices) {
        navigator.mediaDevices.addEventListener('devicechange', () => {
          this.refreshDevices();
        });
      }
    }
  }

  ngOnDestroy(): void {
    this.stopAllStreams();
    // No manual cleanup needed with takeUntilDestroyed
  }
}
