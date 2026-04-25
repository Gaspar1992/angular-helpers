[Read in English](./README.md)

# @angular-helpers/worker-http

Mové tus requests HTTP fuera del hilo principal. Un toolkit composable para Angular que ejecuta `fetch()` dentro de Web Workers, protegiendo tu UI de la latencia de red mientras agregás primitivas de seguridad (firma HMAC, integridad de contenido, rate limiting) que viven completamente en el scope aislado del worker.

---

## ¿Por qué?

Cada request de `HttpClient` consume presupuesto del hilo compartido. Cuando una API lenta se traba, tus animaciones se cortan y las interacciones del usuario se encolan. Los Web Workers resuelven esto a nivel arquitectural: corren en un hilo OS separado, así que una llamada de red de 2 segundos no le cuesta nada al hilo principal.

Además, los workers proveen un límite de aislamiento natural para lógica sensible de seguridad: claves HMAC, firma de requests y verificación de contenido nunca tocan la memoria del hilo principal.

---

## Mapa de paquetes

| Entry point                                     | Descripción                                                         | Estado        |
| ----------------------------------------------- | ------------------------------------------------------------------- | ------------- |
| `@angular-helpers/worker-http/transport`        | Bridge RPC tipado, pool round-robin, cancelación                    | ✅ Disponible |
| `@angular-helpers/worker-http/serializer`       | Serialización pluggable (structured clone, seroval, auto-detect)    | ✅ Disponible |
| `@angular-helpers/worker-http/interceptors`     | Pipeline de interceptors de funciones puras para workers            | ✅ Disponible |
| `@angular-helpers/worker-http/crypto`           | Primitivas WebCrypto (HMAC, AES-GCM, hashing SHA)                   | ✅ Disponible |
| `@angular-helpers/worker-http/backend`          | Reemplazo de `HttpBackend` de Angular — `provideWorkerHttpClient()` | ✅ Disponible |
| `@angular-helpers/worker-http/esbuild-plugin`   | Plugin esbuild para auto-bundle de interceptors en workers          | ✅ Disponible |
| `@angular-helpers/worker-http/streams-polyfill` | Ponyfill de streams para Safari (transferible streams)              | ✅ Disponible |

---

## Arquitectura de un vistazo

```
Hilo principal                       Web Worker
────────────────────────────         ──────────────────────────────────
Angular HttpClient                   createWorkerPipeline([
  └─ WorkerHttpBackend                 loggingInterceptor(),
       └─ WorkerTransport              retryInterceptor({ maxRetries: 3 }),
            └─ postMessage   ───────►  hmacSigningInterceptor({ keyMaterial }),
                             ◄───────  cacheInterceptor({ ttl: 60000 }),
                             transfer ])
                             (zero-copy)
                                     fetch() ──► API Server
```

---

## Instalación

### Setup rápido con ng-add

La forma más fácil de empezar es usando el schematic de Angular CLI:

```bash
ng add @angular-helpers/worker-http
```

Esto va a:

1. Instalar el paquete
2. Crear un archivo worker en `src/app/workers/http-api.worker.ts`
3. Actualizar `tsconfig.json` con la lib webworker
4. Agregar `provideWorkerHttpClient()` a tu `app.config.ts`

**Opciones:**

```bash
# Path custom del worker
ng add @angular-helpers/worker-http --workerPath=src/workers/api.worker.ts

# Configurar el plugin de esbuild (para setups de build custom)
ng add @angular-helpers/worker-http --installEsbuildPlugin=true
```

### Instalación manual

```bash
npm install @angular-helpers/worker-http
```

Después seguí la configuración en la sección `/backend` más abajo.

---

## Entry points

### `/transport` — Bridge RPC tipado

Un bridge type-safe y framework-agnostic entre el hilo principal y un Web Worker. Envuelve `postMessage` con correlación request/response, API Observable y cancelación automática al desubscribirse.

```typescript
import { createWorkerTransport } from '@angular-helpers/worker-http/transport';

const transport = createWorkerTransport({
  workerUrl: new URL('./workers/api.worker', import.meta.url),
  maxInstances: 2,
});

// Devuelve Observable — desubscribirse envía un mensaje cancel al worker
const response$ = transport.execute(request);

// Limpiar
transport.terminate();
```

**Características:**

- Pool round-robin (`maxInstances`) para manejar requests en paralelo
- Instanciación lazy del worker — no se crea ningún worker hasta el primer request
- **Cancelación que realmente aborta `fetch()`** — al desubscribirse se postea
  un mensaje `cancel`; el message loop del worker threadea un `AbortSignal`
  hasta `fetch()` para que la request HTTP en vuelo se corte de verdad
- **Timeout por request** (default `30_000` ms) via `requestTimeout`; al
  vencer el timer, el Observable emite un error `WorkerHttpTimeoutError` y
  se postea un `cancel` al worker. Pasá `0` para desactivarlo.
- **Detección de transferables opt-in** via `transferDetection: 'auto'`:
  detecta `ArrayBuffer` / `MessagePort` / `ImageBitmap` / `OffscreenCanvas` /
  streams y los pasa como transfer list de `postMessage`, habilitando
  transferencia zero-copy de buffers grandes. El default es `'none'` para
  preservar el acceso al dato original después del post.

```typescript
import {
  createWorkerTransport,
  WorkerHttpTimeoutError,
} from '@angular-helpers/worker-http/transport';

const transport = createWorkerTransport({
  workerUrl: new URL('./workers/api.worker', import.meta.url),
  maxInstances: 2,
  requestTimeout: 10_000, // override del default 30 s
  transferDetection: 'auto', // zero-copy de ArrayBuffer en postMessage
});

transport.execute(request).subscribe({
  error: (err) => {
    if (err instanceof WorkerHttpTimeoutError) {
      // manejo dedicado de timeout
    }
  },
});
```

---

### `/interceptors` — Pipeline del lado del worker

Interceptors de funciones puras que corren dentro del worker. Sin Angular DI, sin acceso al DOM — solo `(req, next) => Promise<response>`.

#### Setup en tu archivo worker

```typescript
// workers/secure.worker.ts
import { createWorkerPipeline } from '@angular-helpers/worker-http/interceptors';
import {
  hmacSigningInterceptor,
  retryInterceptor,
  loggingInterceptor,
} from '@angular-helpers/worker-http/interceptors';

createWorkerPipeline([
  loggingInterceptor(),
  retryInterceptor({ maxRetries: 3, initialDelay: 500 }),
  hmacSigningInterceptor({
    keyMaterial: new TextEncoder().encode(self.HMAC_SECRET),
    headerName: 'X-HMAC-Signature',
  }),
]);
```

#### Interceptors disponibles

##### `retryInterceptor(config?)`

Reintenta requests fallidos con backoff exponencial. Respeta el header `Retry-After`.

```typescript
retryInterceptor({
  maxRetries: 3, // default: 3 (0 = deshabilitado, devuelve la respuesta tal cual)
  initialDelay: 1000, // ms, default: 1000
  backoffMultiplier: 2, // default: 2 → demoras: 1s, 2s, 4s
  retryStatusCodes: [408, 429, 500, 502, 503, 504], // lista por default
  retryOnNetworkError: true, // reintentar si fetch() tira (default: true)
});
```

##### `cacheInterceptor(config?)`

Cache de respuestas en memoria del worker. El estado es por instancia de factory y se resetea cuando el worker se termina.

```typescript
cacheInterceptor({
  ttl: 60000, // ms, default: 60000 (1 min). 0 = nunca cachear
  maxEntries: 100, // default: 100. Evicción: FIFO (orden de inserción)
  methods: ['GET'], // default: ['GET']
});
```

##### `hmacSigningInterceptor(config)`

Firma los requests salientes con HMAC-SHA256/384/512 via la API WebCrypto nativa. La `CryptoKey` se importa una sola vez por instancia de factory y se reutiliza en todos los requests.

```typescript
hmacSigningInterceptor({
  keyMaterial: rawKeyBytes, // ArrayBuffer | Uint8Array
  algorithm: 'SHA-256', // default: 'SHA-256'
  headerName: 'X-HMAC-Signature', // default: 'X-HMAC-Signature'
  payloadBuilder: (
    req, // opcional: qué firmar
  ) => `${req.method}:${req.url}:${JSON.stringify(req.body)}`,
});
```

##### `loggingInterceptor(config?)`

Loggea request/response a `console.log` (o un logger custom). Las excepciones del logger se swallean — una falla del logger nunca interrumpe el pipeline.

```typescript
loggingInterceptor({
  logger: (msg, data) => myMonitoring.log(msg, data), // default: console.log
  includeHeaders: false, // default: false
});
// Salida: [worker] → GET https://api.example.com (0ms)
//         [worker] ← 200 https://api.example.com (47ms)
```

##### `rateLimitInterceptor(config?)`

Rate limiter de sliding window del lado del cliente. Tira `{ status: 429 }` cuando se supera el límite.

```typescript
rateLimitInterceptor({
  maxRequests: 100, // default: 100
  windowMs: 60000, // default: 60000 (1 min)
});
```

##### `contentIntegrityInterceptor(config?)`

Verifica el hash SHA-256 del cuerpo de la respuesta contra un header provisto por el servidor. Útil cuando el servidor firma las respuestas.

```typescript
contentIntegrityInterceptor({
  algorithm: 'SHA-256', // default: 'SHA-256'
  headerName: 'X-Content-Hash', // default: 'X-Content-Hash'
  requireHash: false, // default: false. true = tira si falta el header
});
```

##### `composeInterceptors(...fns)`

Compone múltiples interceptors en un solo `WorkerInterceptorFn`. Los interceptors corren de izquierda a derecha.

```typescript
import { composeInterceptors } from '@angular-helpers/worker-http/interceptors';

const capaSeguridad = composeInterceptors(
  rateLimitInterceptor({ maxRequests: 50 }),
  hmacSigningInterceptor({ keyMaterial }),
  contentIntegrityInterceptor({ requireHash: true }),
);

createWorkerPipeline([loggingInterceptor(), capaSeguridad]);
```

#### Interceptors custom

Implementá `WorkerInterceptorFn` — una función pura sin dependencias externas:

```typescript
import type { WorkerInterceptorFn } from '@angular-helpers/worker-http/interceptors';

export const authTokenInterceptor: WorkerInterceptorFn = (req, next) => {
  return next({
    ...req,
    headers: { ...req.headers, Authorization: [`Bearer ${TOKEN}`] },
  });
};
```

---

### `/serializer` — Serialización pluggable

Maneja el límite de serialización de `postMessage`. El structured clone tiene overhead cero pero pierde fidelidad de `Date`, `Map`, `Set`. `seroval` preserva fidelidad de tipos completa. El auto-serializer elige la mejor estrategia por payload.

#### `structuredCloneSerializer` (default)

Overhead cero. Usa el algoritmo de structured clone nativo del browser. Mejor para objetos simples y primitivos.

```typescript
import { structuredCloneSerializer } from '@angular-helpers/worker-http/serializer';
// No necesita setup — es el default cuando no se configura ningún serializer.
```

#### `createSerovalSerializer()` — Fidelidad completa de tipos

Requiere `seroval` como peer dependency opcional (`npm install seroval`).

Soporta: `Date`, `Map`, `Set`, `BigInt`, `RegExp`, referencias circulares y más.

```typescript
import { createSerovalSerializer } from '@angular-helpers/worker-http/serializer';

// La factory es async — pre-carga el módulo seroval
const serializer = await createSerovalSerializer();

const payload = serializer.serialize({ date: new Date(), tags: new Set(['a', 'b']) });
const original = serializer.deserialize(payload);
// original.date instanceof Date → true
// original.tags instanceof Set → true
```

#### `createAutoSerializer()` — Auto-detección inteligente

Elige automáticamente la mejor estrategia por payload. La factory es async (pre-carga `seroval` durante la inicialización), pero el serializer devuelto es completamente síncrono.

**Lógica de detección (profundidad-1):**

- Contiene `Date`, `Map`, `Set` o `RegExp` en el nivel superior o como valores directos de array/objeto → `seroval`
- Si no → structured clone (overhead cero)

Los payloads más grandes que `transferThreshold` (default: 100 KiB) se codifican a `ArrayBuffer` y se transfieren zero-copy.

```typescript
import { createAutoSerializer } from '@angular-helpers/worker-http/serializer';

const auto = await createAutoSerializer({
  transferThreshold: 102400, // bytes, default: 100 KiB
});

// Objeto simple → structured-clone (sin overhead)
auto.serialize({ id: 1, name: 'Alice' }); // format: 'structured-clone'

// Objeto con Date → seroval (fidelidad de tipos)
auto.serialize({ createdAt: new Date() }); // format: 'seroval'

// Payload grande → transferencia ArrayBuffer (zero-copy)
auto.serialize(datasetGrande); // transferables: [ArrayBuffer]
```

> **Limitación de profundidad-1**: `[{ createdAt: new Date() }]` — el `Date` está dentro de un objeto anidado; no se detecta en profundidad-1. Para tipos complejos profundamente anidados, usá `createSerovalSerializer()` directamente.

---

### `/crypto` — Primitivas WebCrypto

Utilidades WebCrypto standalone. Útiles tanto en workers como en el hilo principal, pero los workers proveen aislamiento de memoria para el material de claves.

#### `createHmacSigner(config)`

```typescript
import { createHmacSigner } from '@angular-helpers/worker-http/crypto';

const signer = await createHmacSigner({
  keyMaterial: rawKeyBytes,
  algorithm: 'SHA-256', // default
});

const firma = await signer.sign('GET:/api/users:');
const valido = await signer.verify('GET:/api/users:', firma);
```

#### `createAesEncryptor(config)`

```typescript
import { createAesEncryptor } from '@angular-helpers/worker-http/crypto';

const encryptor = await createAesEncryptor({ keyLength: 256 });

const { ciphertext, iv } = await encryptor.encrypt('datos sensibles');
const plaintext = await encryptor.decrypt(ciphertext, iv);
```

#### `createContentHasher()`

```typescript
import { createContentHasher } from '@angular-helpers/worker-http/crypto';

const hasher = createContentHasher();
const hash = await hasher.hash('SHA-256', data); // → string hex
```

---

### `/backend` — Reemplazo de `HttpBackend` de Angular

Reemplazo drop-in del `HttpBackend` de Angular que enruta requests de `HttpClient` a Web Workers de forma transparente. Usas `WorkerHttpClient` exactamente igual que `HttpClient` — el ruteo es invisible para el código de aplicación.

```typescript
// app.config.ts
import {
  provideWorkerHttpClient,
  withWorkerConfigs,
  withWorkerRoutes,
  withWorkerFallback,
  withWorkerSerialization,
} from '@angular-helpers/worker-http/backend';
import { createSerovalSerializer } from '@angular-helpers/worker-http/serializer';

export const appConfig: ApplicationConfig = {
  providers: [
    provideWorkerHttpClient(
      withWorkerConfigs([
        {
          id: 'api',
          workerUrl: new URL('./workers/api.worker', import.meta.url),
          maxInstances: 2, // pool round-robin
        },
        {
          id: 'secure',
          workerUrl: new URL('./workers/secure.worker', import.meta.url),
        },
      ]),
      withWorkerRoutes([
        { pattern: /\/api\/secure\//, worker: 'secure', priority: 10 },
        { pattern: /\/api\//, worker: 'api', priority: 5 },
      ]),
      withWorkerFallback('main-thread'), // SSR-safe
      withWorkerSerialization(createSerovalSerializer()), // opcional: cuerpos complejos
    ),
  ],
};

// data.service.ts — WorkerHttpClient es un drop-in para HttpClient
export class DataService {
  private http = inject(WorkerHttpClient);

  getUsers() {
    return this.http.get<User[]>('/api/users'); // ruteado automáticamente al worker 'api'
  }

  getSecureData() {
    // override por request vía opción { worker } o el context token WORKER_TARGET
    return this.http.get('/api/secure/payments', { worker: 'secure' });
  }
}

// workers/api.worker.ts — corre en un hilo OS separado
import {
  createWorkerPipeline,
  loggingInterceptor,
  retryInterceptor,
  cacheInterceptor,
} from '@angular-helpers/worker-http/interceptors';

createWorkerPipeline([
  loggingInterceptor(),
  retryInterceptor({ maxRetries: 3 }),
  cacheInterceptor({ ttl: 60000 }),
]);
```

**Features:**

- `provideWorkerHttpClient(...features)` — reemplaza `provideHttpClient()`; no uses ambos
- `withWorkerConfigs(configs)` — registra workers nombrados con pool opcional
- `withWorkerRoutes(routes)` — ruteo por patrón URL con ordering por prioridad
- `withWorkerFallback(strategy)` — `'main-thread'` (SSR-safe) o `'error'`
- `withWorkerSerialization(serializer)` — usa `createSerovalSerializer()` para cuerpos complejos (`Date`, `Map`, `Set`)
- `WORKER_TARGET` — `HttpContextToken<string | null>` para ruteo por request vía `HttpContext`
- `WorkerHttpClient` — wrapper de `HttpClient` con campo opcional `{ worker: string }` de ruteo
- `WorkerHttpBackend` — la implementación de `HttpBackend` (inyectable para uso avanzado)
- `matchWorkerRoute(url, routes)` — utilidad pura para testear reglas de ruteo

---

### `/esbuild-plugin` — Auto-bundle de interceptors

Un plugin de esbuild que descubre y bundlea automáticamente archivos de interceptors en tus builds de workers. Cuando usás Angular con una configuración custom de webpack/esbuild, esto asegura que tus interceptors se incluyan en el bundle del worker sin imports manuales.

```typescript
// esbuild.config.ts
import { workerHttpPlugin } from '@angular-helpers/worker-http/esbuild-plugin';

export default {
  plugins: [
    workerHttpPlugin({
      // Interceptors explícitos (relativo a la raíz del proyecto)
      interceptors: ['./src/interceptors/auth.ts', './src/interceptors/logging.ts'],

      // O auto-descubrir todos los archivos que matcheen el patrón interceptor
      autoDiscover: true,
    }),
  ],
};
```

**Opciones:**

| Opción         | Tipo       | Default | Descripción                                                |
| -------------- | ---------- | ------- | ---------------------------------------------------------- |
| `interceptors` | `string[]` | `[]`    | Lista explícita de paths de interceptors para bundle       |
| `autoDiscover` | `boolean`  | `false` | Scannear `src/` para archivos que matcheen `*interceptor*` |

Los interceptors descubiertos se mergean con los explícitos. Los archivos de test (`.spec.ts`, `.test.ts`) se excluyen automáticamente.

---

### `/streams-polyfill` — Streams transferibles en Safari

Safari 16-17 no tienen soporte nativo para `ReadableStream`/`TransformStream` transferibles. Este ponyfill habilita el transfer de streams en workers para esos browsers, cargado lazy solo cuando se necesita.

```typescript
// Habilitar en tu app config (hilo principal)
import { withWorkerStreamsPolyfill } from '@angular-helpers/worker-http/backend';

provideWorkerHttpClient(
  withWorkerConfigs([...]),
  withWorkerStreamsPolyfill(), // Habilitar compatibilidad Safari 16-17
);
```

**Cuándo usar:**

- Tu app usa `responseType: 'stream'` y targetea Safari 16-17
- Ves `DataCloneError` cuando transferís streams hacia/desde workers

**Impacto en bundle:** Cero para browsers modernos. El polyfill se carga lazy solo en versiones afectadas de Safari cuando los streams se usan realmente.

---

## Principios de diseño

- **Costo cero en el hilo principal** — `fetch()` corre completamente en el worker; el hilo principal solo maneja el handoff de `postMessage`
- **Caja negra** — los desarrolladores usan `HttpClient` como siempre; los workers son un detalle de implementación
- **Interceptors de funciones puras** — sin Angular DI, sin DOM, sin closures sobre estado mutable; completamente testeables sin browser
- **Composable** — usá solo los sub-paquetes que necesitás; cada uno es útil de forma independiente
- **SSR-safe** — `typeof Worker === 'undefined'` cae automáticamente a un `FetchBackend` estándar

---

## Guía de decisión de estrategia de serialización

| Tipo de payload                        | Serializer recomendado                | Razón                                |
| -------------------------------------- | ------------------------------------- | ------------------------------------ |
| Objetos simples, arrays de primitivos  | `structuredCloneSerializer` (default) | Overhead cero                        |
| Objetos con `Date`, `Map`, `Set`       | `createSerovalSerializer()`           | Fidelidad completa de tipos          |
| Forma de payload desconocida           | `createAutoSerializer()`              | Auto-detect profundidad-1            |
| Arrays grandes (> 100 KiB)             | `createAutoSerializer()`              | Transferencia ArrayBuffer automática |
| Tipos complejos profundamente anidados | `createSerovalSerializer()` explícito | Auto-detect es solo profundidad-1    |

---

## Soporte de browsers

Todas las características requieren un browser que soporte:

- **Web Workers** — todos los browsers modernos (Chrome 4+, Firefox 3.5+, Safari 4+)
- **WebCrypto (`crypto.subtle`)** — requiere HTTPS (o `localhost`)
- **Objetos `Transferable`** — transferencia de `ArrayBuffer` soportada en todos los browsers modernos

Server-Side Rendering (SSR) se soporta via fallback automático al hilo principal.

---

## Documentación relacionada

- [Estudio de arquitectura y factibilidad](../../docs/sdd-angular-http-web-workers.md)
- [Investigación: serialización, Transferables, benchmarks](../../docs/research/http-worker-deep-research.md)
- [Desglose del producto](../../docs/research/http-worker-product-breakdown.md)
