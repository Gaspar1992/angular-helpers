# @angular-helpers/browser-web-apis

Sistema de servicios Angular para acceso formalizado a Browser Web APIs con seguridad integrada.

## 🚀 Características

- **🔐 Seguridad Integrada**: Prevención de ReDoS con Web Workers
- **📱 Browser APIs**: Acceso unificado a APIs del navegador
- **⚡ Tree Shakable**: Solo incluye lo que usas
- **🛡️ Type Safe**: TypeScript completo
- **🔧 Modular**: Habilita solo lo que necesitas
- **📊 Reactive**: Signals y Observables
- **🔄 Lifecycle**: Gestión automática con destroyRef

## 📦 Servicios Disponibles

### � Media & Device APIs
- **CameraService** - Acceso a cámara con gestión de permisos
- **MediaDevicesService** - Enumeración y gestión de dispositivos multimedia
- **GeolocationService** - API de geolocalización
- **NotificationService** - Sistema de notificaciones

### 🌐 Web APIs
- **WebWorkerService** - Gestión de Web Workers
- **WebSocketService** - Conexiones WebSocket
- **WebStorageService** - LocalStorage y SessionStorage
- **WebShareService** - API de compartir nativa
- **ClipboardService** - Portapapeles del sistema

### 🔐 Seguridad
- **RegexSecurityService** - Prevención de ReDoS con Web Workers
- **PermissionsService** - Gestión centralizada de permisos

### 🔧 Utilidades
- **CameraPermissionHelperService** - Helper para permisos de cámara
- **BrowserApiBaseService** - Clase base para servicios de APIs
- **MediaDeviceBaseService** - Clase base para dispositivos multimedia

## �️ Instalación

```bash
npm install @angular-helpers/browser-web-apis
```

## � Configuración Rápida

```typescript
import { provideBrowserWebApis } from '@angular-helpers/browser-web-apis';

bootstrapApplication(AppComponent, {
  providers: [
    provideBrowserWebApis({
      enableCamera: true,
      enableGeolocation: true,
      enableRegexSecurity: true
    })
  ]
});
```

## 📖 Uso por Servicio

### 📷 CameraService

```typescript
import { CameraService } from '@angular-helpers/browser-web-apis';

export class PhotoComponent {
  constructor(private cameraService: CameraService) {}

  async takePhoto() {
    try {
      const stream = await this.cameraService.startCamera({
        video: true,
        audio: false
      });
      
      // Usar stream para video/foto
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  }

  async stopCamera() {
    await this.cameraService.stopCamera();
  }
}
```

### 🔐 RegexSecurityService (Prevención de ReDoS)

```typescript
import { RegexSecurityService } from '@angular-helpers/browser-web-apis';

export class SecurityComponent {
  constructor(private regexSecurity: RegexSecurityService) {}

  async testPattern() {
    const pattern = '(.+)+'; // Patrón potencialmente peligroso
    const text = 'some text to test';
    
    try {
      const result = await this.regexSecurity.testRegex(pattern, text, {
        timeout: 5000,
        safeMode: true
      });
      
      console.log('Match:', result.match);
      console.log('Execution time:', result.executionTime);
    } catch (error) {
      console.error('Regex test failed:', error);
    }
  }

  async analyzeSecurity() {
    const analysis = await this.regexSecurity.analyzePatternSecurity('(.+)+');
    
    console.log('Risk level:', analysis.risk);
    console.log('Warnings:', analysis.warnings);
    console.log('Recommendations:', analysis.recommendations);
  }
}
```

### 🔨 Builder Pattern para Regex Seguro

```typescript
import { RegexSecurityService, RegexSecurityBuilder } from '@angular-helpers/browser-web-apis';

export class RegexBuilderComponent {
  constructor(private regexSecurity: RegexSecurityService) {}

  async buildSafeRegex() {
    const builder = RegexSecurityService.builder()
      .startOfLine()
      .characterSet('a-zA-Z0-9')
      .quantifier('+')
      .characterSet('@')
      .characterSet('a-zA-Z0-9.-')
      .quantifier('+')
      .characterSet('.')
      .characterSet('a-z')
      .quantifier('{2,4}')
      .endOfLine()
      .timeout(3000)
      .safeMode();

    const emailPattern = builder.build().pattern;
    const result = await builder.execute('test@example.com', this.regexSecurity);
    
    console.log('Valid email:', result.match);
  }
}
```

### 🌍 GeolocationService

```typescript
import { GeolocationService } from '@angular-helpers/browser-web-apis';

export class LocationComponent {
  constructor(private geolocation: GeolocationService) {}

  async getCurrentLocation() {
    try {
      const position = await this.geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      });
      
      console.log('Position:', position.coords);
    } catch (error) {
      console.error('Error getting location:', error);
    }
  }

  watchPosition() {
    const watchId = this.geolocation.watchPosition(position => {
      console.log('New position:', position.coords);
    }, error => {
      console.error('Watch error:', error);
    });
  }
}
```

### 🔔 NotificationService

```typescript
import { NotificationService } from '@angular-helpers/browser-web-apis';

export class NotificationComponent {
  constructor(private notificationService: NotificationService) {}

  async showNotification() {
    try {
      await this.notificationService.requestPermission();
      
      this.notificationService.showNotification({
        title: 'New Message',
        body: 'You have a new message',
        icon: '/assets/icon.png',
        tag: 'message'
      });
    } catch (error) {
      console.error('Notification error:', error);
    }
  }
}
```

### 🌐 WebSocketService

```typescript
import { WebSocketService } from '@angular-helpers/browser-web-apis';

export class ChatComponent {
  constructor(private webSocketService: WebSocketService) {}

  connect() {
    this.webSocketService.connect('ws://localhost:8080')
      .subscribe({
        next: (message) => console.log('Received:', message),
        error: (error) => console.error('WebSocket error:', error),
        complete: () => console.log('WebSocket disconnected')
      });
  }

  sendMessage(message: string) {
    this.webSocketService.send(message);
  }
}
```

### 💾 WebStorageService

```typescript
import { WebStorageService } from '@angular-helpers/browser-web-apis';

export class SettingsComponent {
  constructor(private storageService: WebStorageService) {}

  saveSettings() {
    this.storageService.setItem('userSettings', {
      theme: 'dark',
      language: 'es',
      notifications: true
    });
  }
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
