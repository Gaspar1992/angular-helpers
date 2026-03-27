# @angular-helpers/browser-web-apis

Paquete de servicios Angular para acceder de forma estructurada y segura a Browser Web APIs.

[Read in English](./README.md)

## Caracteristicas

- Seguridad integrada con prevencion de ReDoS usando Web Workers
- Acceso unificado a APIs del navegador mediante servicios tipados
- Arquitectura tree-shakable
- Configuracion modular para habilitar solo lo necesario
- APIs reactivas con signals y observables
- Integracion segura con el ciclo de vida usando `destroyRef`

## Servicios disponibles

### APIs de medios y dispositivo

- `CameraService` - Acceso a camara con gestion de permisos
- `MediaDevicesService` - Enumeracion y gestion de dispositivos multimedia
- `GeolocationService` - Acceso a la API de geolocalizacion
- `NotificationService` - API de notificaciones del navegador

### Web APIs

- `WebWorkerService` - Gestion de Web Workers
- `WebSocketService` - Gestion de conexiones WebSocket
- `WebStorageService` - Helpers para LocalStorage y SessionStorage
- `WebShareService` - Soporte para Web Share API nativa
- `ClipboardService` - Acceso al portapapeles del sistema

### Seguridad

- `RegexSecurityService` - Prevencion de ReDoS con validacion en workers
- `PermissionsService` - Gestion centralizada de permisos del navegador

### Utilidades

- `CameraPermissionHelperService` - Utilidades para permisos de camara
- `BrowserApiBaseService` - Clase base compartida para servicios de Browser APIs
- `MediaDeviceBaseService` - Clase base compartida para servicios multimedia

## Instalacion

```bash
npm install @angular-helpers/browser-web-apis
```

## Configuracion rapida

```typescript
import { provideBrowserWebApis } from '@angular-helpers/browser-web-apis';

bootstrapApplication(AppComponent, {
  providers: [
    provideBrowserWebApis({
      enableCamera: true,
      enableGeolocation: true,
      enableRegexSecurity: true,
    }),
  ],
});
```

## Uso por servicio

### CameraService

```typescript
import { CameraService } from '@angular-helpers/browser-web-apis';

export class PhotoComponent {
  constructor(private cameraService: CameraService) {}

  async takePhoto() {
    try {
      const stream = await this.cameraService.startCamera({
        video: true,
        audio: false,
      });

      // Usa el stream para captura de foto o video
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  }

  async stopCamera() {
    await this.cameraService.stopCamera();
  }
}
```

### RegexSecurityService (prevencion de ReDoS)

```typescript
import { RegexSecurityService } from '@angular-helpers/browser-web-apis';

export class SecurityComponent {
  constructor(private regexSecurity: RegexSecurityService) {}

  async testPattern() {
    const pattern = '(.+)+'; // Patron potencialmente inseguro
    const text = 'some text to test';

    try {
      const result = await this.regexSecurity.testRegex(pattern, text, {
        timeout: 5000,
        safeMode: true,
      });

      console.log('Match:', result.match);
      console.log('Execution time:', result.executionTime);
    } catch (error) {
      console.error('Regex test failed:', error);
    }
  }
}
```

### GeolocationService

```typescript
import { GeolocationService } from '@angular-helpers/browser-web-apis';

export class LocationComponent {
  constructor(private geolocation: GeolocationService) {}

  async getCurrentLocation() {
    try {
      const position = await this.geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      });

      console.log('Position:', position.coords);
    } catch (error) {
      console.error('Error getting location:', error);
    }
  }
}
```

## Soporte de navegadores

Los servicios validan automaticamente el soporte del navegador y el manejo de rutas no soportadas:

- Chrome: soporte completo
- Firefox: soporte completo
- Safari: soporte parcial
- Edge: soporte completo
- Navegadores moviles: depende de plataforma y API

## Notas

- Varias APIs requieren contexto seguro (HTTPS)
- Algunas APIs requieren interaccion explicita del usuario
- El comportamiento de permisos varia segun el navegador
- Implementa siempre manejo de errores y fallback

## Licencia

MIT
