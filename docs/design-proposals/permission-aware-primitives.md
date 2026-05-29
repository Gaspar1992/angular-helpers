# Propuesta de Diseño: Primitivas Reactivas Permission-Aware

Esta propuesta detalla el diseño y la especificación técnica para la introducción de primitivas reactivas con detección de permisos integrada dentro de `@angular-helpers/browser-web-apis`.

---

## 📐 Diseño Arquitectónico: `injectPermissionAwareCamera`

El objetivo principal es unificar el acceso al hardware (`CameraService`) y la gestión de permisos nativos (`PermissionsService`) en una única primitiva funcional reactiva que maneje el ciclo de vida del recurso de forma declarativa.

### 1. Interfaz de Uso (Developer Experience - DX)

El componente consumidor interactúa directamente con señales síncronas que reflejan el estado del hardware y el permiso nativo:

```typescript
import { Component } from '@angular/core';
import { injectPermissionAwareCamera } from '@angular-helpers/browser-web-apis';

@Component({
  selector: 'app-photo-booth',
  template: `
    @if (camera.permissionState() === 'prompt') {
      <button (click)="camera.request()">Activar Cámara</button>
    } @else if (camera.permissionState() === 'denied') {
      <p class="error">Acceso denegado. Habilitalo en los ajustes de tu navegador.</p>
    } @else if (camera.stream()) {
      <video [srcObject]="camera.stream()" autoplay playsinline></video>
      <button (click)="camera.stop()">Apagar</button>
    }
  `,
})
export class PhotoBoothComponent {
  // Inicialización y liberación automática ligada al ciclo de vida del componente
  readonly camera = injectPermissionAwareCamera({ video: true, audio: false });
}
```

---

### 2. Especificación del Contrato

```typescript
export interface PermissionAwareCameraRef {
  /** Signal reactivo con el estado del permiso nativo */
  permissionState: Signal<PermissionState | 'unsupported'>;
  /** Signal con el stream de video activo o null */
  stream: Signal<MediaStream | null>;
  /** Signal que indica si estamos en proceso de solicitud de la cámara */
  loading: Signal<boolean>;
  /** Error en caso de que falle la inicialización o captura */
  error: Signal<Error | null>;
  /** Método imperativo para disparar la cámara (e.g. al hacer click en el botón) */
  request: () => Promise<MediaStream>;
  /** Método para apagar y liberar la cámara */
  stop: () => void;
}
```

---

### 3. Implementación Propuesta

```typescript
import { inject, signal, DestroyRef, Signal } from '@angular/core';
import { CameraService } from '../services/camera.service';
import { PermissionsService } from '../services/permissions.service';

export function injectPermissionAwareCamera(
  options: MediaStreamConstraints = { video: true },
): PermissionAwareCameraRef {
  const permissions = inject(PermissionsService);
  const cameraService = inject(CameraService);
  const destroyRef = inject(DestroyRef);

  const permissionSignal = signal<PermissionState | 'unsupported'>('prompt');
  const streamSignal = signal<MediaStream | null>(null);
  const loadingSignal = signal(false);
  const errorSignal = signal<Error | null>(null);

  // 1. Monitorear el estado de los permisos de forma reactiva
  if (permissions.isSupported()) {
    permissions.query('camera').subscribe({
      next: (state) => permissionSignal.set(state),
      error: () => permissionSignal.set('unsupported'),
    });
  } else {
    permissionSignal.set('unsupported');
  }

  const request = async () => {
    loadingSignal.set(true);
    errorSignal.set(null);
    try {
      const activeStream = await cameraService.startCamera(options);
      streamSignal.set(activeStream);
      permissionSignal.set('granted');
      return activeStream;
    } catch (err: any) {
      errorSignal.set(err);
      throw err;
    } finally {
      loadingSignal.set(false);
    }
  };

  const stop = () => {
    cameraService.stopCamera();
    streamSignal.set(null);
  };

  // 2. Liberación automática del hardware al destruir el componente
  destroyRef.onDestroy(() => {
    stop();
  });

  return {
    permissionState: permissionSignal.asReadonly(),
    stream: streamSignal.asReadonly(),
    loading: loadingSignal.asReadonly(),
    error: errorSignal.asReadonly(),
    request,
    stop,
  };
}
```

---

## 🌟 Beneficios Clave

- **Seguridad Garantizada**: El uso de `DestroyRef.onDestroy` evita fugas de recursos y que el LED de la cámara quede encendido si el usuario sale del componente abruptamente.
- **Acoplamiento Cero**: Limpieza absoluta de la UI al usar flujo declarativo en los templates en base al estado de la señal.
- **Extensibilidad**: Este patrón es 100% extrapolable a otras APIs síncronas/asíncronas como `injectPermissionAwareGeolocation` e `injectPermissionAwareClipboard`.
