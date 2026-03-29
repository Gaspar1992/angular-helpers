# @angular-helpers/browser-web-apis

Paquete de servicios Angular para acceder de forma estructurada y segura a Browser Web APIs.

🌐 **Documentación y Demo**: https://gaspar1992.github.io/angular-helpers/

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
- `MediaRecorderService` - Grabar audio/video desde MediaStream

### APIs de observadores

- `IntersectionObserverService` - Detectar cuando elementos entran/salen del viewport
- `ResizeObserverService` - Observar cambios de tamano de elementos

### APIs de sistema

- `BatteryService` - Monitorear estado de bateria y carga
- `PageVisibilityService` - Rastrear cambios de visibilidad del documento
- `ScreenWakeLockService` - Evitar que la pantalla se atenue o bloquee
- `ScreenOrientationService` - Leer y bloquear orientacion de pantalla
- `FullscreenService` - Alternar modo pantalla completa para elementos
- `VibrationService` - Activar patrones de retroalimentacion tactil
- `SpeechSynthesisService` - Texto a voz con seleccion de voz

### APIs de red

- `WebSocketService` - Gestion de conexiones WebSocket
- `ServerSentEventsService` - Cliente de Server-Sent Events
- `BroadcastChannelService` - Comunicacion entre pestanas
- `NetworkInformationService` - Informacion de conexion y estado online

### APIs de almacenamiento y E/S

- `WebStorageService` - Helpers para LocalStorage y SessionStorage
- `WebShareService` - Soporte para Web Share API nativa
- `ClipboardService` - Acceso al portapapeles del sistema
- `FileSystemAccessService` - Abrir/guardar archivos via selector nativo

### Web APIs

- `WebWorkerService` - Gestion de Web Workers

### Seguridad y capacidades

- `PermissionsService` - Gestion centralizada de permisos del navegador
- `BrowserCapabilityService` - Deteccion de soporte de APIs del navegador

### Utilidades

- `BrowserApiBaseService` - Clase base compartida para servicios de Browser APIs

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
      enableNotifications: true,
    }),
  ],
});
```

## Uso por servicio

### CameraService

```typescript
import { CameraService } from '@angular-helpers/browser-web-apis';

export class PhotoComponent {
  private cameraService = inject(CameraService);

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

### BrowserCapabilityService

```typescript
import { BrowserCapabilityService } from '@angular-helpers/browser-web-apis';

export class MyComponent {
  private capability = inject(BrowserCapabilityService);

  ngOnInit() {
    if (this.capability.isSupported('geolocation')) {
      console.log('La geolocalizacion esta disponible');
    }
  }
}
```

> Para prevención de ReDoS, usa el paquete `@angular-helpers/security`.

### GeolocationService

```typescript
import { GeolocationService } from '@angular-helpers/browser-web-apis';

export class LocationComponent {
  private geolocation = inject(GeolocationService);

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

### IntersectionObserverService

```typescript
import { IntersectionObserverService } from '@angular-helpers/browser-web-apis';

export class LazyImageComponent {
  private intersectionService = inject(IntersectionObserverService);
  private elementRef = inject(ElementRef);

  isVisible = signal(false);

  ngAfterViewInit() {
    this.intersectionService
      .observeVisibility(this.elementRef.nativeElement, { threshold: 0.5 })
      .subscribe((visible) => this.isVisible.set(visible));
  }
}
```

### ResizeObserverService

```typescript
import { ResizeObserverService } from '@angular-helpers/browser-web-apis';

export class ResponsiveComponent {
  private resizeService = inject(ResizeObserverService);
  private elementRef = inject(ElementRef);

  elementSize = signal<ElementSize | null>(null);

  ngAfterViewInit() {
    this.resizeService
      .observeSize(this.elementRef.nativeElement)
      .subscribe((size) => this.elementSize.set(size));
  }
}
```

### PageVisibilityService

```typescript
import { PageVisibilityService } from '@angular-helpers/browser-web-apis';

export class AnalyticsComponent {
  private visibilityService = inject(PageVisibilityService);

  ngOnInit() {
    this.visibilityService.watch().subscribe((state) => {
      console.log('La pagina ahora esta:', state);
    });
  }
}
```

### FullscreenService

```typescript
import { FullscreenService } from '@angular-helpers/browser-web-apis';

export class VideoPlayerComponent {
  private fullscreenService = inject(FullscreenService);

  async toggleFullscreen() {
    await this.fullscreenService.toggle();
  }
}
```

### ScreenWakeLockService

```typescript
import { ScreenWakeLockService } from '@angular-helpers/browser-web-apis';

export class PresentationComponent {
  private wakeLockService = inject(ScreenWakeLockService);

  async keepScreenOn() {
    await this.wakeLockService.request();
  }

  async releaseScreen() {
    await this.wakeLockService.release();
  }
}
```

### BroadcastChannelService

```typescript
import { BroadcastChannelService } from '@angular-helpers/browser-web-apis';

export class SyncComponent {
  private broadcastService = inject(BroadcastChannelService);

  ngOnInit() {
    // Escuchar mensajes de otras pestanas
    this.broadcastService.open<string>('app-sync').subscribe((msg) => {
      console.log('Recibido:', msg);
    });
  }

  sendMessage(data: string) {
    this.broadcastService.post('app-sync', data);
  }
}
```

### ServerSentEventsService

```typescript
import { ServerSentEventsService } from '@angular-helpers/browser-web-apis';

export class LiveFeedComponent {
  private sseService = inject(ServerSentEventsService);

  connectToEvents() {
    this.sseService.connect('https://api.example.com/events').subscribe({
      next: (message) => console.log('Evento:', message),
      error: (err) => console.error('Error SSE:', err),
    });
  }
}
```

### VibrationService

```typescript
import { VibrationService } from '@angular-helpers/browser-web-apis';

export class FeedbackComponent {
  private vibrationService = inject(VibrationService);

  onSuccess() {
    this.vibrationService.success();
  }

  onError() {
    this.vibrationService.error();
  }
}
```

### SpeechSynthesisService

```typescript
import { SpeechSynthesisService } from '@angular-helpers/browser-web-apis';

export class VoiceComponent {
  private speechService = inject(SpeechSynthesisService);

  speakText(text: string) {
    this.speechService.speak(text).subscribe((state) => {
      console.log('Estado de voz:', state);
    });
  }
}
```

### ScreenOrientationService

```typescript
import { ScreenOrientationService } from '@angular-helpers/browser-web-apis';

export class MobileComponent {
  private orientationService = inject(ScreenOrientationService);

  ngOnInit() {
    // Observar cambios de orientacion
    this.orientationService.watch().subscribe((orientation) => {
      console.log('Orientacion:', orientation.type, 'Angulo:', orientation.angle);
    });
  }

  async lockPortrait() {
    try {
      await this.orientationService.lock('portrait');
    } catch (error) {
      console.error('No se pudo bloquear la orientacion:', error);
    }
  }

  unlockOrientation() {
    this.orientationService.unlock();
  }
}
```

### BatteryService

```typescript
import { BatteryService } from '@angular-helpers/browser-web-apis';

export class PowerComponent {
  private batteryService = inject(BatteryService);

  async ngOnInit() {
    try {
      // Inicializar y obtener informacion inicial de la bateria
      const batteryInfo = await this.batteryService.initialize();
      console.log('Nivel de bateria:', batteryInfo.level);
      console.log('Esta cargando:', batteryInfo.charging);

      // Observar cambios de bateria
      this.batteryService.watchBatteryInfo().subscribe((info) => {
        console.log('Bateria actualizada:', info);
      });
    } catch (error) {
      console.error('Battery API no soportada:', error);
    }
  }
}
```

### ClipboardService

```typescript
import { ClipboardService } from '@angular-helpers/browser-web-apis';

export class CopyComponent {
  private clipboardService = inject(ClipboardService);

  async copyToClipboard(text: string) {
    try {
      await this.clipboardService.writeText(text);
      console.log('Copiado exitosamente');
    } catch (error) {
      console.error('Error al copiar:', error);
    }
  }

  async pasteFromClipboard(): Promise<string> {
    try {
      const text = await this.clipboardService.readText();
      return text;
    } catch (error) {
      console.error('Error al leer el portapapeles:', error);
      return '';
    }
  }
}
```

### FileSystemAccessService

```typescript
import { FileSystemAccessService } from '@angular-helpers/browser-web-apis';

export class FileManagerComponent {
  private fileService = inject(FileSystemAccessService);

  async openFiles() {
    try {
      const files = await this.fileService.openFile({
        multiple: true,
        types: [
          {
            description: 'Archivos de texto',
            accept: { 'text/plain': ['.txt'] },
          },
        ],
      });
      console.log('Archivos seleccionados:', files);
    } catch (error) {
      console.error('Error al abrir archivos:', error);
    }
  }

  async saveContent(content: string) {
    try {
      await this.fileService.saveFile(content, {
        suggestedName: 'documento.txt',
      });
    } catch (error) {
      console.error('Error al guardar archivo:', error);
    }
  }
}
```

### MediaRecorderService

```typescript
import { MediaRecorderService } from '@angular-helpers/browser-web-apis';

export class RecorderComponent {
  private recorderService = inject(MediaRecorderService);
  private stream: MediaStream | null = null;

  async startRecording() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      await this.recorderService.start(this.stream, { mimeType: 'video/webm' });
    } catch (error) {
      console.error('Error al iniciar la grabacion:', error);
    }
  }

  stopRecording() {
    const result = this.recorderService.stop();
    if (result) {
      console.log('Grabacion guardada, URL del blob:', result.url);
    }
  }
}
```

### WebSocketService

```typescript
import { WebSocketService } from '@angular-helpers/browser-web-apis';

export class LiveComponent {
  private wsService = inject(WebSocketService);

  connect() {
    this.wsService
      .connect({
        url: 'wss://example.com/socket',
        reconnectInterval: 3000,
        maxReconnectAttempts: 5,
      })
      .subscribe((status) => {
        console.log('Estado de conexion:', status);
      });

    this.wsService.getMessages().subscribe((message) => {
      console.log('Recibido:', message);
    });
  }

  sendMessage(data: unknown) {
    this.wsService.send({ type: 'message', data });
  }
}
```

### WebStorageService

```typescript
import { WebStorageService } from '@angular-helpers/browser-web-apis';

export class SettingsComponent {
  private storageService = inject(WebStorageService);

  saveSetting(key: string, value: unknown) {
    this.storageService.setLocalStorage(key, value);
  }

  getSetting<T>(key: string): T | null {
    return this.storageService.getLocalStorage<T>(key);
  }

  watchSetting<T>(key: string) {
    return this.storageService.watchLocalStorage<T>(key).subscribe((value) => {
      console.log('Configuracion cambiada:', value);
    });
  }
}
```

### WebWorkerService

```typescript
import { WebWorkerService } from '@angular-helpers/browser-web-apis';

export class WorkerComponent {
  private workerService = inject(WebWorkerService);

  async createWorker() {
    this.workerService
      .createWorker('calc-worker', '/assets/workers/calc.worker.js')
      .subscribe((status) => {
        console.log('Estado del worker:', status);
      });

    this.workerService.getMessages('calc-worker').subscribe((message) => {
      console.log('Respuesta del worker:', message);
    });
  }

  sendTask(data: unknown) {
    this.workerService.postMessage('calc-worker', {
      id: 'task-1',
      type: 'CALCULATE',
      data,
    });
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
