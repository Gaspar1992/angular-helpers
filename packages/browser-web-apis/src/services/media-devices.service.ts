import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BrowserApiBaseService } from './base/browser-api-base.service';

interface DisplayMediaConstraints {
  video?: boolean | MediaTrackConstraints;
  audio?: boolean | MediaTrackConstraints;
}

@Injectable()
export class MediaDevicesService extends BrowserApiBaseService {
  protected override getApiName(): string {
    return 'media-devices';
  }

  private ensureMediaDevicesSupport(): void {
    if (!('mediaDevices' in navigator)) {
      throw new Error('MediaDevices API not supported in this browser');
    }
  }

  async getDevices(): Promise<MediaDeviceInfo[]> {
    this.ensureMediaDevicesSupport();

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices;
    } catch (error) {
      this.logError('Error enumerating devices:', error);
      throw this.createError('Failed to enumerate media devices', error);
    }
  }

  async getUserMedia(constraints?: MediaStreamConstraints): Promise<MediaStream> {
    this.ensureMediaDevicesSupport();

    try {
      const defaultConstraints: MediaStreamConstraints = {
        video: true,
        audio: true,
      };

      const finalConstraints = constraints || defaultConstraints;
      return await navigator.mediaDevices.getUserMedia(finalConstraints);
    } catch (error) {
      this.logError('Error getting user media:', error);
      throw this.handleMediaError(error);
    }
  }

  async getDisplayMedia(constraints?: DisplayMediaConstraints): Promise<MediaStream> {
    this.ensureMediaDevicesSupport();

    if (!('getDisplayMedia' in navigator.mediaDevices)) {
      throw new Error('Display media API not supported in this browser');
    }

    try {
      const defaultConstraints: DisplayMediaConstraints = {
        video: true,
        audio: false,
      };

      const finalConstraints = constraints || defaultConstraints;
      return await navigator.mediaDevices.getDisplayMedia(finalConstraints);
    } catch (error) {
      this.logError('Error getting display media:', error);
      throw this.createError('Failed to get display media', error);
    }
  }

  watchDeviceChanges(): Observable<MediaDeviceInfo[]> {
    this.ensureMediaDevicesSupport();

    return new Observable<MediaDeviceInfo[]>((observer) => {
      const handleDeviceChange = async () => {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          observer.next(devices);
        } catch (error) {
          this.logError('Error handling device change:', error);
        }
      };

      // Listen for device changes
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);

      // Get initial devices
      handleDeviceChange();

      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      };
    });
  }

  getVideoInputDevices(): Promise<MediaDeviceInfo[]> {
    return this.getDevicesByKind('videoinput');
  }

  getAudioInputDevices(): Promise<MediaDeviceInfo[]> {
    return this.getDevicesByKind('audioinput');
  }

  getAudioOutputDevices(): Promise<MediaDeviceInfo[]> {
    return this.getDevicesByKind('audiooutput');
  }

  private async getDevicesByKind(kind: MediaDeviceKind): Promise<MediaDeviceInfo[]> {
    const devices = await this.getDevices();
    return devices.filter((device) => device.kind === kind);
  }

  private handleMediaError(error: unknown): Error {
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

  // Direct access to native media devices API
  getNativeMediaDevices(): MediaDevices {
    this.ensureMediaDevicesSupport();
    return navigator.mediaDevices;
  }
}
