[Read in English](./README.md)

# @angular-helpers/worker-http

Mové tus requests HTTP fuera del hilo principal. Un toolkit composable para Angular que ejecuta `fetch()` dentro de Web Workers, protegiendo tu UI de la latencia de red mientras agregás primitivas de seguridad (firma HMAC, integridad de contenido, rate limiting) que viven completamente en el scope aislado del worker.

> ⚠️ **Estado: En desarrollo activo — todavía no publicado en npm.**
> La API se está estabilizando. No usar en producción.

---

## ¿Por qué?

Cada request de `HttpClient` consume presupuesto del hilo compartido. Cuando una API lenta se traba, tus animaciones se cortan y las interacciones del usuario se encolan. Los Web Workers resuelven esto a nivel arquitectural: corren en un hilo OS separado, así que una llamada de red de 2 segundos no le cuesta nada al hilo principal.

Además, los workers proveen un límite de aislamiento natural para lógica sensible de seguridad: claves HMAC, firma de requests y verificación de contenido nunca tocan la memoria del hilo principal.

---

## Mapa de paquetes

| Entry point                                 | Descripción                                                         | Estado           |
| ------------------------------------------- | ------------------------------------------------------------------- | ---------------- |
| `@angular-helpers/worker-http/transport`    | Bridge RPC tipado, pool round-robin, cancelación                    | ✅ Disponible    |
| `@angular-helpers/worker-http/serializer`   | Serialización pluggable (structured clone, seroval, auto-detect)    | ✅ Disponible    |
| `@angular-helpers/worker-http/interceptors` | Pipeline de interceptors de funciones puras para workers            | ✅ Disponible    |
| `@angular-helpers/worker-http/crypto`       | Primitivas WebCrypto (HMAC, AES-GCM, hashing SHA)                   | ✅ Disponible    |
| `@angular-helpers/worker-http/backend`      | Reemplazo de `HttpBackend` de Angular — `provideWorkerHttpClient()` | 🔧 En desarrollo |

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
- Cancelación de requests via `AbortController` en el worker
- Detección automática de `Transferable` para transferencia zero-copy de `ArrayBuffer`
- Instanciación lazy del worker — no se crea ningún worker hasta el primer request

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

### `/backend` — Reemplazo de `HttpBackend` de Angular (en desarrollo)

> 🔧 **Este entry point está actualmente en desarrollo.**

El objetivo es un reemplazo drop-in del `HttpBackend` de Angular que enruta requests al worker apropiado de forma transparente.

**API planificada:**

```typescript
// app.config.ts
import {
  provideWorkerHttpClient,
  withWorkerConfigs,
  withWorkerRoutes,
  withWorkerFallback,
} from '@angular-helpers/worker-http/backend';

bootstrapApplication(AppComponent, {
  providers: [
    provideWorkerHttpClient(
      withWorkerConfigs([
        {
          id: 'secure',
          workerUrl: new URL('./workers/secure.worker', import.meta.url),
          maxInstances: 2,
        },
      ]),
      withWorkerRoutes([{ pattern: /\/api\/secure\//, worker: 'secure', priority: 10 }]),
      withWorkerFallback('main-thread'), // fallback SSR-safe
    ),
  ],
});

// data.service.ts — idéntico al uso normal de HttpClient
export class DataService {
  private http = inject(HttpClient);

  getReports() {
    return this.http.get<Report[]>('/api/secure/reports');
  }
}
```

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
