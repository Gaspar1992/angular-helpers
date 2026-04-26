import { ChangeDetectionStrategy, Component, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  createWorkerTransport,
  WorkerHttpAbortError,
  WorkerHttpTimeoutError,
} from '@angular-helpers/worker-http/transport';
import type { WorkerTransport } from '@angular-helpers/worker-http/transport';
import { matchWorkerRoute } from '@angular-helpers/worker-http/backend';
import type { WorkerRoute, SerializableResponse } from '@angular-helpers/worker-http/backend';
import {
  createHmacSigner,
  createContentHasher,
  createAesEncryptor,
} from '@angular-helpers/worker-http/crypto';
import type {
  HmacSigner,
  ContentHasher,
  AesEncryptor,
  EncryptedPayload,
} from '@angular-helpers/worker-http/crypto';

const ECHO_WORKER_URL = 'assets/workers/echo.worker.js';
const HTTP_API_WORKER_URL = 'assets/workers/http-api.worker.js';

const DEMO_ROUTES: WorkerRoute[] = [
  { pattern: /\/api\/secure\//, worker: 'secure', priority: 10 },
  { pattern: /\/api\//, worker: 'api', priority: 5 },
  { pattern: '/public/', worker: 'cdn', priority: 1 },
];

const ROUTING_TEST_URLS = [
  '/api/users',
  '/api/secure/payments',
  '/public/images/logo.png',
  '/other/path',
];

interface LogEntry {
  id: number;
  time: string;
  section: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

@Component({
  selector: 'app-worker-http-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <!-- Header -->
      <header class="mb-8 sm:mb-12">
        <div class="flex flex-wrap items-center gap-3 mb-4">
          <span class="text-4xl">🚀</span>
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold text-base-content m-0">Worker HTTP Demo</h1>
            <p class="text-sm sm:text-base text-base-content/80 m-0 mt-1">
              Off-main-thread HTTP with typed RPC bridge
            </p>
          </div>
        </div>
        <div class="flex flex-wrap gap-2">
          <span class="badge badge-primary badge-md">Worker Transport</span>
          <span class="badge badge-secondary badge-md">HMAC Crypto</span>
          <span class="badge badge-accent badge-md">Content Hashing</span>
          <span class="badge badge-info badge-md">AES Encryption</span>
          <span class="badge badge-success badge-md">HttpBackend</span>
        </div>
      </header>

      <!-- Demo Cards Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Worker Transport -->
        <div class="bg-base-200 border border-base-300 rounded-xl p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-base-content m-0 flex items-center gap-2">
              ⚡ WorkerTransport
            </h2>
            <span class="badge badge-primary">Typed RPC</span>
          </div>
          <p class="text-sm text-base-content/80 mb-4">
            Typed RPC bridge with request/response correlation and worker pool
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <button
              (click)="sendEcho()"
              [disabled]="transportStatus() === 'running'"
              class="btn btn-primary btn-sm"
            >
              @if (transportStatus() === 'running') {
                <span class="loading loading-spinner loading-xs"></span>
              }
              Send Echo
            </button>
            <button
              (click)="sendPoolBurst()"
              [disabled]="transportStatus() === 'running'"
              class="btn btn-secondary btn-sm"
            >
              Pool Burst (4 workers)
            </button>
          </div>

          @if (transportResult()) {
            <div class="p-3 bg-base-300 rounded-lg font-mono text-xs break-all">
              <span class="text-secondary">Result ({{ transportTime() }}ms):</span>
              <br />
              {{ transportResult() }}
            </div>
          }
        </div>

        <!-- HMAC Signing -->
        <div class="bg-base-200 border border-base-300 rounded-xl p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-base-content m-0 flex items-center gap-2">
              ✍️ HMAC Signing
            </h2>
            <span class="badge badge-secondary">HMAC-SHA256</span>
          </div>
          <p class="text-sm text-base-content/80 mb-4">
            Sign and verify request payloads using HMAC via native Web Crypto API
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <button (click)="initHmacAndSign()" class="btn btn-primary btn-sm">Sign Payload</button>
            <button
              (click)="verifyHmac()"
              [disabled]="!hmacSignature()"
              class="btn btn-secondary btn-sm"
            >
              Verify Signature
            </button>
          </div>

          @if (hmacSignature()) {
            <div class="p-3 bg-base-300 rounded-lg font-mono text-xs break-all mb-2">
              <span class="text-secondary">Signature:</span> {{ hmacSignature() }}
            </div>
          }
          @if (hmacVerified() !== null) {
            <div
              class="p-2 rounded-lg text-sm"
              [class.bg-success/10]="hmacVerified()"
              [class.text-success]="hmacVerified()"
              [class.bg-error/10]="!hmacVerified()"
              [class.text-error]="!hmacVerified()"
            >
              {{ hmacVerified() ? '✅ Valid Signature' : '❌ Invalid Signature' }}
            </div>
          }
        </div>

        <!-- Content Hashing -->
        <div class="bg-base-200 border border-base-300 rounded-xl p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-base-content m-0 flex items-center gap-2">
              #️⃣ Content Hashing
            </h2>
            <span class="badge badge-accent">SHA-256</span>
          </div>
          <p class="text-sm text-base-content/80 mb-4">
            Generate SHA-256 hashes of request bodies for integrity checks and caching
          </p>

          <button (click)="hashContent()" class="btn btn-accent btn-sm w-full sm:w-auto">
            Hash Content
          </button>

          @if (hashResult()) {
            <div class="mt-3 p-3 bg-base-300 rounded-lg font-mono text-xs break-all">
              <span class="text-secondary">SHA-256:</span> {{ hashResult() }}
            </div>
          }
        </div>

        <!-- AES Encryption -->
        <div class="bg-base-200 border border-base-300 rounded-xl p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-base-content m-0 flex items-center gap-2">
              🔐 AES Encryption
            </h2>
            <span class="badge badge-info">AES-GCM</span>
          </div>
          <p class="text-sm text-base-content/80 mb-4">
            Encrypt and decrypt sensitive payloads using AES-GCM
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <button (click)="encryptData()" class="btn btn-info btn-sm">Encrypt</button>
            <button
              (click)="decryptData()"
              [disabled]="!encryptedHex()"
              class="btn btn-secondary btn-sm"
            >
              Decrypt
            </button>
          </div>

          @if (encryptedHex()) {
            <div class="p-3 bg-base-300 rounded-lg font-mono text-xs break-all mb-2">
              <span class="text-secondary">Encrypted:</span> {{ encryptedHex() }}
            </div>
          }
          @if (decryptedText()) {
            <div class="p-3 bg-success/10 text-success rounded-lg font-mono text-sm break-all">
              <span>Decrypted:</span> {{ decryptedText() }}
            </div>
          }
        </div>
      </div>

      <!-- Cancellation Demo -->
      <div class="bg-base-200 border border-base-300 rounded-xl p-6 col-span-full mt-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold text-base-content m-0 flex items-center gap-2">
            🛑 Cancellation
          </h2>
          <span class="badge badge-warning">New in v0.8.0</span>
        </div>
        <p class="text-sm text-base-content/80 mb-4">
          Per-request
          <code class="font-mono text-xs bg-base-300 px-1.5 py-0.5 rounded">signal</code> and
          <code class="font-mono text-xs bg-base-300 px-1.5 py-0.5 rounded">timeout</code>
          flow from the main thread to the worker as a typed
          <code class="font-mono text-xs bg-base-300 px-1.5 py-0.5 rounded">cancel</code>
          message. The Observable rejects with a typed
          <code class="font-mono text-xs bg-base-300 px-1.5 py-0.5 rounded"
            >WorkerHttpAbortError</code
          >
          (signal) or
          <code class="font-mono text-xs bg-base-300 px-1.5 py-0.5 rounded"
            >WorkerHttpTimeoutError</code
          >
          (timeout) — the caller can branch on
          <code class="font-mono text-xs bg-base-300 px-1.5 py-0.5 rounded">instanceof</code>.
        </p>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <button
            (click)="startSlowRequest()"
            [disabled]="cancelStatus() === 'running'"
            class="btn btn-primary btn-sm"
          >
            @if (cancelStatus() === 'running') {
              <span class="loading loading-spinner loading-xs"></span>
            }
            Start 5 s request
          </button>
          <button
            (click)="abortCurrent()"
            [disabled]="cancelStatus() !== 'running' || !currentAbortController"
            class="btn btn-error btn-sm"
          >
            Abort (signal)
          </button>
          <button
            (click)="startWithTimeout(500)"
            [disabled]="cancelStatus() === 'running'"
            class="btn btn-warning btn-sm"
          >
            Run with 500 ms timeout
          </button>
          <button
            (click)="failFastAlreadyAborted()"
            [disabled]="cancelStatus() === 'running'"
            class="btn btn-secondary btn-sm"
          >
            Fail-fast (pre-aborted)
          </button>
        </div>

        @if (cancelResult()) {
          <div class="p-3 rounded-lg font-mono text-xs break-all" [class]="cancelResultClass()">
            {{ cancelResult() }}
          </div>
        }
      </div>

      <!-- HttpBackend Demo -->
      <div class="bg-base-200 border border-base-300 rounded-xl p-6 col-span-full mt-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold text-base-content m-0 flex items-center gap-2">
            🔀 HttpBackend
          </h2>
          <span class="badge badge-success">New in v0.3.0</span>
        </div>
        <p class="text-sm text-base-content/80 mb-4">
          <code class="font-mono text-xs bg-base-300 px-1.5 py-0.5 rounded">WorkerHttpBackend</code>
          routes real HTTP requests off the main thread via
          <code class="font-mono text-xs bg-base-300 px-1.5 py-0.5 rounded"
            >provideWorkerHttpClient()</code
          >. The live demo calls JSONPlaceholder via the
          <code class="font-mono text-xs bg-base-300 px-1.5 py-0.5 rounded"
            >http-api.worker.js</code
          >
          using
          <code class="font-mono text-xs bg-base-300 px-1.5 py-0.5 rounded"
            >createWorkerPipeline()</code
          >
          with retry + cache interceptors.
        </p>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Live HTTP via Worker -->
          <div>
            <p class="text-xs font-bold uppercase tracking-wider text-base-content/50 mb-2">
              Live HTTP Call via Worker
            </p>
            <div class="flex flex-wrap gap-2 mb-4">
              <button
                (click)="fetchViaWorker('https://jsonplaceholder.typicode.com/todos/1')"
                [disabled]="backendStatus() === 'running'"
                class="btn btn-success btn-sm"
              >
                @if (backendStatus() === 'running') {
                  <span class="loading loading-spinner loading-xs"></span>
                }
                GET /todos/1
              </button>
              <button
                (click)="fetchViaWorker('https://jsonplaceholder.typicode.com/users/1')"
                [disabled]="backendStatus() === 'running'"
                class="btn btn-ghost btn-sm"
              >
                GET /users/1
              </button>
            </div>
            @if (backendResult()) {
              <div class="p-3 bg-base-300 rounded-lg font-mono text-xs overflow-auto max-h-40">
                <span class="text-success">Response ({{ backendTime() }}ms):</span>
                <br />
                {{ backendResult() }}
              </div>
            }
          </div>

          <!-- URL Routing Simulation -->
          <div>
            <p class="text-xs font-bold uppercase tracking-wider text-base-content/50 mb-2">
              URL Routing Simulation
            </p>
            <p class="text-xs text-base-content/60 mb-3">
              <code class="font-mono">matchWorkerRoute()</code> resolves which worker handles each
              URL.
            </p>
            <div class="space-y-1">
              @for (entry of routingResults(); track entry.url) {
                <div class="flex items-center gap-2 text-xs font-mono p-2 bg-base-300 rounded">
                  <span class="text-base-content/60 flex-1 truncate">{{ entry.url }}</span>
                  <span class="text-xs">→</span>
                  @if (entry.worker) {
                    <span class="badge badge-xs badge-primary">{{ entry.worker }}</span>
                  } @else {
                    <span class="badge badge-xs badge-ghost">main-thread</span>
                  }
                </div>
              }
            </div>
          </div>
        </div>
      </div>

      <!-- Activity Log -->
      <div class="mt-8 bg-base-200 border border-base-300 rounded-xl p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold text-base-content m-0">Activity Log</h2>
          <button
            (click)="clearLogs()"
            class="btn btn-ghost btn-sm"
            [disabled]="logs().length === 0"
          >
            Clear
          </button>
        </div>

        @if (logs().length === 0) {
          <p class="text-sm text-base-content/40 text-center py-8">
            No activity yet. Try the demos above!
          </p>
        } @else {
          <div class="space-y-2 max-h-64 overflow-y-auto">
            @for (entry of logs(); track entry.id) {
              <div
                class="flex items-center gap-3 p-3 rounded-lg text-sm"
                [class.bg-success/10]="entry.type === 'success'"
                [class.border-l-4]="true"
                [class.border-success]="entry.type === 'success'"
                [class.border-error]="entry.type === 'error'"
                [class.border-info]="entry.type === 'info'"
              >
                <span class="text-xs font-mono text-base-content/40">{{ entry.time }}</span>
                <span class="badge badge-xs badge-primary">{{ entry.section }}</span>
                <span class="flex-1 break-all">{{ entry.message }}</span>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class WorkerHttpDemoComponent implements OnDestroy {
  // --- Transport state ---
  protected readonly transportStatus = signal<'idle' | 'running' | 'done' | 'error'>('idle');
  protected readonly transportResult = signal<string>('');
  protected readonly transportTime = signal<number>(0);
  private transport: WorkerTransport<unknown, unknown> | null = null;

  // --- Backend state ---
  protected readonly backendStatus = signal<'idle' | 'running' | 'done' | 'error'>('idle');
  protected readonly backendResult = signal<string>('');
  protected readonly backendTime = signal<number>(0);
  protected readonly routingResults = signal(
    ROUTING_TEST_URLS.map((url) => ({ url, worker: matchWorkerRoute(url, DEMO_ROUTES) })),
  );
  private backendTransport: WorkerTransport<unknown, unknown> | null = null;

  // --- Crypto state ---
  protected readonly hmacSignature = signal<string>('');
  protected readonly hmacVerified = signal<boolean | null>(null);
  protected readonly hashResult = signal<string>('');
  protected readonly encryptedHex = signal<string>('');
  protected readonly decryptedText = signal<string>('');
  private hmacSigner: HmacSigner | null = null;
  private contentHasher: ContentHasher | null = null;
  private aesEncryptor: AesEncryptor | null = null;
  private lastEncrypted: EncryptedPayload | null = null;

  // --- Cancellation state ---
  protected readonly cancelStatus = signal<'idle' | 'running' | 'done' | 'error'>('idle');
  protected readonly cancelResult = signal<string>('');
  protected readonly cancelResultClass = signal<string>('bg-base-300');
  /** Public so the template can disable the abort button when there's nothing to abort. */
  protected currentAbortController: AbortController | null = null;

  // --- Shared log ---
  protected readonly logs = signal<LogEntry[]>([]);
  private logCounter = 0;

  // ──────────────────────────────────────────────────────
  // Backend (HttpBackend) tests
  // ──────────────────────────────────────────────────────

  fetchViaWorker(url: string): void {
    this.backendStatus.set('running');
    this.backendResult.set('');
    const start = performance.now();

    if (!this.backendTransport) {
      this.backendTransport = createWorkerTransport({
        workerUrl: HTTP_API_WORKER_URL,
        maxInstances: 1,
        // Configure the worker pipeline from the main thread — same shape that
        // `withWorkerInterceptors([...])` posts when used via Angular DI.
        initMessage: {
          type: 'init-interceptors',
          specs: [
            { kind: 'logging' },
            { kind: 'retry', config: { maxRetries: 2, initialDelay: 500 } },
            { kind: 'cache', config: { ttl: 30000, maxEntries: 50 } },
          ],
        },
      });
    }

    const request = {
      method: 'GET',
      url,
      headers: {},
      params: {},
      body: null,
      responseType: 'json',
      withCredentials: false,
      context: {},
    };

    (this.backendTransport as WorkerTransport<unknown, SerializableResponse>)
      .execute(request)
      .subscribe({
        next: (res) => {
          const elapsed = Math.round(performance.now() - start);
          this.backendTime.set(elapsed);
          this.backendResult.set(JSON.stringify(res.body, null, 2));
          this.backendStatus.set('done');
          this.log('Backend', `GET ${url} → ${res.status} in ${elapsed}ms`, 'success');
        },
        error: (err) => {
          this.backendStatus.set('error');
          this.backendResult.set(String(err));
          this.log('Backend', `Error fetching ${url}: ${err}`, 'error');
        },
      });
  }

  // ──────────────────────────────────────────────────────
  // Transport tests
  // ──────────────────────────────────────────────────────

  sendEcho(): void {
    this.transportStatus.set('running');
    this.transportResult.set('');
    const start = performance.now();

    if (!this.transport) {
      this.transport = createWorkerTransport({
        workerUrl: ECHO_WORKER_URL,
        maxInstances: 1,
      });
    }

    this.transport.execute({ message: 'Hello from main thread', delay: 200 }).subscribe({
      next: (result) => {
        const elapsed = Math.round(performance.now() - start);
        this.transportTime.set(elapsed);
        this.transportResult.set(JSON.stringify(result, null, 2));
        this.transportStatus.set('done');
        this.log('Transport', `Echo response received in ${elapsed}ms`, 'success');
      },
      error: (err) => {
        this.transportStatus.set('error');
        this.transportResult.set(String(err));
        this.log('Transport', `Error: ${err}`, 'error');
      },
    });
  }

  sendPoolBurst(): void {
    if (this.transport) {
      this.transport.terminate();
    }
    this.transport = createWorkerTransport({
      workerUrl: ECHO_WORKER_URL,
      maxInstances: 4,
    });

    this.transportStatus.set('running');
    const start = performance.now();
    let completed = 0;
    const total = 8;

    for (let i = 0; i < total; i++) {
      this.transport.execute({ index: i, delay: 100 + Math.random() * 200 }).subscribe({
        next: () => {
          completed++;
          if (completed === total) {
            const elapsed = Math.round(performance.now() - start);
            this.transportTime.set(elapsed);
            this.transportResult.set(`${total} requests completed via 4-worker pool`);
            this.transportStatus.set('done');
            this.log(
              'Transport',
              `Pool burst: ${total} requests in ${elapsed}ms (4 workers)`,
              'success',
            );
          }
        },
        error: (err) => {
          this.transportStatus.set('error');
          this.log('Transport', `Pool error: ${err}`, 'error');
        },
      });
    }
  }

  // ──────────────────────────────────────────────────────
  // Crypto tests — HMAC
  // ──────────────────────────────────────────────────────

  async initHmacAndSign(): Promise<void> {
    try {
      const keyMaterial = new TextEncoder().encode('demo-secret-key-for-hmac-256');
      this.hmacSigner = await createHmacSigner({ keyMaterial, algorithm: 'SHA-256' });
      const payload = 'GET:/api/users:' + Date.now();
      const hex = await this.hmacSigner.signHex(payload);
      this.hmacSignature.set(hex);
      this.hmacVerified.set(null);
      this.log('HMAC', `Signed payload (${hex.substring(0, 16)}...)`, 'success');
    } catch (err) {
      this.log('HMAC', `Error: ${err}`, 'error');
    }
  }

  async verifyHmac(): Promise<void> {
    if (!this.hmacSigner || !this.hmacSignature()) {
      this.log('HMAC', 'Sign first before verifying', 'error');
      return;
    }
    try {
      const payload = 'GET:/api/users:' + Date.now();
      const signatureBuffer = await this.hmacSigner.sign(payload);
      const valid = await this.hmacSigner.verify(payload, signatureBuffer);
      this.hmacVerified.set(valid);
      this.log('HMAC', `Verification: ${valid ? 'VALID' : 'INVALID'}`, valid ? 'success' : 'error');
    } catch (err) {
      this.log('HMAC', `Verify error: ${err}`, 'error');
    }
  }

  // ──────────────────────────────────────────────────────
  // Crypto tests — SHA-256 Hashing
  // ──────────────────────────────────────────────────────

  async hashContent(): Promise<void> {
    try {
      this.contentHasher ??= createContentHasher('SHA-256');
      const data = 'Response body content to verify integrity — ' + Date.now();
      const hex = await this.contentHasher.hashHex(data);
      this.hashResult.set(hex);
      this.log('Hash', `SHA-256: ${hex.substring(0, 20)}...`, 'success');
    } catch (err) {
      this.log('Hash', `Error: ${err}`, 'error');
    }
  }

  // ──────────────────────────────────────────────────────
  // Crypto tests — AES Encryption
  // ──────────────────────────────────────────────────────

  async encryptData(): Promise<void> {
    try {
      if (!this.aesEncryptor) {
        const keyMaterial = new TextEncoder().encode('32-byte-secret-key-for-aes-256!!');
        this.aesEncryptor = await createAesEncryptor({ keyMaterial, algorithm: 'AES-GCM' });
      }
      const plaintext = 'Sensitive payload: user_id=42&token=abc123';
      const encrypted = await this.aesEncryptor.encrypt(plaintext);
      this.lastEncrypted = encrypted;
      const hex = [...new Uint8Array(encrypted.ciphertext)]
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      this.encryptedHex.set(hex);
      this.decryptedText.set('');
      this.log('AES', `Encrypted (${hex.substring(0, 20)}...)`, 'success');
    } catch (err) {
      this.log('AES', `Encrypt error: ${err}`, 'error');
    }
  }

  async decryptData(): Promise<void> {
    if (!this.aesEncryptor || !this.lastEncrypted) {
      this.log('AES', 'Encrypt first', 'error');
      return;
    }
    try {
      const decrypted = await this.aesEncryptor.decrypt(this.lastEncrypted);
      const text = new TextDecoder().decode(decrypted);
      this.decryptedText.set(text);
      this.log('AES', `Decrypted: "${text}"`, 'success');
    } catch (err) {
      this.log('AES', `Decrypt error: ${err}`, 'error');
    }
  }

  // ──────────────────────────────────────────────────────
  // Cancellation tests
  // ──────────────────────────────────────────────────────

  private getCancelTransport(): WorkerTransport<unknown, unknown> {
    if (!this.transport) {
      this.transport = createWorkerTransport({
        workerUrl: ECHO_WORKER_URL,
        maxInstances: 1,
      });
    }
    return this.transport;
  }

  startSlowRequest(): void {
    this.cancelStatus.set('running');
    this.cancelResult.set('');
    const ac = new AbortController();
    this.currentAbortController = ac;
    const start = performance.now();

    this.getCancelTransport()
      .execute({ message: 'slow', delay: 5000 }, { signal: ac.signal })
      .subscribe({
        next: () => {
          const elapsed = Math.round(performance.now() - start);
          this.cancelStatus.set('done');
          this.cancelResultClass.set('bg-success/10 text-success');
          this.cancelResult.set(`✅ Completed in ${elapsed}ms (no abort)`);
          this.currentAbortController = null;
          this.log('Cancel', `Slow request completed in ${elapsed}ms`, 'success');
        },
        error: (err) => this.handleCancelError(err, start),
      });
    this.log('Cancel', 'Started 5 s request — click "Abort" to cancel', 'info');
  }

  abortCurrent(): void {
    if (!this.currentAbortController) return;
    this.currentAbortController.abort('user clicked abort');
  }

  startWithTimeout(timeoutMs: number): void {
    this.cancelStatus.set('running');
    this.cancelResult.set('');
    this.currentAbortController = null;
    const start = performance.now();

    this.getCancelTransport()
      .execute({ message: 'slow', delay: 5000 }, { timeout: timeoutMs })
      .subscribe({
        next: () => {
          this.cancelStatus.set('done');
          this.cancelResultClass.set('bg-success/10 text-success');
          this.cancelResult.set('✅ Completed before timeout');
        },
        error: (err) => this.handleCancelError(err, start),
      });
    this.log('Cancel', `Started request with ${timeoutMs} ms timeout`, 'info');
  }

  failFastAlreadyAborted(): void {
    this.cancelStatus.set('running');
    this.cancelResult.set('');
    const ac = new AbortController();
    ac.abort('preempted');
    this.currentAbortController = null;
    const start = performance.now();

    this.getCancelTransport()
      .execute({ message: 'never', delay: 5000 }, { signal: ac.signal })
      .subscribe({
        next: () => {
          /* unreachable */
        },
        error: (err) => this.handleCancelError(err, start),
      });
  }

  private handleCancelError(err: unknown, start: number): void {
    const elapsed = Math.round(performance.now() - start);
    this.currentAbortController = null;
    this.cancelStatus.set('error');

    if (err instanceof WorkerHttpAbortError) {
      this.cancelResultClass.set('bg-warning/10 text-warning');
      this.cancelResult.set(
        `🛑 WorkerHttpAbortError after ${elapsed}ms — reason: ${String(err.reason)}`,
      );
      this.log('Cancel', `Aborted via signal in ${elapsed}ms (${String(err.reason)})`, 'info');
      return;
    }
    if (err instanceof WorkerHttpTimeoutError) {
      this.cancelResultClass.set('bg-error/10 text-error');
      this.cancelResult.set(
        `⏱️ WorkerHttpTimeoutError after ${elapsed}ms (timeoutMs=${err.timeoutMs})`,
      );
      this.log('Cancel', `Timed out after ${err.timeoutMs}ms`, 'error');
      return;
    }
    this.cancelResultClass.set('bg-error/10 text-error');
    this.cancelResult.set(`❌ ${String(err)}`);
    this.log('Cancel', `Unexpected error: ${String(err)}`, 'error');
  }

  // ──────────────────────────────────────────────────────
  // Utilities
  // ──────────────────────────────────────────────────────

  clearLogs(): void {
    this.logs.set([]);
  }

  private log(section: string, message: string, type: LogEntry['type']): void {
    const time = new Date().toLocaleTimeString('en-US', {
      hour12: false,
      fractionalSecondDigits: 3,
    });
    const id = this.logCounter++;
    this.logs.update((prev) => [{ id, time, section, message, type }, ...prev]);
  }

  ngOnDestroy(): void {
    this.transport?.terminate();
    this.backendTransport?.terminate();
  }
}
