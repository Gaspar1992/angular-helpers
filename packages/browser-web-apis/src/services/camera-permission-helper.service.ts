import { Injectable, signal, inject } from '@angular/core';
import { PermissionsService } from './permissions.service';

@Injectable()
export class CameraPermissionHelperService {
  private permissionState = signal<'prompt' | 'granted' | 'denied'>('prompt');
  private isChecking = signal<boolean>(false);
  
  private permissionsService = inject(PermissionsService);

  readonly permissionState$ = this.permissionState.asReadonly();
  readonly isChecking$ = this.isChecking.asReadonly();

  async checkAndRequestPermission(): Promise<boolean> {
    if (this.isChecking()) {
      return false;
    }

    this.isChecking.set(true);

    try {
      // Primero verificar el estado actual
      const currentState = this.permissionsService.getPermissionState('camera');
      
      if (currentState === 'granted') {
        this.permissionState.set('granted');
        return true;
      }

      if (currentState === 'denied') {
        this.permissionState.set('denied');
        return false;
      }

      // Si está en 'prompt' o no se puede determinar, intentar solicitar el permiso
      return await this.requestPermissionDirectly();
    } catch (error) {
      console.error('Error checking camera permission:', error);
      this.permissionState.set('denied');
      return false;
    } finally {
      this.isChecking.set(false);
    }
  }

  private async requestPermissionDirectly(): Promise<boolean> {
    try {
      // Intentar obtener un stream temporal para solicitar el permiso
      const tempStream = await navigator.mediaDevices.getUserMedia({ 
        video: true 
      });
      
      // Detener inmediatamente el stream temporal
      tempStream.getTracks().forEach(track => track.stop());
      
      // Actualizar el estado del permiso
      this.permissionState.set('granted');
      this.permissionsService.updatePermissionState('camera', 'granted');
      
      return true;
    } catch (error: any) {
      this.permissionState.set('denied');
      this.permissionsService.updatePermissionState('camera', 'denied');
      
      console.error('Camera permission request failed:', error);
      
      // No lanzar error, solo registrar y devolver false
      return false;
    }
  }

  async requestPermissionWithUserPrompt(): Promise<boolean> {
    if (this.isChecking()) {
      return false;
    }

    this.isChecking.set(true);

    try {
      // Mostrar un mensaje explicativo antes de solicitar el permiso
      const userConfirmed = await this.showPermissionRequestDialog();
      
      if (!userConfirmed) {
        this.permissionState.set('denied');
        return false;
      }

      return await this.requestPermissionDirectly();
    } catch (error) {
      console.error('Error in permission request flow:', error);
      this.permissionState.set('denied');
      return false;
    } finally {
      this.isChecking.set(false);
    }
  }

  private async showPermissionRequestDialog(): Promise<boolean> {
    // Crear un diálogo personalizado para solicitar permiso
    return new Promise((resolve) => {
      const dialog = document.createElement('div');
      dialog.innerHTML = `
        <div style="
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          z-index: 10000;
          max-width: 400px;
          text-align: center;
        ">
          <h3 style="margin: 0 0 15px 0; color: #333;">Camera Access Required</h3>
          <p style="margin: 0 0 20px 0; color: #666; line-height: 1.4;">
            This application needs access to your camera to function properly. 
            Please allow camera access when prompted by your browser.
          </p>
          <div style="display: flex; gap: 10px; justify-content: center;">
            <button id="allow-btn" style="
              background: #007bff;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 4px;
              cursor: pointer;
            ">Allow Camera</button>
            <button id="deny-btn" style="
              background: #6c757d;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 4px;
              cursor: pointer;
            ">Deny</button>
          </div>
        </div>
        <div style="
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          z-index: 9999;
        "></div>
      `;

      document.body.appendChild(dialog);

      const allowBtn = dialog.querySelector('#allow-btn') as HTMLButtonElement;
      const denyBtn = dialog.querySelector('#deny-btn') as HTMLButtonElement;

      const cleanup = () => {
        document.body.removeChild(dialog);
      };

      allowBtn.onclick = () => {
        cleanup();
        resolve(true);
      };

      denyBtn.onclick = () => {
        cleanup();
        resolve(false);
      };

      // También cerrar si se hace clic fuera
      dialog.onclick = (e) => {
        if (e.target === dialog) {
          cleanup();
          resolve(false);
        }
      };
    });
  }

  resetPermissionState(): void {
    this.permissionState.set('prompt');
  }

  getPermissionState(): 'prompt' | 'granted' | 'denied' {
    return this.permissionState();
  }

  isPermissionGranted(): boolean {
    return this.permissionState() === 'granted';
  }

  isPermissionDenied(): boolean {
    return this.permissionState() === 'denied';
  }

  needsPermission(): boolean {
    return this.permissionState() === 'prompt';
  }
}
