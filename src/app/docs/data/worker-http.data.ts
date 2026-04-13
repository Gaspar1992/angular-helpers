import { ServiceDoc } from '../models/doc-meta.model';

export const WORKER_HTTP_ENTRIES: ServiceDoc[] = [
  {
    id: 'transport',
    name: 'createWorkerTransport',
    description:
      'Typed RPC bridge between main thread and Web Worker. Wraps postMessage with request/response correlation, Observable API, and automatic cancellation on unsubscribe.',
    scope: 'root',
    importPath: '@angular-helpers/worker-http/transport',
    requiresSecureContext: false,
    browserSupport: 'All browsers with Web Workers support',
    notes: [
      'Round-robin pool for parallel request handling',
      'Request cancellation via AbortController in the worker',
      'Automatic Transferable detection for zero-copy ArrayBuffer transfer',
      'Lazy worker instantiation',
    ],
    methods: [
      {
        name: 'createWorkerTransport',
        signature: 'createWorkerTransport(config: WorkerTransportConfig): WorkerTransport',
        description:
          'Creates a typed RPC transport that communicates with a Web Worker. Returns an Observable-based API for executing requests.',
        returns: 'WorkerTransport',
      },
      {
        name: 'execute',
        signature: 'execute(request: TRequest): Observable<TResponse>',
        description:
          'Sends a request to the worker and returns an Observable. Unsubscribing sends a cancel message.',
        returns: 'Observable<TResponse>',
      },
      {
        name: 'terminate',
        signature: 'terminate(): void',
        description: 'Cleans up all worker instances and releases resources.',
        returns: 'void',
      },
    ],
    example: `import { createWorkerTransport } from '@angular-helpers/worker-http/transport';

const transport = createWorkerTransport({
  workerUrl: new URL('./workers/api.worker', import.meta.url),
  maxInstances: 2,
});

// Execute request - returns Observable
const response$ = transport.execute({ method: 'GET', url: '/api/users' });

response$.subscribe({
  next: (result) => console.log('Response:', result),
  error: (err) => console.error('Error:', err),
});

// Clean up when done
transport.terminate();`,
  },
  {
    id: 'interceptors',
    name: 'createWorkerPipeline',
    description:
      'Creates a request pipeline inside the worker using pure-function interceptors. No Angular DI, no DOM access — just (req, next) => Promise<response>.',
    scope: 'root',
    importPath: '@angular-helpers/worker-http/interceptors',
    requiresSecureContext: false,
    browserSupport: 'All browsers with Web Workers support',
    notes: [
      'Interceptors run left-to-right in the order provided',
      'Each interceptor can modify the request before passing to next()',
      'Pure functions — no external dependencies or side effects',
    ],
    methods: [
      {
        name: 'createWorkerPipeline',
        signature:
          'createWorkerPipeline(interceptors: WorkerInterceptorFn[]): WorkerRequestHandler',
        description:
          'Creates a request handler that runs the interceptor chain before calling fetch().',
        returns: 'WorkerRequestHandler',
      },
      {
        name: 'retryInterceptor',
        signature: 'retryInterceptor(config?: RetryConfig): WorkerInterceptorFn',
        description:
          'Retries failed requests with exponential backoff. Respects Retry-After header.',
        returns: 'WorkerInterceptorFn',
      },
      {
        name: 'cacheInterceptor',
        signature: 'cacheInterceptor(config?: CacheConfig): WorkerInterceptorFn',
        description:
          'In-worker response cache with configurable TTL and max entries. Per-factory state.',
        returns: 'WorkerInterceptorFn',
      },
      {
        name: 'hmacSigningInterceptor',
        signature: 'hmacSigningInterceptor(config: HmacSigningConfig): WorkerInterceptorFn',
        description:
          'Signs outgoing requests with HMAC-SHA256/384/512. CryptoKey imported once and reused.',
        returns: 'WorkerInterceptorFn',
      },
      {
        name: 'loggingInterceptor',
        signature: 'loggingInterceptor(config?: LoggingConfig): WorkerInterceptorFn',
        description:
          'Logs request/response. Logger exceptions are swallowed — never interrupts pipeline.',
        returns: 'WorkerInterceptorFn',
      },
      {
        name: 'rateLimitInterceptor',
        signature: 'rateLimitInterceptor(config?: RateLimitConfig): WorkerInterceptorFn',
        description:
          'Client-side sliding-window rate limiter. Throws { status: 429 } when exceeded.',
        returns: 'WorkerInterceptorFn',
      },
      {
        name: 'contentIntegrityInterceptor',
        signature: 'contentIntegrityInterceptor(config?: IntegrityConfig): WorkerInterceptorFn',
        description: 'Verifies SHA-256 hash of response body against server-provided header.',
        returns: 'WorkerInterceptorFn',
      },
      {
        name: 'composeInterceptors',
        signature: 'composeInterceptors(...fns: WorkerInterceptorFn[]): WorkerInterceptorFn',
        description: 'Composes multiple interceptors into a single interceptor function.',
        returns: 'WorkerInterceptorFn',
      },
    ],
    example: `// workers/secure.worker.ts
import { createWorkerPipeline } from '@angular-helpers/worker-http/interceptors';
import {
  loggingInterceptor,
  retryInterceptor,
  hmacSigningInterceptor,
  rateLimitInterceptor,
} from '@angular-helpers/worker-http/interceptors';

createWorkerPipeline([
  loggingInterceptor(),
  retryInterceptor({ maxRetries: 3, initialDelay: 500 }),
  rateLimitInterceptor({ maxRequests: 100, windowMs: 60000 }),
  hmacSigningInterceptor({
    keyMaterial: new TextEncoder().encode(self.HMAC_SECRET),
    headerName: 'X-HMAC-Signature',
  }),
]);`,
  },
  {
    id: 'serializer',
    name: 'Serializers',
    description:
      'Pluggable serialization for the postMessage boundary. Structured clone (zero overhead), seroval (full type fidelity), or auto-detect (smart selection).',
    scope: 'root',
    importPath: '@angular-helpers/worker-http/serializer',
    requiresSecureContext: false,
    browserSupport: 'All browsers with Web Workers support',
    notes: [
      'structuredCloneSerializer is the default — zero overhead',
      'createSerovalSerializer supports Date, Map, Set, BigInt, circular refs',
      'createAutoSerializer detects complex types at depth-1 and picks best strategy',
      'Large payloads (>100 KiB) use ArrayBuffer transfer for zero-copy',
    ],
    methods: [
      {
        name: 'structuredCloneSerializer',
        signature: 'structuredCloneSerializer: Serializer',
        description:
          'Zero-overhead serializer using native structured clone. Default when none configured.',
        returns: 'Serializer',
      },
      {
        name: 'createSerovalSerializer',
        signature: 'createSerovalSerializer(): Promise<Serializer>',
        description:
          'Async factory that returns a seroval-based serializer. Full type fidelity support.',
        returns: 'Promise<Serializer>',
      },
      {
        name: 'createAutoSerializer',
        signature: 'createAutoSerializer(config?: AutoSerializerConfig): Promise<Serializer>',
        description:
          'Smart auto-detection: seroval for complex types, structured clone for simple. Async factory, sync serializer.',
        returns: 'Promise<Serializer>',
      },
      {
        name: 'serialize',
        signature: 'serialize<T>(data: T): SerializedPayload',
        description: 'Serializes data for postMessage transfer.',
        returns: 'SerializedPayload',
      },
      {
        name: 'deserialize',
        signature: 'deserialize<T>(payload: SerializedPayload): T',
        description: 'Deserializes payload back to original data.',
        returns: 'T',
      },
    ],
    example: `import {
  structuredCloneSerializer,
  createSerovalSerializer,
  createAutoSerializer,
} from '@angular-helpers/worker-http/serializer';

// Option 1: Structured clone (default, zero overhead)
const simple = structuredCloneSerializer;

// Option 2: Seroval for full type fidelity
const seroval = await createSerovalSerializer();
const payload = seroval.serialize({ date: new Date(), tags: new Set(['a']) });
const original = seroval.deserialize(payload);
// original.date instanceof Date → true

// Option 3: Auto-detect (recommended for mixed payloads)
const auto = await createAutoSerializer({ transferThreshold: 102400 });
// Simple objects → structured clone
// Objects with Date/Map/Set → seroval
// Large payloads → ArrayBuffer transfer`,
  },
  {
    id: 'backend',
    name: 'provideWorkerHttpClient',
    description:
      'Angular HttpBackend replacement that routes HttpClient requests to Web Workers off the main thread. Drop-in integration with Angular DI — use WorkerHttpClient just like HttpClient.',
    scope: 'root',
    importPath: '@angular-helpers/worker-http/backend',
    requiresSecureContext: false,
    browserSupport: 'All browsers with Web Workers support. Falls back to FetchBackend in SSR.',
    notes: [
      'provideWorkerHttpClient() replaces provideHttpClient() — do not use both',
      'WorkerHttpClient wraps HttpClient with an optional { worker } routing field',
      'WORKER_TARGET HttpContextToken enables per-request worker routing',
      'SSR-safe: falls back to FetchBackend when typeof Worker === "undefined"',
      'withWorkerSerialization() applies to request body only; worker-side deserialization is developer responsibility',
    ],
    methods: [
      {
        name: 'provideWorkerHttpClient',
        signature:
          'provideWorkerHttpClient(...features: WorkerHttpFeature[]): EnvironmentProviders',
        description:
          'Root provider that replaces provideHttpClient(). Registers WorkerHttpBackend, WorkerHttpClient, and all feature providers.',
        returns: 'EnvironmentProviders',
      },
      {
        name: 'withWorkerConfigs',
        signature: 'withWorkerConfigs(configs: WorkerConfig[]): WorkerHttpFeature',
        description:
          'Registers named worker definitions. Each WorkerConfig has id, workerUrl, and optional maxInstances for pooling.',
        returns: 'WorkerHttpFeature<"WorkerConfigs">',
      },
      {
        name: 'withWorkerRoutes',
        signature: 'withWorkerRoutes(routes: WorkerRoute[]): WorkerHttpFeature',
        description:
          'URL-pattern to worker routing rules. Higher priority = evaluated first. Patterns can be RegExp or string prefix.',
        returns: 'WorkerHttpFeature<"WorkerRoutes">',
      },
      {
        name: 'withWorkerFallback',
        signature: "withWorkerFallback(strategy: 'main-thread' | 'error'): WorkerHttpFeature",
        description:
          "Configures behavior when workers are unavailable (SSR, unsupported browsers). 'main-thread' uses FetchBackend; 'error' throws.",
        returns: 'WorkerHttpFeature<"WorkerFallback">',
      },
      {
        name: 'withWorkerSerialization',
        signature: 'withWorkerSerialization(serializer: WorkerSerializer): WorkerHttpFeature',
        description:
          'Plugs in a custom serializer for request body crossing the worker boundary. Use with createSerovalSerializer() for complex types (Date, Map, Set).',
        returns: 'WorkerHttpFeature<"WorkerSerialization">',
      },
      {
        name: 'WorkerHttpClient.get / post / put / delete / patch',
        signature: 'get<T>(url, options?: WorkerRequestOptions): Observable<T>',
        description:
          'HttpClient-compatible methods with an optional { worker: string } field for per-request worker routing.',
        returns: 'Observable<T>',
      },
    ],
    example: `// app.config.ts
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
          maxInstances: 2,
        },
        {
          id: 'secure',
          workerUrl: new URL('./workers/secure.worker', import.meta.url),
        },
      ]),
      withWorkerRoutes([
        { pattern: /\\/api\\/secure\\//, worker: 'secure', priority: 10 },
        { pattern: /\\/api\\//, worker: 'api', priority: 5 },
      ]),
      withWorkerFallback('main-thread'), // SSR-safe
      withWorkerSerialization(createSerovalSerializer()), // optional
    ),
  ],
};

// data.service.ts — use WorkerHttpClient like HttpClient
export class DataService {
  private http = inject(WorkerHttpClient);

  getUsers() {
    return this.http.get<User[]>('/api/users'); // auto-routed to 'api' worker
  }

  getSecureData() {
    // explicit worker override via HttpContextToken
    return this.http.get('/api/secure/payments', { worker: 'secure' });
  }
}`,
  },
  {
    id: 'crypto',
    name: 'WebCrypto Utilities',
    description:
      'Standalone WebCrypto primitives for HMAC signing, AES-GCM encryption, and content hashing. Useful in workers and main thread; workers provide memory isolation for key material.',
    scope: 'root',
    importPath: '@angular-helpers/worker-http/crypto',
    requiresSecureContext: true,
    browserSupport: 'All modern browsers with Web Crypto API',
    notes: [
      'Requires secure context (HTTPS or localhost)',
      'HMAC keys are imported once and reused for performance',
      'All operations are async and return Promises',
    ],
    methods: [
      {
        name: 'createHmacSigner',
        signature: 'createHmacSigner(config: HmacConfig): Promise<HmacSigner>',
        description:
          'Creates an HMAC signer/verifier with the specified key material and algorithm.',
        returns: 'Promise<HmacSigner>',
      },
      {
        name: 'sign',
        signature: 'sign(data: string | ArrayBuffer): Promise<ArrayBuffer>',
        description: 'Creates an HMAC signature of the data.',
        returns: 'Promise<ArrayBuffer>',
      },
      {
        name: 'verify',
        signature: 'verify(data: string | ArrayBuffer, signature: ArrayBuffer): Promise<boolean>',
        description: 'Verifies an HMAC signature against the data.',
        returns: 'Promise<boolean>',
      },
      {
        name: 'createAesEncryptor',
        signature: 'createAesEncryptor(config: AesConfig): Promise<AesEncryptor>',
        description: 'Creates an AES-GCM encryptor/decryptor.',
        returns: 'Promise<AesEncryptor>',
      },
      {
        name: 'encrypt',
        signature: 'encrypt(plaintext: string): Promise<EncryptedPayload>',
        description: 'Encrypts plaintext using AES-GCM. Returns ciphertext and IV.',
        returns: 'Promise<{ ciphertext: ArrayBuffer; iv: Uint8Array }>',
      },
      {
        name: 'decrypt',
        signature: 'decrypt(payload: EncryptedPayload): Promise<ArrayBuffer>',
        description: 'Decrypts AES-GCM ciphertext using the provided IV.',
        returns: 'Promise<ArrayBuffer>',
      },
      {
        name: 'createContentHasher',
        signature: 'createContentHasher(algorithm?: HashAlgorithm): ContentHasher',
        description: 'Creates a content hasher for the specified algorithm.',
        returns: 'ContentHasher',
      },
      {
        name: 'hash',
        signature: 'hash(data: string | ArrayBuffer): Promise<ArrayBuffer>',
        description: 'Hashes the data using the configured algorithm.',
        returns: 'Promise<ArrayBuffer>',
      },
    ],
    example: `import {
  createHmacSigner,
  createAesEncryptor,
  createContentHasher,
} from '@angular-helpers/worker-http/crypto';

// HMAC Signing
const signer = await createHmacSigner({
  keyMaterial: new TextEncoder().encode('my-secret-key'),
  algorithm: 'SHA-256',
});
const signature = await signer.sign('GET:/api/users:');
const valid = await signer.verify('GET:/api/users:', signature);

// AES Encryption
const encryptor = await createAesEncryptor({
  keyMaterial: new TextEncoder().encode('32-byte-secret-key-for-aes-256!!'),
  algorithm: 'AES-GCM',
});
const { ciphertext, iv } = await encryptor.encrypt('sensitive data');
const decrypted = await encryptor.decrypt({ ciphertext, iv });

// Content Hashing
const hasher = createContentHasher('SHA-256');
const hash = await hasher.hash('data to hash');`,
  },
];

export const WORKER_HTTP_INTERFACES = [
  {
    name: 'WorkerTransportConfig',
    description: 'Configuration for the worker transport.',
    fields: [
      {
        name: 'workerUrl',
        type: 'URL | string',
        description: 'URL to the worker script (pre-transpiled)',
      },
      {
        name: 'maxInstances?',
        type: 'number',
        description: 'Number of workers in the round-robin pool (default: 1)',
      },
      {
        name: 'serializer?',
        type: 'Serializer',
        description: 'Custom serializer (default: structuredCloneSerializer)',
      },
    ],
  },
  {
    name: 'WorkerInterceptorFn',
    description: 'Interceptor function signature.',
    fields: [
      {
        name: 'req',
        type: 'WorkerRequest',
        description: 'The request object',
      },
      {
        name: 'next',
        type: '(req: WorkerRequest) => Promise<WorkerResponse>',
        description: 'Function to call the next interceptor or fetch',
      },
    ],
  },
  {
    name: 'RetryConfig',
    description: 'Configuration for retry interceptor.',
    fields: [
      { name: 'maxRetries?', type: 'number', description: 'Max retry attempts (default: 3)' },
      {
        name: 'initialDelay?',
        type: 'number',
        description: 'Initial retry delay in ms (default: 1000)',
      },
      {
        name: 'backoffMultiplier?',
        type: 'number',
        description: 'Backoff multiplier (default: 2)',
      },
      {
        name: 'retryStatusCodes?',
        type: 'number[]',
        description: 'Status codes to retry (default: [408, 429, 500, 502, 503, 504])',
      },
      {
        name: 'retryOnNetworkError?',
        type: 'boolean',
        description: 'Retry on network errors (default: true)',
      },
    ],
  },
  {
    name: 'CacheConfig',
    description: 'Configuration for cache interceptor.',
    fields: [
      { name: 'ttl?', type: 'number', description: 'Cache TTL in ms (default: 60000)' },
      { name: 'maxEntries?', type: 'number', description: 'Max cache entries (default: 100)' },
      { name: 'methods?', type: 'string[]', description: "Methods to cache (default: ['GET'])" },
    ],
  },
  {
    name: 'HmacSigningConfig',
    description: 'Configuration for HMAC signing interceptor.',
    fields: [
      {
        name: 'keyMaterial',
        type: 'ArrayBuffer | Uint8Array',
        description: 'Raw key bytes for HMAC import',
      },
      {
        name: 'algorithm?',
        type: "'SHA-256' | 'SHA-384' | 'SHA-512'",
        description: "Hash algorithm (default: 'SHA-256')",
      },
      {
        name: 'headerName?',
        type: 'string',
        description: "Header name for signature (default: 'X-HMAC-Signature')",
      },
      {
        name: 'payloadBuilder?',
        type: '(req: WorkerRequest) => string',
        description: 'Function to build the string to sign',
      },
    ],
  },
  {
    name: 'AutoSerializerConfig',
    description: 'Configuration for auto serializer.',
    fields: [
      {
        name: 'transferThreshold?',
        type: 'number',
        description: 'Size threshold for ArrayBuffer transfer in bytes (default: 102400)',
      },
    ],
  },
  {
    name: 'WorkerConfig',
    description: 'Single worker definition registered via withWorkerConfigs().',
    fields: [
      { name: 'id', type: 'string', description: 'Unique identifier used for routing' },
      {
        name: 'workerUrl',
        type: 'URL',
        description: 'URL of the worker script (passed to new Worker(url))',
      },
      {
        name: 'maxInstances?',
        type: 'number',
        description: 'Max worker instances in the pool (default: 1)',
      },
    ],
  },
  {
    name: 'WorkerRoute',
    description: 'URL-pattern to worker routing rule registered via withWorkerRoutes().',
    fields: [
      {
        name: 'pattern',
        type: 'RegExp | string',
        description: 'URL pattern to match (RegExp test or string prefix)',
      },
      { name: 'worker', type: 'string', description: 'Must match a WorkerConfig.id' },
      {
        name: 'priority?',
        type: 'number',
        description: 'Higher priority = evaluated first (default: 0)',
      },
    ],
  },
  {
    name: 'WorkerRequestOptions',
    description: 'HttpClient request options extended with optional per-request worker routing.',
    fields: [
      {
        name: 'worker?',
        type: 'string',
        description: 'Explicit worker id to use for this request. Overrides URL routing.',
      },
    ],
  },
];
