import { Injectable } from '@angular/core';
import { BrowserApiBaseService } from './base/browser-api-base.service';

@Injectable()
export class CameraService extends BrowserApiBaseService {
  private currentStream: MediaStream | null = null;

  protected override getApiName(): string {
    return 'camera';
  }

  private ensureCameraSupport(): void {
    if (!('mediaDevices' in navigator) || !('getUserMedia' in navigator.mediaDevices)) {
      throw new Error('Camera API not supported in this browser');
    }
  }

  async startCamera(constraints?: MediaStreamConstraints): Promise<MediaStream> {
    this.ensureCameraSupport();

    if (this.currentStream) {
      this.stopCamera();
    }

    try {
      const streamConstraints: MediaStreamConstraints = constraints || {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
      };

      this.currentStream = await navigator.mediaDevices.getUserMedia(streamConstraints);
      return this.currentStream;
    } catch (error: unknown) {
      this.logError('Error starting camera:', error);

      if (error instanceof Error && error.name === 'NotAllowedError') {
        throw this.createError(
          'Camera permission denied by user. Please allow camera access in your browser settings and refresh the page.',
          error,
        );
      } else if (error instanceof Error && error.name === 'NotFoundError') {
        throw this.createError(
          'No camera device found. Please connect a camera and try again.',
          error,
        );
      } else if (error instanceof Error && error.name === 'NotReadableError') {
        throw this.createError(
          'Camera is already in use by another application. Please close other applications using the camera and try again.',
          error,
        );
      } else if (error instanceof Error && error.name === 'OverconstrainedError') {
        throw this.createError(
          'Camera constraints cannot be satisfied. Try with different camera settings.',
          error,
        );
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        throw this.createError(`Camera error: ${errorMessage}`, error);
      }
    }
  }

  stopCamera(): void {
    if (this.currentStream) {
      this.currentStream.getTracks().forEach((track: MediaStreamTrack) => {
        track.stop();
      });
      this.currentStream = null;
    }
  }

  async switchCamera(
    deviceId: string,
    constraints: MediaStreamConstraints = {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    },
  ): Promise<MediaStream> {
    this.stopCamera();

    const finalConstraints: MediaStreamConstraints = {
      video:
        constraints.video && typeof constraints.video === 'object'
          ? { ...constraints.video, deviceId: { exact: deviceId } }
          : { deviceId: { exact: deviceId } },
    };

    return this.startCamera(finalConstraints);
  }

  async getCameraCapabilities(deviceId: string): Promise<MediaTrackCapabilities | null> {
    this.ensureCameraSupport();

    try {
      const activeTrack = this.currentStream
        ?.getVideoTracks()
        .find((t) => t.getSettings().deviceId === deviceId);

      if (activeTrack) {
        return activeTrack.getCapabilities() ?? null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
      });

      const videoTrack = stream.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities();
      stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());

      return capabilities ?? null;
    } catch (error) {
      this.logError('Error getting camera capabilities:', error);
      return null;
    }
  }

  getCurrentStream(): MediaStream | null {
    return this.currentStream;
  }

  isStreaming(): boolean {
    return this.currentStream !== null;
  }

  async getVideoInputDevices(): Promise<MediaDeviceInfo[]> {
    this.ensureCameraSupport();

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter((device) => device.kind === 'videoinput');
    } catch (error) {
      this.logError('Error enumerating video devices:', error);
      throw this.createError('Failed to enumerate video devices', error);
    }
  }

  // Direct access to native camera API
  getNativeMediaDevices(): MediaDevices {
    this.ensureCameraSupport();
    return navigator.mediaDevices;
  }
}
