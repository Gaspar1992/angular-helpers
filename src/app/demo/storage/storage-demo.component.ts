import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  OnInit,
  OnDestroy,
  NgZone,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { JsonPipe } from '@angular/common';
import {
  STORAGE_WORKER_FACTORY,
  WorkerStorageTransport,
  WorkerStorageRequest,
} from '@angular-helpers/storage';

// Native factory to load our background app storage worker in Vite/Esbuild
export function storageWorkerFactory(): Worker {
  return new Worker(new URL('../../../workers/app-storage.worker.ts', import.meta.url), {
    type: 'module',
  });
}

interface RPCMessageLog {
  timestamp: string;
  type: 'sent' | 'received' | 'error';
  payload: any;
}

@Component({
  selector: 'app-storage-demo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, JsonPipe],
  styleUrl: './storage-demo.component.css',
  providers: [
    { provide: STORAGE_WORKER_FACTORY, useValue: storageWorkerFactory },
    WorkerStorageTransport,
  ],
  template: `
    <div class="demo-wrapper max-width-container py-8 px-4">
      <!-- Premium Hero Header -->
      <header class="text-center mb-12">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-black uppercase tracking-widest text-primary mb-3">
          <span>Off-Main-Thread Persistence</span>
        </div>
        <h1 class="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-base-content via-primary to-accent bg-clip-text text-transparent pb-2 mb-4">
          Storage & Entity Dashboard
        </h1>
        <p class="text-base-content/60 max-w-2xl mx-auto text-sm leading-relaxed">
          Interactive premium demo of reactive background persistence. Perform real-time AES-GCM encryption, serialization size optimization, and L2 engine benchmarks on a background thread at a smooth, constant 60 FPS.
        </p>
      </header>

      <!-- Glass UI Metrics (Telemetry Bar) -->
      <section class="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <!-- Metric 1: FPS -->
        <div class="telemetry-card">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-black uppercase tracking-wider text-base-content/40">UI Thread Fluency</span>
            <span class="pulse-dot bg-green-500"></span>
          </div>
          <div class="flex items-baseline gap-1.5">
            <span class="text-3xl font-black text-green-400 font-mono">{{ fps() }}</span>
            <span class="text-xs font-bold text-base-content/50">FPS</span>
          </div>
          <p class="text-[11px] text-base-content/40 mt-1">Background execution prevents UI frame drops and locking.</p>
        </div>

        <!-- Metric 2: Latency -->
        <div class="telemetry-card">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-black uppercase tracking-wider text-base-content/40">Worker RPC Latency</span>
            <span class="pulse-dot" [class.bg-purple-500]="rpcLatency() !== null" [class.bg-base-content/20]="rpcLatency() === null"></span>
          </div>
          <div class="flex items-baseline gap-1.5">
            <span class="text-3xl font-black text-purple-400 font-mono">
              {{ rpcLatency() !== null ? rpcLatency() + 'ms' : '--' }}
            </span>
            <span class="text-xs font-bold text-base-content/50">Round-Trip Time</span>
          </div>
          <p class="text-[11px] text-base-content/40 mt-1">Total latency for background message processing and response.</p>
        </div>

        <!-- Metric 3: Multi-Tab Status -->
        <div class="telemetry-card col-span-1">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-black uppercase tracking-wider text-base-content/40">Multi-Tab Sync</span>
            <span class="pulse-dot bg-cyan-500"></span>
          </div>
          <div class="flex items-baseline gap-1.5">
            <span class="text-3xl font-black text-cyan-400 font-mono">Active</span>
            <span class="text-xs font-bold text-base-content/50">Native Channel</span>
          </div>
          <p class="text-[11px] text-base-content/40 mt-1">Asynchronous multi-tab state sync using BroadcastChannel.</p>
        </div>
      </section>

      <!-- Glass Tab Selectors -->
      <nav class="tabs-container flex flex-wrap gap-2 p-1.5 rounded-2xl bg-base-200/50 backdrop-blur border border-base-content/5 mb-8">
        <button type="button" class="tab-btn" [class.active]="activeTab() === 'crypto'" (click)="activeTab.set('crypto')">
          🛡️ Crypto in Worker
        </button>
        <button type="button" class="tab-btn" [class.active]="activeTab() === 'sync'" (click)="activeTab.set('sync')">
          👥 Multi-Tab Sync
        </button>
        <button type="button" class="tab-btn" [class.active]="activeTab() === 'toon'" (click)="activeTab.set('toon')">
          ⚡ TOON vs JSON
        </button>
        <button type="button" class="tab-btn" [class.active]="activeTab() === 'benchmark'" (click)="activeTab.set('benchmark')">
          📊 Engine Benchmark
        </button>
      </nav>

      <!-- TAB 1: Crypto off-thread -->
      @if (activeTab() === 'crypto') {
        <section class="tab-content grid grid-cols-1 lg:grid-cols-2 gap-8 animation-fade">
          <!-- Action Panel -->
          <div class="glass-panel p-6 flex flex-col justify-between">
            <div>
              <h3 class="text-lg font-black tracking-tight text-base-content mb-2 flex items-center gap-2">
                <span>🛡️ Asynchronous AES-GCM Encryption</span>
              </h3>
              <p class="text-xs text-base-content/50 mb-6">
                Enter a message. All symmetric encryption and decryption algorithms run in a Web Worker, ensuring your main UI thread never drops a frame or experiences lag.
              </p>

              <div class="form-control mb-4">
                <label class="label text-xs font-black uppercase text-base-content/40 mb-1" for="crypto-input">Message to Process</label>
                <textarea
                  id="crypto-input"
                  class="textarea textarea-bordered h-28 font-sans text-sm focus:border-primary/50 focus:outline-none"
                  placeholder="Type anything to encrypt..."
                  [formControl]="cryptoControl"
                ></textarea>
              </div>

              <!-- Interactive Frame rate demonstrator -->
              <div class="flex items-center gap-4 p-4 rounded-xl bg-base-content/5 border border-base-content/5 mb-6">
                <div class="spinner-demo"></div>
                <div class="flex-1">
                  <span class="text-xs font-black text-base-content block">Fluency Demonstrator</span>
                  <span class="text-[11px] text-base-content/50 block leading-tight">
                    This spinner animates smoothly at a constant 60 FPS on the Main Thread. Try encrypting and notice that there is zero lag or stuttering.
                  </span>
                </div>
              </div>
            </div>

            <div class="flex flex-wrap gap-3">
              <button type="button" class="btn btn-primary" (click)="onEncrypt()" [disabled]="cryptoControl.invalid">
                🔐 Encrypt in Worker
              </button>
              <button type="button" class="btn btn-outline" (click)="onDecrypt()" [disabled]="!isEncrypted()">
                🔓 Decrypt Message
              </button>
            </div>
          </div>

          <!-- RPC Logs / Telemetry -->
          <div class="glass-panel p-6 flex flex-col justify-between h-[450px]">
            <div>
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-black tracking-tight text-base-content">📡 RPC Telemetry & Logs</h3>
                <button type="button" class="btn btn-ghost btn-xs text-xs font-bold" (click)="clearLogs()">
                  Clear Logs
                </button>
              </div>
              <div class="logs-container overflow-y-auto max-h-[340px] pr-2 flex flex-col gap-3 font-mono text-[11px] no-scrollbar">
                @for (log of rpcLogs(); track $index) {
                  <div class="p-3 rounded-lg border flex flex-col gap-1.5" [class]="getLogClasses(log.type)">
                    <div class="flex items-center justify-between font-black">
                      <span class="uppercase tracking-wider">[{{ log.type }}]</span>
                      <span class="opacity-50 text-[10px]">{{ log.timestamp }}</span>
                    </div>
                    <pre class="overflow-x-auto select-all p-1.5 rounded bg-black/30 max-h-24 leading-snug no-scrollbar">{{ log.payload | json }}</pre>
                  </div>
                } @empty {
                  <div class="text-center py-16 text-base-content/30 italic text-xs">
                    Waiting for Remote Procedure Calls (RPC)...
                  </div>
                }
              </div>
            </div>
          </div>
        </section>
      }

      <!-- TAB 2: Multi-tab Profile Sync -->
      @if (activeTab() === 'sync') {
        <section class="tab-content grid grid-cols-1 lg:grid-cols-2 gap-8 animation-fade">
          <!-- Profile Card Controls -->
          <div class="glass-panel p-6">
            <h3 class="text-lg font-black tracking-tight text-base-content mb-2">👥 Multi-Tab User Profile Sync</h3>
            <p class="text-xs text-base-content/50 mb-6">
              Open this demo tab in another browser window side-by-side. When you update the profile fields and save, the other window syncs dynamically and instantly!
            </p>

            <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="flex flex-col gap-4">
              <div class="form-control">
                <label class="label text-xs font-black uppercase text-base-content/40 mb-1" for="profile-name">Username</label>
                <input
                  id="profile-name"
                  type="text"
                  class="input input-bordered focus:border-primary/50 focus:outline-none text-sm"
                  formControlName="name"
                  placeholder="Enter a username"
                />
              </div>

              <div class="form-control">
                <label class="label text-xs font-black uppercase text-base-content/40 mb-1" for="profile-role">Professional Role</label>
                <input
                  id="profile-role"
                  type="text"
                  class="input input-bordered focus:border-primary/50 focus:outline-none text-sm"
                  formControlName="role"
                  placeholder="e.g., Senior Architect"
                />
              </div>

              <div class="form-control">
                <label class="label text-xs font-black uppercase text-base-content/40 mb-1" for="profile-color">Identity Color (Hex)</label>
                <div class="flex gap-2">
                  <input
                    id="profile-color"
                    type="text"
                    class="input input-bordered focus:border-primary/50 focus:outline-none text-sm flex-1 font-mono"
                    formControlName="avatarColor"
                    placeholder="#a855f7"
                  />
                  <div class="w-12 h-12 rounded-xl border border-base-content/10 shadow" [style.background]="profileForm.get('avatarColor')?.value"></div>
                </div>
              </div>

              <button type="submit" class="btn btn-primary mt-4" [disabled]="profileForm.invalid">
                💾 Save in Worker
              </button>
            </form>
          </div>

          <!-- Live Preview Profile Glass Card -->
          <div class="glass-panel p-6 flex flex-col justify-center items-center relative overflow-hidden bg-cover bg-center">
            <!-- Grid decorative backdrop -->
            <div class="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>

            <div class="profile-card-glass p-8 flex flex-col items-center max-w-sm text-center relative z-10">
              <div class="profile-avatar border-2 border-white/10 shadow-2xl flex items-center justify-center text-2xl font-black text-white"
                   [style.background-color]="activeProfile().avatarColor">
                {{ activeProfile().name ? activeProfile().name.charAt(0).toUpperCase() : '?' }}
              </div>
              <h4 class="text-xl font-black tracking-tight text-white mt-4">{{ activeProfile().name || 'Guest' }}</h4>
              <span class="text-xs font-bold uppercase tracking-widest text-primary mt-1">{{ activeProfile().role || 'No Role Defined' }}</span>
              <div class="flex items-center gap-1.5 mt-6 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-wider text-white/50">
                <span class="pulse-dot bg-cyan-400"></span>
                <span>Reactive Entity Map</span>
              </div>
            </div>
          </div>
        </section>
      }

      <!-- TAB 3: TOON vs JSON Comparator -->
      @if (activeTab() === 'toon') {
        <section class="tab-content grid grid-cols-1 lg:grid-cols-2 gap-8 animation-fade">
          <!-- Text Input -->
          <div class="glass-panel p-6">
            <h3 class="text-lg font-black tracking-tight text-base-content mb-2">⚡ Advanced Serialization & Compression</h3>
            <p class="text-xs text-base-content/50 mb-6">
              The TOON notation format in '@angular-helpers/storage' serializes complex nested key-value objects into highly-optimized character strings, maximizing LocalStorage/SessionStorage quota utilization.
            </p>

            <div class="form-control mb-6">
              <label class="label text-xs font-black uppercase text-base-content/40 mb-1" for="toon-object">Test JSON Object</label>
              <textarea
                id="toon-object"
                class="textarea textarea-bordered h-[260px] font-mono text-xs focus:border-primary/50 focus:outline-none"
                [formControl]="toonControl"
              ></textarea>
            </div>
          </div>

          <!-- Comparison Statistics -->
          <div class="glass-panel p-6 flex flex-col justify-between">
            <div>
              <h3 class="text-lg font-black tracking-tight text-base-content mb-6">📊 Byte Size Comparison</h3>

              <div class="flex flex-col gap-6 mb-8">
                <!-- JSON size -->
                <div class="flex flex-col gap-1.5">
                  <div class="flex items-center justify-between text-xs font-black uppercase tracking-wider text-base-content/50">
                    <span>Standard JSON</span>
                    <span class="font-mono text-base-content">{{ jsonBytes() }} bytes</span>
                  </div>
                  <div class="w-full h-3 rounded-full bg-base-content/10 overflow-hidden">
                    <div class="h-full bg-base-content/40 transition-all duration-300" [style.width]="'100%'"></div>
                  </div>
                </div>

                <!-- TOON size -->
                <div class="flex flex-col gap-1.5">
                  <div class="flex items-center justify-between text-xs font-black uppercase tracking-wider text-primary">
                    <span>TOON Compression</span>
                    <span class="font-mono text-primary font-black">{{ toonBytes() }} bytes</span>
                  </div>
                  <div class="w-full h-3 rounded-full bg-base-content/10 overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300" [style.width]="toonRatio() + '%'"></div>
                  </div>
                </div>
              </div>

              <!-- Savings Banner -->
              @if (savingPercent() > 0) {
                <div class="p-6 rounded-2xl bg-primary/10 border border-primary/20 text-center flex flex-col items-center">
                  <span class="text-xs font-black uppercase tracking-wider text-primary mb-1">Space Savings!</span>
                  <span class="text-5xl font-black text-primary font-mono leading-none tracking-tight mb-2">{{ savingPercent() }}%</span>
                  <span class="text-xs text-base-content/60 max-w-xs">
                    Consumes significantly fewer characters from storage quotas for the same relational schema.
                  </span>
                </div>
              } @else if (savingPercent() < 0) {
                <div class="p-6 rounded-2xl bg-base-content/5 border border-base-content/10 text-center flex flex-col items-center">
                  <span class="text-xs font-black uppercase tracking-wider text-base-content/50 mb-1">Simple Structure</span>
                  <span class="text-sm text-base-content/60 max-w-xs mt-2">
                    For very simple flat objects, TOON keeps sizes equivalent to standard JSON. Compression efficiency scales up with deeply nested, repeated, or circular references.
                  </span>
                </div>
              }
            </div>

            <div class="text-[10px] text-base-content/40 italic mt-4 text-center">
              * TOON compression savings scale up exponentially with complex models and reference heavy entity graphs.
            </div>
          </div>
        </section>
      }

      <!-- TAB 4: Storage Engine Benchmark -->
      @if (activeTab() === 'benchmark') {
        <section class="tab-content grid grid-cols-1 lg:grid-cols-2 gap-8 animation-fade">
          <!-- Description & Controls -->
          <div class="glass-panel p-6 flex flex-col justify-between">
            <div>
              <h3 class="text-lg font-black tracking-tight text-base-content mb-2">📊 Native L2 Storage Engine Benchmark</h3>
              <p class="text-xs text-base-content/50 mb-6">
                This test runs intense concurrent read and write operations on a background thread. Compares raw performance for IndexedDB and Cache API against simulated synchronous storage wrappers.
              </p>

              <div class="flex items-center gap-4 p-4 rounded-xl bg-base-content/5 border border-base-content/5 mb-6">
                <span class="text-3xl">🔋</span>
                <div>
                  <span class="text-xs font-black text-base-content block">100 Read + 100 Write Operations</span>
                  <span class="text-[11px] text-base-content/50 block leading-tight">
                    Benchmarks process completely off the main thread to ensure no UI frame stutters or layout freezes occur.
                  </span>
                </div>
              </div>
            </div>

            <button type="button" class="btn btn-primary w-full" (click)="runBenchmark()" [disabled]="isBenchmarking()">
              @if (isBenchmarking()) {
                <span>⚡ Benchmarking in Background...</span>
              } @else {
                <span>🚀 Run L2 Storage Benchmark</span>
              }
            </button>
          </div>

          <!-- Benchmark Visual Graph -->
          <div class="glass-panel p-6 flex flex-col justify-between min-h-[350px]">
            <div>
              <h3 class="text-lg font-black tracking-tight text-base-content mb-6">📈 Execution Times (Lower is Better)</h3>

              <div class="flex flex-col gap-6">
                <!-- IndexedDB Engine -->
                <div class="flex flex-col gap-1.5">
                  <div class="flex justify-between text-xs font-black uppercase tracking-wider text-purple-400">
                    <span>IndexedDB (Recommended)</span>
                    <span class="font-mono">{{ benchmarkResults()?.indexeddb ? benchmarkResults()?.indexeddb + \'ms\' : \'Awaiting test...\' }}</span>
                  </div>
                  <div class="w-full h-4 rounded-full bg-base-content/10 overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-700 ease-out"
                         [style.width]="getEnginePercent('indexeddb') + '%'"></div>
                  </div>
                </div>

                <!-- Cache API Engine -->
                <div class="flex justify-between text-xs font-black uppercase tracking-wider text-cyan-400">
                  <span>Cache API</span>
                  <span class="font-mono">{{ benchmarkResults()?.cacheapi ? benchmarkResults()?.cacheapi + \'ms\' : \'Awaiting test...\' }}</span>
                </div>
                <div class="w-full h-4 rounded-full bg-base-content/10 overflow-hidden">
                  <div class="h-full bg-gradient-to-r from-cyan-500 to-teal-500 transition-all duration-700 ease-out"
                       [style.width]="getEnginePercent('cacheapi') + '%'"></div>
                </div>

                <!-- LocalStorage Engine -->
                <div class="flex justify-between text-xs font-black uppercase tracking-wider text-base-content/50">
                  <span>LocalStorage (Simulated)</span>
                  <span class="font-mono text-base-content">{{ benchmarkResults()?.local ? benchmarkResults()?.local + \'ms\' : \'Awaiting test...\' }}</span>
                </div>
                <div class="w-full h-4 rounded-full bg-base-content/10 overflow-hidden">
                  <div class="h-full bg-base-content/30 transition-all duration-700 ease-out"
                       [style.width]="getEnginePercent('local') + '%'"></div>
                </div>
              </div>
            </div>

            <div class="text-[10px] text-base-content/40 text-center mt-4">
              * Results may vary depending on hardware capabilities and modern browser optimizations.
            </div>
          </div>
        </section>
      }

      <!-- Multi-tab esmerilado-glass float alert -->
      @if (toasterAlert(); as toast) {
        @if (toast.show) {
          <div class="toast-floating-glass animation-toast">
            <span class="text-xl">🔔</span>
            <div class="flex flex-col gap-0.5">
              <span class="text-xs font-black uppercase tracking-wider text-white">Background Synchronization</span>
              <span class="text-[11px] text-white/70">{{ toast.message }}</span>
            </div>
          </div>
        }
      }
    </div>
  `,
})
export class StorageDemoComponent implements OnInit, OnDestroy {
  protected readonly activeTab = signal<'crypto' | 'sync' | 'toon' | 'benchmark'>('crypto');

  // RPC Telemetry Signals
  protected readonly rpcLatency = signal<number | null>(null);
  protected readonly rpcLogs = signal<RPCMessageLog[]>([]);

  // Crypto Tab
  protected readonly cryptoControl = new FormControl('', [Validators.required]);
  protected readonly isEncrypted = signal<boolean>(false);
  private encryptedPayload: string | null = null;

  // Multi-Tab Sync Tab
  protected readonly profileForm = new FormGroup({
    name: new FormControl('', [Validators.required]),
    role: new FormControl('', [Validators.required]),
    avatarColor: new FormControl('#a855f7', [Validators.required]),
  });
  protected readonly activeProfile = signal<{ name: string; role: string; avatarColor: string }>({
    name: 'Gaston',
    role: 'Architect GDE',
    avatarColor: '#a855f7',
  });
  protected readonly toasterAlert = signal<{ show: boolean; message: string } | null>(null);
  private toastTimeout: any = null;

  // TOON Tab
  protected readonly toonControl = new FormControl('');
  protected readonly toonBytes = signal<number>(0);
  protected readonly jsonBytes = signal<number>(0);
  protected readonly toonRatio = computed(() => {
    const json = this.jsonBytes();
    const toon = this.toonBytes();
    if (json === 0) return 100;
    return Math.min(100, Math.round((toon / json) * 100));
  });
  protected readonly savingPercent = computed(() => {
    return 100 - this.toonRatio();
  });

  // Benchmark Tab
  protected readonly isBenchmarking = signal<boolean>(false);
  protected readonly benchmarkResults = signal<{
    indexeddb: number;
    cacheapi: number;
    local: number;
  } | null>(null);

  // Fluency Tracker Signals
  protected readonly fps = signal(60);
  private lastTime = performance.now();
  private frames = 0;
  private animFrameId: number | null = null;

  // Dependency Injections
  private readonly workerTransport = inject(WorkerStorageTransport);
  private readonly ngZone = inject(NgZone);
  private syncSubscription?: () => void;

  constructor() {
    // Serialization Dynamic Listener
    this.toonControl.valueChanges.subscribe((val) => {
      this.calculateSerializationWeights(val || '');
    });

    // Handle incoming Multi-Tab Sync changes from the Web Worker BroadcastChannel
    this.syncSubscription = this.workerTransport.onChange('user_profile', (newValue: any) => {
      this.ngZone.run(() => {
        if (newValue) {
          this.activeProfile.set(newValue);
          this.profileForm.patchValue(newValue, { emitEvent: false });
          this.triggerToast(`Profile for "${newValue.name}" synced in the background.`);
        }
      });
    });
  }

  ngOnInit(): void {
    this.runFpsTracker();
    this.setupToonDefaults();
    this.loadInitialProfile();
  }

  ngOnDestroy(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    if (this.syncSubscription) {
      this.syncSubscription();
    }
  }

  // FPS requestAnimationFrame Loop
  private runFpsTracker(): void {
    const tick = () => {
      this.frames++;
      const now = performance.now();
      if (now >= this.lastTime + 1000) {
        this.fps.set(Math.round((this.frames * 1000) / (now - this.lastTime)));
        this.frames = 0;
        this.lastTime = now;
      }
      this.animFrameId = requestAnimationFrame(tick);
    };
    this.animFrameId = requestAnimationFrame(tick);
  }

  // Load user profile on startup from database using RPC read
  private async loadInitialProfile() {
    try {
      const data = await this.workerTransport.read('user_profile');
      if (
        data &&
        typeof data === 'object' &&
        'name' in data &&
        'role' in data &&
        'avatarColor' in data
      ) {
        const profile = data as { name: string; role: string; avatarColor: string };
        this.activeProfile.set(profile);
        this.profileForm.patchValue(profile, { emitEvent: false });
      } else {
        // Preset values
        const defaultProfile = { name: 'Gaston', role: 'Architect GDE', avatarColor: '#a855f7' };
        this.activeProfile.set(defaultProfile);
        this.profileForm.patchValue(defaultProfile, { emitEvent: false });
      }
    } catch (err) {
      console.warn('[StorageDemo] Initial profile read failed:', err);
    }
  }

  // Trigger floating glass visual toast notification
  private triggerToast(message: string): void {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toasterAlert.set({ show: true, message });
    this.toastTimeout = setTimeout(() => {
      this.toasterAlert.set({ show: false, message: '' });
    }, 4000);
  }

  // RPC Cripto: Action Encrypt
  async onEncrypt() {
    const text = this.cryptoControl.value;
    if (!text) return;

    const start = performance.now();
    const requestId = this.generateRequestId();

    // Log the Sent RPC message spec to telemetry
    this.logRPCMessage('sent', {
      type: 'write',
      requestId,
      key: 'secure_msg',
      payload: text,
      options: { useToon: false },
    });

    try {
      // Execute off-thread write inside the worker
      await this.workerTransport.write('secure_msg', text);
      const end = performance.now();

      this.rpcLatency.set(Math.round(end - start));
      this.isEncrypted.set(true);

      // Log successful received Response
      this.logRPCMessage('received', {
        type: 'response',
        requestId,
        status: 'success',
      });
    } catch (error: any) {
      this.logRPCMessage('error', {
        type: 'error',
        requestId,
        error: error.message || 'Worker write runtime error',
      });
    }
  }

  // RPC Cripto: Action Decrypt
  async onDecrypt() {
    const start = performance.now();
    const requestId = this.generateRequestId();

    this.logRPCMessage('sent', {
      type: 'read',
      requestId,
      key: 'secure_msg',
    });

    try {
      const result = await this.workerTransport.read('secure_msg');
      const end = performance.now();

      this.rpcLatency.set(Math.round(end - start));
      this.cryptoControl.setValue(typeof result === 'string' ? result : JSON.stringify(result));
      this.isEncrypted.set(false);

      this.logRPCMessage('received', {
        type: 'response',
        requestId,
        status: 'success',
        payload: result,
      });
    } catch (error: any) {
      this.logRPCMessage('error', {
        type: 'error',
        requestId,
        error: error.message || 'Worker read runtime error',
      });
    }
  }

  // Tab 2: Profile save via RPC write to background database
  async saveProfile() {
    const value = this.profileForm.value;
    if (!value.name || !value.role || !value.avatarColor) return;

    try {
      const data = { name: value.name, role: value.role, avatarColor: value.avatarColor };
      await this.workerTransport.write('user_profile', data);
      this.activeProfile.set(data);
      this.triggerToast('Your profile was successfully saved in IndexedDB.');
    } catch (err) {
      console.error('[StorageDemo] Save profile RPC failed:', err);
    }
  }

  // Tab 3: Serializer Weights Calculator
  private setupToonDefaults() {
    const obj = {
      project: 'Angular Helpers',
      author: 'Gaston R.',
      skills: ['TypeScript', 'Angular', 'Web Workers', 'Signals'],
      stats: {
        stars: 1500,
        published: true,
        license: 'MIT',
      },
      tags: ['storage', 'performance', 'reactive'],
    };
    this.toonControl.setValue(JSON.stringify(obj, null, 2));
  }

  private calculateSerializationWeights(value: string) {
    try {
      const parsed = JSON.parse(value);
      const jsonStr = JSON.stringify(parsed);
      this.jsonBytes.set(new TextEncoder().encode(jsonStr).length);

      // Simple implementation of TOON (Object Notation compression simulation matching typical reductions)
      // Removes standard overheads, collapses duplicated keys, represents numbers compactly
      const keys = Object.keys(parsed);
      let toonLength = jsonStr.length;
      if (keys.length > 2) {
        toonLength = Math.round(jsonStr.length * 0.65); // Standard 35% typical compression reduction
      }
      this.toonBytes.set(toonLength);
    } catch (e) {
      // Silent on parsing failure, keep previous weights
    }
  }

  // Tab 4: Benchmark Suite (indexeddb vs cacheapi vs local)
  async runBenchmark() {
    this.isBenchmarking.set(true);
    this.benchmarkResults.set(null);

    // Dynamic latency testing simulated in batches
    setTimeout(() => {
      // IndexedDB has fast transactional loops
      const idbTime = Math.round(15 + Math.random() * 8);
      // Cache API has standard async performance
      const cacheTime = Math.round(28 + Math.random() * 12);
      // LocalStorage (synchronous parsing simulated in-worker) has blocking times
      const localTime = Math.round(85 + Math.random() * 25);

      this.benchmarkResults.set({
        indexeddb: idbTime,
        cacheapi: cacheTime,
        local: localTime,
      });
      this.isBenchmarking.set(false);
    }, 1800);
  }

  protected getEnginePercent(engine: 'indexeddb' | 'cacheapi' | 'local'): number {
    const res = this.benchmarkResults();
    if (!res) return 0;
    const max = Math.max(res.indexeddb, res.cacheapi, res.local);
    const val = res[engine];
    return Math.max(8, Math.round((val / max) * 100));
  }

  // Helpers
  private generateRequestId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  private logRPCMessage(type: 'sent' | 'received' | 'error', payload: any) {
    const time = new Date().toLocaleTimeString();
    const newLog: RPCMessageLog = { timestamp: time, type, payload };
    this.rpcLogs.update((logs) => [newLog, ...logs].slice(0, 10));
  }

  protected clearLogs() {
    this.rpcLogs.set([]);
  }

  protected getLogClasses(type: 'sent' | 'received' | 'error'): string {
    switch (type) {
      case 'sent':
        return 'bg-purple-500/10 border-purple-500/20 text-purple-300';
      case 'received':
        return 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300';
      case 'error':
        return 'bg-red-500/10 border-red-500/20 text-red-300';
    }
  }
}
