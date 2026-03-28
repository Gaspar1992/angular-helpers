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
      // Inicializar permisos
      await this.refreshPermissions();

      // Initialize devices
      await this.refreshDevices();

      // Sync notification permission state
      this.notificationPermission.set(this.notificationService.permission);
    } catch (error: any) {
      this.setError('Error inicializando servicios: ' + error);
    }
  }

  // Permisos
  async refreshPermissions() {
    try {
      const standardPerms = ['camera', 'microphone', 'geolocation', 'notifications'];
      const perms: Record<string, string> = {};

      for (const perm of standardPerms) {
        try {
          if ('permissions' in navigator) {
            const status = await navigator.permissions.query({ name: perm as PermissionName });
            perms[perm] = status.state;
          } else {
            perms[perm] = 'unsupported';
          }
        } catch {
          perms[perm] = 'unsupported';
        }
      }

      // clipboard-read / clipboard-write: permissions.query throws in many
      // browser/context combinations. Fall back to checking Clipboard API availability.
      for (const clipPerm of ['clipboard-read', 'clipboard-write'] as const) {
        if (!('clipboard' in navigator)) {
          perms[clipPerm] = 'unsupported';
          continue;
        }
        try {
          const status = await navigator.permissions.query({
            name: clipPerm as PermissionName,
          });
          perms[clipPerm] = status.state;
        } catch {
          // Clipboard API exists but permissions.query doesn't support this name
          // (e.g. Firefox). Treat as 'prompt' — user will be asked on first use.
          perms[clipPerm] = 'prompt';
        }
      }

      this.permissions.set(perms);
    } catch (error: any) {
      this.setError('Error obteniendo permisos: ' + error);
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
          } catch {
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
          } catch {
            status = 'denied';
          }
          break;

        case 'clipboard-read':
          if (!('clipboard' in navigator)) {
            status = 'unsupported';
            break;
          }
          try {
            await navigator.clipboard.readText();
            status = 'granted';
          } catch {
            // readText() rejected — either denied or requires user gesture;
            // re-check the actual permission state
            try {
              const s = await navigator.permissions.query({
                name: 'clipboard-read' as PermissionName,
              });
              status = s.state;
            } catch {
              status = 'denied';
            }
          }
          break;

        case 'clipboard-write':
          if (!('clipboard' in navigator)) {
            status = 'unsupported';
            break;
          }
          try {
            await navigator.clipboard.writeText('');
            status = 'granted';
          } catch {
            try {
              const s = await navigator.permissions.query({
                name: 'clipboard-write' as PermissionName,
              });
              status = s.state;
            } catch {
              status = 'denied';
            }
          }
          break;

        default:
          status = 'unsupported';
      }

      this.setSuccess(`Permission ${permission}: ${status}`);
      await this.refreshPermissions();
    } catch (error: any) {
      this.setError('Error solicitando permiso: ' + error);
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
      this.setError('Error obteniendo dispositivos: ' + error);
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
      this.setSuccess('Cámara iniciada correctamente');
    } catch (error: any) {
      this.setError('Error iniciando cámara: ' + error);
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
    this.setSuccess('Cámara detenida');
  }

  async takePhoto() {
    if (!this.videoStream()) {
      this.setError('No hay cámara activa');
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
          this.setSuccess('Foto tomada correctamente');
        }
      });
    } catch (error: any) {
      this.setError('Error tomando foto: ' + error);
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
      this.setError('Error obteniendo ubicación: ' + error);
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
          this.setSuccess('Posición actualizada');
        },
        (error: any) => {
          this.setError('Error en watch position: ' + error.message);
        },
        { enableHighAccuracy: true },
      );

      this.watchPositionId.set(watchId);
      this.setSuccess('Watch position iniciado');
    } catch (error: any) {
      this.setError('Error iniciando watch position: ' + error);
    }
  }

  stopWatchingPosition() {
    const watchId = this.watchPositionId();
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      this.watchPositionId.set(null);
      this.setSuccess('Watch position detenido');
    }
  }

  // Notificaciones
  async requestNotificationPermission() {
    this.loading.set(true);
    this.clearMessages();

    try {
      const permission = await this.notificationService.requestNotificationPermission();
      this.notificationPermission.set(permission);
      this.setSuccess(`Permiso de notificaciones: ${permission}`);
    } catch (error: any) {
      this.setError('Error solicitando permiso de notificaciones: ' + error);
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
      this.setError('Error mostrando notificación: ' + error);
    } finally {
      this.loading.set(false);
    }
  }

  // Clipboard
  async copyToClipboard() {
    const text = 'Texto de prueba desde Browser APIs Demo - ' + new Date().toISOString();
    this.loading.set(true);
    this.clearMessages();

    try {
      if ('clipboard' in navigator && 'writeText' in navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        this.clipboardText.set(text);
        this.setSuccess('Texto copiado al clipboard');
      } else {
        this.setError('Clipboard API no soportada');
      }
    } catch (error: any) {
      this.setError('Error copiando texto: ' + error);
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
        this.setSuccess('Texto pegado desde clipboard');
      } else {
        this.setError('Clipboard API no soportada');
      }
    } catch (error: any) {
      this.setError('Error pegando texto: ' + error);
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
