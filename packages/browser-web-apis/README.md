# @angular-helpers/browser-web-apis

Sistema de servicios Angular para acceso formalizado a Browser Web APIs (cámara, permisos, geolocalización, etc.).

## 🚀 Características

### 📸 **Camera Service**
- Acceso a cámaras con gestión de permisos
- Detección de múltiples cámaras
- Captura de fotos y video
- Switch entre cámaras
- Obtención de capacidades y configuraciones

### 🗺️ **Geolocation Service**
- Obtención de posición actual
- Watch de posición en tiempo real
- Cálculo de distancias
- Verificación de permisos
- Manejo de errores y timeouts

### 🔔 **Notification Service**
- Notificaciones del navegador
- Gestión de permisos
- Notificaciones persistentes con Service Workers
- Notificaciones con progreso
- Programación de notificaciones

### 📋 **Clipboard Service**
- Leer y escribir texto
- Copiar y pegar imágenes
- Gestión de permisos
- Soporte para diferentes tipos de datos

### 🎥 **Media Devices Service**
- Enumeración de dispositivos de medios
- Gestión de streams activos
- Acceso a micrófonos y cámaras
- Screen sharing
- Switch de dispositivos de audio

### 🔐 **Permissions Service**
- Gestión centralizada de permisos
- Query de estado de permisos
- Request de permisos
- Observación de cambios
- Soporte para múltiples APIs

## 📦 Instalación

```bash
npm install @angular-helpers/browser-web-apis
```

## 🔧 Configuración

Importa el módulo en tu aplicación:

```typescript
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserWebApisModule } from '@angular-helpers/browser-web-apis';

@NgModule({
  imports: [
    BrowserModule,
    BrowserWebApisModule.forRoot()
  ],
  // ...
})
export class AppModule { }
```

## 📖 Uso

### Camera Service

```typescript
import { Component } from '@angular/core';
import { CameraService } from '@angular-helpers/browser-web-apis';

@Component({
  selector: 'app-camera-demo',
  template: `
    <button (click)="startCamera()">Iniciar Cámara</button>
    <button (click)="stopCamera()">Detener Cámara</button>
    <button (click)="takePicture()">Tomar Foto</button>
    <video #video [srcObject]="stream" autoplay></video>
  `
})
export class CameraDemoComponent {
  stream: MediaStream | null = null;

  constructor(private cameraService: CameraService) {}

  async startCamera() {
    try {
      this.stream = await this.cameraService.startCamera({
        video: { width: 1280, height: 720 }
      });
    } catch (error) {
      console.error('Error al iniciar cámara:', error);
    }
  }

  stopCamera() {
    this.cameraService.stopCamera();
  }

  async takePicture() {
    try {
      const photo = await this.cameraService.takePicture();
      console.log('Foto tomada:', photo);
    } catch (error) {
      console.error('Error al tomar foto:', error);
    }
  }
}
```

### Geolocation Service

```typescript
import { Component } from '@angular/core';
import { GeolocationService } from '@angular-helpers/browser-web-apis';

@Component({
  selector: 'app-geo-demo',
  template: `
    <button (click)="getCurrentLocation()">Mi Ubicación</button>
    <p *ngIf="position">
      Lat: {{ position.coords.latitude }}, 
      Lon: {{ position.coords.longitude }}
    </p>
  `
})
export class GeoDemoComponent {
  position: GeolocationPosition | null = null;

  constructor(private geoService: GeolocationService) {}

  async getCurrentLocation() {
    try {
      this.position = await this.geoService.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
    }
  }
}
```

### Notification Service

```typescript
import { Component } from '@angular/core';
import { NotificationService } from '@angular-helpers/browser-web-apis';

@Component({
  selector: 'app-notification-demo',
  template: `
    <button (click)="showNotification()">Mostrar Notificación</button>
  `
})
export class NotificationDemoComponent {
  constructor(private notificationService: NotificationService) {}

  async showNotification() {
    try {
      await this.notificationService.showNotification({
        title: '¡Hola!',
        body: 'Esta es una notificación de prueba',
        icon: '/assets/icon.png',
        tag: 'test-notification'
      });
    } catch (error) {
      console.error('Error mostrando notificación:', error);
    }
  }
}
```

### Permissions Service

```typescript
import { Component } from '@angular/core';
import { PermissionsService } from '@angular-helpers/browser-web-apis';

@Component({
  selector: 'app-permissions-demo',
  template: `
    <button (click)="checkPermissions()">Verificar Permisos</button>
    <button (click)="requestCameraPermission()">Solicitar Cámara</button>
  `
})
export class PermissionsDemoComponent {
  constructor(private permissionsService: PermissionsService) {}

  checkPermissions() {
    const cameraGranted = this.permissionsService.isGranted('camera');
    const geoGranted = this.permissionsService.isGranted('geolocation');
    
    console.log('Cámara:', cameraGranted);
    console.log('Geolocalización:', geoGranted);
  }

  async requestCameraPermission() {
    try {
      const status = await this.permissionsService.request({ name: 'camera' });
      console.log('Estado del permiso de cámara:', status.state);
    } catch (error) {
      console.error('Error solicitando permiso:', error);
    }
  }
}
```

## 🔧 Métodos Disponibles

### CameraService
- `startCamera(constraints?)` - Iniciar cámara
- `stopCamera()` - Detener cámara
- `switchCamera(deviceId)` - Cambiar cámara
- `takePicture()` - Tomar foto
- `getCameraInfo(deviceId)` - Info de cámara
- `hasMultipleCameras()` - Verificar múltiples cámaras

### GeolocationService
- `getCurrentPosition(options?)` - Obtener posición
- `watchPosition(callback, options?)` - Watch posición
- `clearWatch(watchId)` - Detener watch
- `calculateDistance(lat1, lon1, lat2, lon2)` - Calcular distancia
- `isWithinRadius(centerLat, centerLon, targetLat, targetLon, radius)` - Verificar radio

### NotificationService
- `showNotification(options)` - Mostrar notificación
- `requestPermission()` - Solicitar permiso
- `closeNotification(id)` - Cerrar notificación
- `showProgressNotification(title, current, total)` - Notificación con progreso

### ClipboardService
- `writeText(text)` - Escribir texto
- `readText()` - Leer texto
- `copyImage(blob)` - Copiar imagen
- `pasteImage()` - Pegar imagen

### MediaDevicesService
- `getUserMedia(constraints)` - Obtener media
- `getDisplayMedia(constraints?)` - Screen sharing
- `refreshDevices()` - Actualizar dispositivos
- `getDevicesByKind(kind)` - Dispositivos por tipo

### PermissionsService
- `query(descriptor)` - Consultar permiso
- `request(descriptor)` - Solicitar permiso
- `isGranted(permission)` - Verificar concedido
- `isDenied(permission)` - Verificar denegado
- `observePermission(permission)` - Observar cambios

## 🌐 Soporte de Navegadores

Los servicios verifican automáticamente el soporte del navegador:

- **Chrome**: Soporte completo
- **Firefox**: Soporte completo
- **Safari**: Soporte parcial
- **Edge**: Soporte completo
- **Móvil**: Soporte variable

## 📝 Notas

- Requiere contexto seguro (HTTPS)
- Algunas APIs necesitan interacción del usuario
- Los permisos varían según el navegador
- Considera siempre el manejo de errores

## 📄 Licencia

MIT
