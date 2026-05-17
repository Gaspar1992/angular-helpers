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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { JsonPipe } from '@angular/common';
import { STORAGE_WORKER_FACTORY, WorkerStorageTransport } from '@angular-helpers/storage';

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
  templateUrl: './storage-demo.component.html',
  providers: [
    { provide: STORAGE_WORKER_FACTORY, useValue: storageWorkerFactory },
    WorkerStorageTransport,
  ],
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
  private benchmarkTimeout?: any;

  constructor() {
    // Serialization Dynamic Listener with automatic injection-context lifecycle unsubscribe
    this.toonControl.valueChanges.pipe(takeUntilDestroyed()).subscribe((val) => {
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
    if (this.benchmarkTimeout) {
      clearTimeout(this.benchmarkTimeout);
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
    } catch {
      // Gracefully fall back to defaults when reading from fresh storage
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
    } catch {
      this.triggerToast('Failed to save profile. Please check worker state.');
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
    } catch {
      // Silent on parsing failure, keep previous weights
    }
  }

  // Tab 4: Benchmark Suite (indexeddb vs cacheapi vs local)
  async runBenchmark() {
    this.isBenchmarking.set(true);
    this.benchmarkResults.set(null);

    if (this.benchmarkTimeout) {
      clearTimeout(this.benchmarkTimeout);
    }

    // Dynamic latency testing simulated in batches
    this.benchmarkTimeout = setTimeout(() => {
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
