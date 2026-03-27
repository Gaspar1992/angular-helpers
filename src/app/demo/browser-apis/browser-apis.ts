import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '@angular-helpers/browser-web-apis';
import { PermissionsService } from '@angular-helpers/browser-web-apis';

@Component({
  selector: 'app-browser-apis',
  imports: [FormsModule],
  providers: [PermissionsService, NotificationService],
  templateUrl: './browser-apis.html',
  styleUrl: './browser-apis.css',
})
export class BrowserApisComponent {
  private notificationService = inject(NotificationService);
  // Permisos
  permissions = signal<Record<string, string>>({});

  // Cámara
  videoStream = signal<MediaStream | null>(null);
  availableCameras = signal<MediaDeviceInfo[]>([]);
  selectedCamera = signal<string>('');
  photoUrl = signal<string>('');

  // Geolocalización
  currentPosition = signal<GeolocationPosition | null>(null);
  watchPositionId = signal<number | null>(null);

  // Notificaciones
  notificationPermission = signal<string>('default');

  // Clipboard
  clipboardText = signal<string>('');

  // Media Devices
  audioDevices = signal<MediaDeviceInfo[]>([]);
  videoDevices = signal<MediaDeviceInfo[]>([]);

  // UI States
  loading = signal<boolean>(false);
  error = signal<string>('');
  success = signal<string>('');

  constructor() {
    this.initializeServices();
  }

  async initializeServices() {
    try {
      await this.refreshPermissions();
      await this.refreshDevices();
      this.notificationPermission.set(this.notificationService.permission);
    } catch (error: any) {
      this.setError('Error initializing services: ' + error);
    }
  }

  // Permisos
  async refreshPermissions() {
    try {
      const permNames = [
        'camera',
        'microphone',
        'geolocation',
        'notifications',
        'clipboard-read',
        'clipboard-write',
      ];
      const perms: Record<string, string> = {};

      for (const perm of permNames) {
        try {
          if ('permissions' in navigator) {
            const status = await navigator.permissions.query({ name: perm as PermissionName });
            perms[perm] = status.state;
          } else {
            perms[perm] = 'unsupported';
          }
        } catch (error) {
          perms[perm] = 'unsupported';
        }
      }
      this.permissions.set(perms);
    } catch (error: any) {
      this.setError('Error fetching permissions: ' + error);
    }
  }

  async requestPermission(permission: string) {
    this.loading.set(true);
    this.clearMessages();

    try {
      let status: string = 'denied';

      switch (permission) {
        case 'camera':
        case 'microphone':
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: permission === 'camera',
              audio: permission === 'microphone',
            });
            stream.getTracks().forEach((track) => track.stop());
            status = 'granted';
          } catch (error) {
            status = 'denied';
          }
          break;

        case 'notifications':
          status = await this.notificationService.requestNotificationPermission();
          this.notificationPermission.set(status);
          break;

        case 'geolocation':
          try {
            await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject);
            });
            status = 'granted';
          } catch (error) {
            status = 'denied';
          }
          break;

        default:
          status = 'unsupported';
      }

      this.setSuccess(`Permission ${permission}: ${status}`);
      await this.refreshPermissions();
    } catch (error: any) {
      this.setError('Error requesting permission: ' + error);
    } finally {
      this.loading.set(false);
    }
  }

  // Cámara
  async refreshDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');
      const audioInputs = devices.filter((d) => d.kind === 'audioinput');

      this.availableCameras.set(videoInputs);
      this.audioDevices.set(audioInputs);
      this.videoDevices.set(videoInputs);

      if (videoInputs.length > 0 && !this.selectedCamera()) {
        this.selectedCamera.set(videoInputs[0].deviceId);
      }
    } catch (error: any) {
      this.setError('Error fetching devices: ' + error);
    }
  }

  async startCamera() {
    this.loading.set(true);
    this.clearMessages();

    try {
      const constraints = this.selectedCamera()
        ? { video: { deviceId: { exact: this.selectedCamera() } } }
        : { video: true };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.videoStream.set(stream);
      this.setSuccess('Camera started');
    } catch (error: any) {
      this.setError('Error starting camera: ' + error);
    } finally {
      this.loading.set(false);
    }
  }

  stopCamera() {
    const stream = this.videoStream();
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    this.videoStream.set(null);
    this.photoUrl.set('');
    this.setSuccess('Camera stopped');
  }

  async takePhoto() {
    if (!this.videoStream()) {
      this.setError('No active camera stream');
      return;
    }

    this.loading.set(true);
    this.clearMessages();

    try {
      const stream = this.videoStream()!;
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      await new Promise((resolve) => setTimeout(resolve, 100));

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(video, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          this.photoUrl.set(url);
          this.setSuccess('Photo captured');
        }
      });
    } catch (error: any) {
      this.setError('Error taking photo: ' + error);
    } finally {
      this.loading.set(false);
    }
  }

  // Geolocalización
  async getCurrentLocation() {
    this.loading.set(true);
    this.clearMessages();

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      this.currentPosition.set(position);
      this.setSuccess(
        `Location: ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`,
      );
    } catch (error: any) {
      this.setError('Error getting location: ' + error);
    } finally {
      this.loading.set(false);
    }
  }

  startWatchingPosition() {
    this.clearMessages();

    try {
      const watchId = navigator.geolocation.watchPosition(
        (position: GeolocationPosition) => {
          this.currentPosition.set(position);
          this.setSuccess('Position updated');
        },
        (error: any) => {
          this.setError('Watch position error: ' + error.message);
        },
        { enableHighAccuracy: true },
      );

      this.watchPositionId.set(watchId);
      this.setSuccess('Watching position');
    } catch (error: any) {
      this.setError('Error starting position watch: ' + error);
    }
  }

  stopWatchingPosition() {
    const watchId = this.watchPositionId();
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      this.watchPositionId.set(null);
      this.setSuccess('Position watch stopped');
    }
  }

  // Notificaciones
  async requestNotificationPermission() {
    this.loading.set(true);
    this.clearMessages();

    try {
      const permission = await this.notificationService.requestNotificationPermission();
      this.notificationPermission.set(permission);
      this.setSuccess(`Notification permission: ${permission}`);
    } catch (error: any) {
      this.setError('Error requesting notification permission: ' + error);
    } finally {
      this.loading.set(false);
    }
  }

  async showNotification() {
    this.loading.set(true);
    this.clearMessages();

    try {
      await this.notificationService.showNotification('Angular Helpers Demo', {
        body: 'Test notification from the Angular Helpers demo',
        tag: 'demo-notification',
        requireInteraction: true,
      });
      this.setSuccess('Notification sent — check your system notification area');
    } catch (error: any) {
      this.setError('Error showing notification: ' + error);
    } finally {
      this.loading.set(false);
    }
  }

  async copyToClipboard() {
    const text = 'Test text from Angular Helpers Demo — ' + new Date().toISOString();
    this.loading.set(true);
    this.clearMessages();

    try {
      if ('clipboard' in navigator && 'writeText' in navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        this.clipboardText.set(text);
        this.setSuccess('Text copied to clipboard');
      } else {
        this.setError('Clipboard API not supported');
      }
    } catch (error: any) {
      this.setError('Error copying text: ' + error);
    } finally {
      this.loading.set(false);
    }
  }

  async pasteFromClipboard() {
    this.loading.set(true);
    this.clearMessages();

    try {
      if ('clipboard' in navigator && 'readText' in navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        this.clipboardText.set(text);
        this.setSuccess('Text pasted from clipboard');
      } else {
        this.setError('Clipboard API not supported');
      }
    } catch (error: any) {
      this.setError('Error pasting text: ' + error);
    } finally {
      this.loading.set(false);
    }
  }

  // Utilidades
  setError(message: string) {
    this.error.set(message);
    setTimeout(() => this.error.set(''), 5000);
  }

  setSuccess(message: string) {
    this.success.set(message);
    setTimeout(() => this.success.set(''), 3000);
  }

  clearMessages() {
    this.error.set('');
    this.success.set('');
  }

  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString();
  }

  ngOnDestroy() {
    this.stopCamera();
    this.stopWatchingPosition();
  }
}
