# Software Design Document (SDD)

## Angular Helpers Library - Deep Analysis & Improvement Proposals

**Version:** 1.0  
**Date:** 2026-04-05  
**Project:** @angular-helpers/\*

---

## 1. Executive Summary

This document provides a comprehensive analysis of the angular-helpers monorepo and proposes architectural improvements across all packages. The library consists of three main packages:

- **@angular-helpers/browser-web-apis** - 37 Browser API wrapper services
- **@angular-helpers/security** - Security-focused services (ReDoS prevention, Web Crypto)
- **@angular-helpers/worker-http** - Web Worker-based HTTP infrastructure

---

## 2. Current Architecture Overview

### 2.1 Package Structure

```
packages/
├── browser-web-apis/          # 37 services, base class pattern
├── security/                  # RegexSecurityService, WebCryptoService
└── worker-http/               # Transport, interceptors, backend, crypto
```

### 2.2 Technology Stack

- **Framework:** Angular 21
- **Language:** TypeScript (strict mode)
- **Testing:** Playwright (Chromium, Firefox, WebKit)
- **Linting:** oxlint + oxfmt
- **Build:** Angular CLI + Vite for workers
- **CI/CD:** GitHub Actions

---

## 3. Package-by-Package Analysis

### 3.1 @angular-helpers/browser-web-apis

#### Current State

- **37 services** covering modern Web APIs
- **Base class pattern:** `BrowserApiBaseService` with common functionality
- **Provider-based configuration:** Selective feature enabling
- **Mixed patterns:** Some services use signals, others use RxJS

#### Strengths

- Consistent base class with permission management
- SSR-aware platform detection
- Good error handling with cause chaining
- Headless browser testing with Playwright

#### Areas for Improvement

| Issue                             | Severity | Proposal                                                  |
| --------------------------------- | -------- | --------------------------------------------------------- |
| Mixed reactivity patterns         | Medium   | **PROPOSAL 1:** Standardize on signals + `toObservable()` |
| Missing `providedIn: 'root'`      | Medium   | **PROPOSAL 2:** Add tree-shakable providers               |
| No input/output functions         | Low      | **PROPOSAL 3:** Migrate to modern Angular patterns        |
| Console.error in production       | Medium   | **PROPOSAL 4:** Implement configurable logging            |
| Missing change detection strategy | Low      | **PROPOSAL 5:** Add OnPush where applicable               |

**PROPOSAL 1: Standardize Reactivity Patterns**

```typescript
// Current (mixed)
@Injectable()
export class WebStorageService extends BrowserApiBaseService {
  private storageEvents = signal<StorageEvent | null>(null);  // Signal
  getStorageEvents(): Observable<StorageEvent> {  // RxJS
    return toObservable(this.storageEvents).pipe(...)
  }
}

// Proposed: Signal-first with computed derivatives
@Injectable({ providedIn: 'root' })
export class WebStorageService extends BrowserApiBaseService {
  private storageEvents = signal<StorageEvent | null>(null);

  // Public signals for direct consumption
  readonly events = this.storageEvents.asReadonly();

  // Computed derived state
  readonly localStorageKeys = computed(() =>
    this.storageEvents()?.storageArea === 'localStorage'
      ? [this.storageEvents()!.key]
      : []
  );
}
```

**PROPOSAL 2: Tree-Shakable Providers**

```typescript
// Current: All providers registered via makeEnvironmentProviders
export function provideBrowserWebApis(config?: BrowserWebApisConfig) {
  // ... always includes all services
}

// Proposed: Lazy provider registration
export function provideClipboard(): Provider {
  return { provide: ClipboardService, useClass: ClipboardService };
}

// App can import only what it needs
providers: [provideClipboard(), provideWebStorage()];
```

**PROPOSAL 3: Modern Angular Input/Output**

```typescript
// For component-based services (observers, watchers)
@Component({
  selector: 'intersection-observer',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntersectionObserverDirective {
  // Modern signal-based inputs (Angular 20+)
  readonly root = input<Element | null>(null);
  readonly threshold = input<number[]>([0]);
  readonly isIntersecting = output<IntersectionObserverEntry>();
}
```

**PROPOSAL 4: Configurable Logging**

```typescript
// logging.config.ts
export interface LogConfig {
  level: 'debug' | 'info' | 'warn' | 'error' | 'silent';
  prefix: string;
}

export const LOG_CONFIG = new InjectionToken<LogConfig>('log.config');

// Base service enhancement
protected log(level: 'debug' | 'info' | 'warn' | 'error', message: string, ...args: unknown[]) {
  const config = inject(LOG_CONFIG, { optional: true }) ?? { level: 'error', prefix: '' };
  if (this.shouldLog(level, config.level)) {
    console[level](`[${config.prefix}${this.getApiName()}] ${message}`, ...args);
  }
}
```

**PROPOSAL 5: Component-based Observer Services**

```typescript
// IntersectionObserver as directive instead of service
@Directive({
  selector: '[ahIntersectionObserver]',
  host: { '[attr.aria-hidden]': 'true' },
})
export class IntersectionObserverDirective implements OnDestroy {
  private element = inject(ElementRef);
  readonly ahIntersectionObserver = input<IntersectionObserverInit>({});
  readonly ahIntersectionChange = output<IntersectionObserverEntry[]>();
}
```

---

### 3.2 @angular-helpers/security

#### Current State

- **2 services:** `RegexSecurityService`, `WebCryptoService`
- **Pattern:** Worker-based regex execution for ReDoS prevention
- **Builder pattern:** `RegexSecurityBuilder` for safe regex construction

#### Strengths

- Web Worker isolation for regex execution
- Timeout protection against catastrophic backtracking
- Complexity analysis with risk assessment
- Secure context enforcement for Web Crypto

#### Areas for Improvement

| Issue                              | Severity | Proposal                                              |
| ---------------------------------- | -------- | ----------------------------------------------------- |
| No XSS sanitization                | High     | **PROPOSAL 6:** Add HTML/URL sanitization service     |
| No CSP helper                      | High     | **PROPOSAL 7:** Add Content Security Policy utilities |
| Worker blob creation on every call | Medium   | **PROPOSAL 8:** Worker pool for regex service         |
| No input validation helpers        | Medium   | **PROPOSAL 9:** Add validation decorators/functions   |
| Missing secure storage             | Medium   | **PROPOSAL 10:** Add encrypted storage wrapper        |

**PROPOSAL 6: XSS Sanitization Service**

```typescript
@Injectable({ providedIn: 'root' })
export class XssSanitizationService {
  // HTML sanitization with configurable allowlists
  sanitizeHtml(input: string, config?: SanitizationConfig): SafeHtml;

  // URL validation
  sanitizeUrl(url: string): SafeUrl | null;

  // Style sanitization
  sanitizeStyle(style: string): SafeStyle;

  // Resource URL validation
  sanitizeResourceUrl(url: string): SafeResourceUrl | null;
}

// Usage in templates with pipe
@Pipe({ name: 'ahSafeHtml', standalone: true })
export class SafeHtmlPipe implements PipeTransform {
  constructor(private sanitizer: XssSanitizationService) {}
  transform(value: string): SafeHtml {
    return this.sanitizer.sanitizeHtml(value);
  }
}
```

**PROPOSAL 7: CSP (Content Security Policy) Utilities**

```typescript
// CSP configuration helper
export interface CspConfig {
  defaultSrc: string[];
  scriptSrc: string[];
  styleSrc: string[];
  imgSrc: string[];
  connectSrc: string[];
  fontSrc: string[];
  objectSrc: string[];
  mediaSrc: string[];
  frameSrc: string[];
  nonce?: string;
}

@Injectable({ providedIn: 'root' })
export class CspService {
  // Generate CSP header string
  generateHeader(config: CspConfig): string;

  // Generate nonce for inline scripts/styles
  generateNonce(): string;

  // Validate if URL violates CSP
  validateUrl(url: string, directive: CspDirective): boolean;
}
```

**PROPOSAL 8: Worker Pool for Regex Security**

```typescript
@Injectable({ providedIn: 'root' })
export class RegexSecurityService {
  private workerPool = inject(WorkerPoolService);

  async testRegex(
    pattern: string,
    text: string,
    config?: RegexSecurityConfig,
  ): Promise<RegexTestResult> {
    // Use pooled worker instead of creating new one
    return this.workerPool.execute('regex', { pattern, text, config });
  }
}

// Shared worker pool service across the library
@Injectable({ providedIn: 'root' })
export class WorkerPoolService {
  private pools = new Map<string, WorkerPool>();

  getPool(name: string, factory: () => Worker, maxWorkers?: number): WorkerPool;
  execute<T>(poolName: string, task: unknown): Promise<T>;
}
```

**PROPOSAL 9: Security Validation Decorators**

```typescript
// Input validation decorator
export function SecureInput(validator: InputValidator) {
  return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    const original = descriptor.value;
    descriptor.value = function (...args: unknown[]) {
      const sanitized = validator.validate(args);
      return original.apply(this, sanitized);
    };
  };
}

// Usage
class UserController {
  @SecureInput(new HtmlInputValidator())
  updateBio(@SanitizeHtml bio: string) {}
}
```

**PROPOSAL 10: Encrypted Storage Service**

```typescript
@Injectable({ providedIn: 'root' })
export class EncryptedStorageService {
  private crypto = inject(WebCryptoService);

  // Encrypt and store
  async setItem(key: string, value: string, password?: string): Promise<void>;

  // Decrypt and retrieve
  async getItem(key: string, password?: string): Promise<string | null>;

  // Key derivation for password-based encryption
  private deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey>;
}
```

---

### 3.3 @angular-helpers/worker-http

#### Current State

- **4 modules:** transport, interceptors, backend, crypto, serializer
- **Pattern:** Observable-based transport with RxJS
- **Features:** Worker pooling, interceptor chain, serialization

#### Strengths

- Well-typed transport layer
- Request/response correlation with UUIDs
- Automatic cancellation on unsubscribe
- Hardware concurrency awareness

#### Areas for Improvement

| Issue                         | Severity | Proposal                                                          |
| ----------------------------- | -------- | ----------------------------------------------------------------- |
| Heavy RxJS dependency         | Medium   | **PROPOSAL 11:** Add signal-based alternative transport           |
| No request deduplication      | Medium   | **PROPOSAL 12:** Add request coalescing                           |
| No built-in interceptors      | Low      | **PROPOSAL 13:** Provide common interceptors (retry, cache, auth) |
| Missing streaming support     | Medium   | **PROPOSAL 14:** Add Server-Sent Events / WebSocket streaming     |
| No Angular HTTP compatibility | High     | **PROPOSAL 15:** HttpClient-compatible backend                    |

**PROPOSAL 11: Signal-Based Transport (Alternative)**

```typescript
export interface SignalWorkerTransport<TRequest, TResponse> {
  // Signal-based API alongside Observable
  readonly state: Signal<TransportState>;
  readonly lastResponse: Signal<TResponse | null>;
  readonly error: Signal<TransportError | null>;
  readonly isLoading: Signal<boolean>;

  // Imperative request method
  execute(request: TRequest): void;

  // Reactive observable for chain composition
  observe(request: TRequest): Observable<TResponse>;
}

// Usage
const transport = createSignalWorkerTransport<DataRequest, DataResponse>(config);

// Template usage
template: `
  @if (transport.isLoading()) {
    <loading-spinner />
  }
  @if (transport.error()) {
    <error-message [error]="transport.error()" />
  }
  @if (transport.lastResponse()) {
    <data-view [data]="transport.lastResponse()" />
  }
`;
```

**PROPOSAL 12: Request Coalescing (Deduplication)**

```typescript
export interface WorkerTransportConfig {
  // ... existing config

  /** Enable request deduplication (default: true) */
  coalesceRequests?: boolean;

  /** Time window for considering requests identical in ms (default: 100) */
  coalesceWindowMs?: number;

  /** Key generator for request deduplication */
  coalesceKey?: (request: unknown) => string;
}

// Implementation
private pendingRequests = new Map<string, Observable<unknown>>();

function execute<T>(request: TRequest): Observable<TResponse> {
  const key = config.coalesceKey?.(request) ?? JSON.stringify(request);

  if (config.coalesceRequests && this.pendingRequests.has(key)) {
    return this.pendingRequests.get(key) as Observable<TResponse>;
  }

  const observable = this.doExecute(request).pipe(
    shareReplay({ bufferSize: 1, refCount: true }),
    finalize(() => this.pendingRequests.delete(key))
  );

  this.pendingRequests.set(key, observable);
  return observable;
}
```

**PROPOSAL 13: Built-in Interceptor Library**

```typescript
// Retry interceptor
export function createRetryInterceptor(config: RetryConfig): WorkerInterceptorFn {
  return async (req, next) => {
    let lastError: Error;
    let delay = config.initialDelay;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        return await next(req);
      } catch (error) {
        lastError = error as Error;

        // Check if status code is retryable
        const status = (error as WorkerErrorResponse).error?.status;
        if (!config.retryStatusCodes?.includes(status ?? 0)) {
          throw error;
        }

        if (attempt < config.maxRetries) {
          await sleep(delay);
          delay *= config.backoffMultiplier;
        }
      }
    }
    throw lastError;
  };
}

// Cache interceptor
export function createCacheInterceptor(config: CacheConfig): WorkerInterceptorFn {
  const cache = new Map<string, CacheEntry>();

  return async (req, next) => {
    const key = generateCacheKey(req);
    const cached = cache.get(key);

    if (cached && Date.now() - cached.timestamp < config.ttl) {
      return cached.response;
    }

    const response = await next(req);

    // Implement LRU eviction
    if (cache.size >= config.maxEntries) {
      const oldest = cache.keys().next().value;
      cache.delete(oldest);
    }

    cache.set(key, { response, timestamp: Date.now() });
    return response;
  };
}

// Auth/HMAC interceptor (already defined, add more)
export function createAuthInterceptor(getToken: () => string | null): WorkerInterceptorFn;
export function createRateLimitInterceptor(config: RateLimitConfig): WorkerInterceptorFn;
```

**PROPOSAL 14: Streaming Support**

```typescript
export interface StreamingConfig {
  /** Enable streaming for large responses */
  streaming?: boolean;

  /** Chunk size for streaming in bytes (default: 64KB) */
  chunkSize?: number;

  /** Streaming protocol: 'sse' | 'fetch-stream' | 'websocket' */
  protocol?: 'sse' | 'fetch-stream' | 'websocket';
}

export interface WorkerStreamTransport<TChunk> {
  // Signal-based streaming
  readonly chunks: Signal<TChunk[]>;
  readonly progress: Signal<number>; // 0-100
  readonly isComplete: Signal<boolean>;

  // Observable for reactive processing
  chunkStream(): Observable<TChunk>;

  // Control methods
  pause(): void;
  resume(): void;
  abort(): void;
}

export function createStreamingTransport<TChunk>(
  config: WorkerTransportConfig & StreamingConfig,
): WorkerStreamTransport<TChunk>;
```

**PROPOSAL 15: Angular HttpClient Backend**

```typescript
// HttpClient-compatible backend that routes to workers
@Injectable()
export class WorkerHttpBackend implements HttpBackend {
  private transport = inject(WorkerHttpTransport);

  handle(req: HttpRequest<unknown>): Observable<HttpEvent<unknown>> {
    // Convert HttpRequest to SerializableRequest
    const serializable = this.serializeRequest(req);

    // Route through worker transport
    return this.transport.execute(serializable).pipe(
      map(
        (response) =>
          new HttpResponse({
            body: response.body,
            status: response.status,
            statusText: response.statusText,
            headers: new HttpHeaders(response.headers),
          }),
      ),
    );
  }
}

// Usage in app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withWorkerBackend({
        workerUrl: new URL('./api.worker.ts', import.meta.url),
        maxInstances: 2,
      }),
    ),
  ],
};
```

---

## 4. Cross-Cutting Concerns

### 4.1 Testing Infrastructure Improvements

| Proposal                                   | Description                           |
| ------------------------------------------ | ------------------------------------- |
| **PROPOSAL 16:** Visual regression testing | Add Playwright screenshot comparisons |
| **PROPOSAL 17:** Performance benchmarks    | Add Lighthouse CI for demo app        |
| **PROPOSAL 18:** Mutation testing          | Integrate Stryker for test quality    |
| **PROPOSAL 19:** E2E test coverage         | Expand smoke tests to all browsers    |

### 4.2 Documentation Improvements

| Proposal                                | Description                        |
| --------------------------------------- | ---------------------------------- |
| **PROPOSAL 20:** Interactive API docs   | Swagger/OpenAPI for services       |
| **PROPOSAL 21:** Usage examples         | StackBlitz integration per service |
| **PROPOSAL 22:** Migration guides       | Version-to-version upgrade paths   |
| **PROPOSAL 23:** Browser support matrix | Can I Use integration              |

### 4.3 Developer Experience

| Proposal                              | Description                                |
| ------------------------------------- | ------------------------------------------ |
| **PROPOSAL 24:** Schematics           | `ng add @angular-helpers/browser-web-apis` |
| **PROPOSAL 25:** DevTools integration | Browser extension for debugging            |
| **PROPOSAL 26:** Performance metrics  | Built-in usage analytics (opt-in)          |
| **PROPOSAL 27:** Error boundaries     | Global error handling for services         |

---

## 5. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)

- [ ] PROPOSAL 2: Tree-shakable providers
- [ ] PROPOSAL 4: Configurable logging
- [ ] PROPOSAL 16: Visual regression testing

### Phase 2: Core Improvements (Weeks 3-4)

- [ ] PROPOSAL 1: Standardize signals
- [ ] PROPOSAL 8: Worker pool
- [ ] PROPOSAL 11: Signal-based transport

### Phase 3: Security Expansion (Weeks 5-6)

- [ ] PROPOSAL 6: XSS Sanitization
- [ ] PROPOSAL 7: CSP utilities
- [ ] PROPOSAL 10: Encrypted storage

### Phase 4: Worker-HTTP Enhancement (Weeks 7-8)

- [ ] PROPOSAL 12: Request coalescing
- [ ] PROPOSAL 13: Built-in interceptors
- [ ] PROPOSAL 15: HttpClient backend

### Phase 5: Developer Experience (Weeks 9-10)

- [ ] PROPOSAL 24: Schematics
- [ ] PROPOSAL 20: Interactive docs
- [ ] PROPOSAL 27: Error boundaries

---

## 6. Architectural Decision Records (ADRs)

### ADR-001: Signal-First Architecture

**Status:** Proposed  
**Context:** Current mix of signals and RxJS causes inconsistency  
**Decision:** Adopt signals as primary reactivity primitive, use `toObservable()` for interop  
**Consequences:** Simpler code, better performance, but requires migration effort

### ADR-002: Worker Pool Pattern

**Status:** Proposed  
**Context:** Creating workers on-demand is expensive  
**Decision:** Implement shared worker pool service across all packages  
**Consequences:** Reduced memory footprint, faster execution, added complexity

### ADR-003: HttpClient Compatibility

**Status:** Proposed  
**Context:** Users expect Angular HttpClient integration  
**Decision:** Provide WorkerHttpBackend implementing HttpBackend interface  
**Consequences:** Seamless integration, but may limit some advanced features

---

## 7. Success Metrics

| Metric                 | Current  | Target                 |
| ---------------------- | -------- | ---------------------- |
| Bundle size (gzip)     | TBD      | -20% with tree-shaking |
| Test coverage          | ~70%     | >90%                   |
| Performance (ops/sec)  | Baseline | +30% with worker pool  |
| Developer satisfaction | N/A      | >4.5/5 via survey      |

---

## Appendix A: Service Inventory

### browser-web-apis (37 services)

| Service                     | API                   | Status       | Signals | Proposal                 |
| --------------------------- | --------------------- | ------------ | ------- | ------------------------ |
| BarcodeDetectorService      | Barcode Detection API | Experimental | No      | Migrate to signals       |
| BatteryService              | Battery API           | Deprecated   | No      | Add deprecation notice   |
| BroadcastChannelService     | Broadcast Channel API | Stable       | No      | Migrate to signals       |
| BrowserCapabilityService    | Capability detection  | Stable       | Partial | Standardize              |
| CameraService               | MediaDevices + Canvas | Stable       | No      | Migrate to signals       |
| ClipboardService            | Clipboard API         | Stable       | No      | Migrate to signals       |
| CredentialManagementService | Credential Management | Stable       | No      | Migrate to signals       |
| EyeDropperService           | EyeDropper API        | Experimental | No      | Migrate to signals       |
| FileSystemAccessService     | File System Access    | Stable       | No      | Migrate to signals       |
| FullscreenService           | Fullscreen API        | Stable       | No      | Migrate to signals       |
| GamepadService              | Gamepad API           | Stable       | No      | Migrate to signals       |
| GeolocationService          | Geolocation API       | Stable       | No      | Migrate to signals       |
| IdleDetectorService         | Idle Detection        | Experimental | No      | Migrate to signals       |
| IntersectionObserverService | Intersection Observer | Stable       | No      | Convert to directive     |
| MediaDevicesService         | MediaDevices API      | Stable       | Partial | Standardize              |
| MediaRecorderService        | MediaRecorder API     | Stable       | No      | Migrate to signals       |
| MutationObserverService     | Mutation Observer     | Stable       | No      | Convert to directive     |
| NetworkInformationService   | Network Information   | Stable       | No      | Migrate to signals       |
| NotificationService         | Notifications API     | Stable       | No      | Migrate to signals       |
| PageVisibilityService       | Page Visibility API   | Stable       | No      | Migrate to signals       |
| PaymentRequestService       | Payment Request       | Stable       | No      | Migrate to signals       |
| PerformanceObserverService  | Performance Observer  | Stable       | No      | Convert to directive     |
| PermissionsService          | Permissions API       | Stable       | No      | Migrate to signals       |
| ResizeObserverService       | Resize Observer       | Stable       | No      | Convert to directive     |
| ScreenOrientationService    | Screen Orientation    | Stable       | No      | Migrate to signals       |
| ScreenWakeLockService       | Wake Lock API         | Stable       | No      | Migrate to signals       |
| ServerSentEventsService     | EventSource           | Stable       | No      | Migrate to signals       |
| SpeechSynthesisService      | Web Speech API        | Stable       | No      | Migrate to signals       |
| VibrationService            | Vibration API         | Stable       | No      | Migrate to signals       |
| WebAudioService             | Web Audio API         | Stable       | No      | Migrate to signals       |
| WebBluetoothService         | Web Bluetooth         | Experimental | No      | Migrate to signals       |
| WebNfcService               | Web NFC               | Experimental | No      | Migrate to signals       |
| WebShareService             | Web Share API         | Stable       | No      | Migrate to signals       |
| WebSocketService            | WebSocket API         | Stable       | No      | Migrate to signals       |
| WebStorageService           | Storage API           | Stable       | Yes     | Reference implementation |
| WebUsbService               | Web USB               | Experimental | No      | Migrate to signals       |
| WebWorkerService            | Web Workers API       | Stable       | No      | Migrate to signals       |

---

_End of Document_
