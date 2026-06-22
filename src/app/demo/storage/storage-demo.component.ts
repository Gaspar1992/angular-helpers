import {
  Component,
  signal,
  computed,
  inject,
  OnInit,
  OnDestroy,
  NgZone,
  effect,
} from '@angular/core';
import { form, required, disabled, FormRoot, FormField } from '@angular/forms/signals';
import { JsonPipe } from '@angular/common';
import {
  STORAGE_WORKER_FACTORY,
  WorkerStorageTransport,
  injectEntityStore,
  LocalStorageTransport,
} from '@angular-helpers/storage';

// Native factory to load our background app storage worker in Vite/Esbuild
export function storageWorkerFactory(): Worker | undefined {
  if (typeof Worker !== 'undefined') {
    return new Worker(new URL('../../../workers/app-storage.worker.ts', import.meta.url), {
      type: 'module',
    });
  }
  return undefined;
}

interface RPCMessageLog {
  timestamp: string;
  type: 'sent' | 'received' | 'error';
  payload: any;
}

interface TaskEntity {
  id: string;
  title: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
}

@Component({
  selector: 'app-storage-demo',
  imports: [FormField, FormRoot, JsonPipe],
  templateUrl: './storage-demo.component.html',
  providers: [
    { provide: STORAGE_WORKER_FACTORY, useValue: storageWorkerFactory },
    WorkerStorageTransport,
  ],
})
export class StorageDemoComponent implements OnInit, OnDestroy {
  protected readonly activeTab = signal<'crypto' | 'sync' | 'toon' | 'benchmark' | 'entities'>(
    'crypto',
  );

  // Entity Store Tab
  protected readonly taskStore = injectEntityStore<string, TaskEntity>({
    idKey: 'id',
    persistKey: 'tasks_list',
    storageOptions: {
      storageType: 'indexeddb',
      dbName: 'ah_db',
      storeName: 'kv',
    },
  });

  protected readonly taskModel = signal({
    id: '',
    title: '',
    category: 'Work',
    priority: 'medium' as 'low' | 'medium' | 'high',
    completed: false,
  });

  protected readonly taskForm = form(this.taskModel, (p) => {
    required(p.id);
    required(p.title);
    required(p.category);
    required(p.priority);
    disabled(p.id, { when: () => true });
  });

  protected readonly selectedTaskId = signal<string | null>(null);
  protected readonly selectedTaskSignal = computed(() => {
    const id = this.selectedTaskId();
    return id ? this.taskStore.entitySignal(id)() : undefined;
  });

  // Direct Multi-Entry Tab properties
  protected readonly directEntries = signal<{ key: string; value: any }[]>([]);
  protected readonly isDirectLoading = signal<boolean>(false);

  // RPC Telemetry Signals
  protected readonly rpcLatency = signal<number | null>(null);
  protected readonly rpcLogs = signal<RPCMessageLog[]>([]);

  // Crypto Tab
  protected readonly cryptoModel = signal('');
  protected readonly cryptoForm = form(this.cryptoModel, (p) => {
    required(p);
  });
  protected readonly isEncrypted = signal<boolean>(false);
  private encryptedPayload: string | null = null;

  // Multi-Tab Sync Tab
  protected readonly profileModel = signal({
    name: '',
    role: '',
    avatarColor: '#a855f7',
  });
  protected readonly profileForm = form(this.profileModel, (p) => {
    required(p.name);
    required(p.role);
    required(p.avatarColor);
  });
  protected readonly activeProfile = signal<{ name: string; role: string; avatarColor: string }>({
    name: 'Gaston',
    role: 'Architect GDE',
    avatarColor: '#a855f7',
  });
  protected readonly toasterAlert = signal<{ show: boolean; message: string } | null>(null);
  private toastTimeout: any = null;

  // TOON Tab
  protected readonly toonModel = signal('');
  protected readonly toonForm = form(this.toonModel);
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
  private readonly localTransport = inject(LocalStorageTransport);
  private readonly ngZone = inject(NgZone);
  private syncSubscription?: () => void;
  private benchmarkTimeout?: any;

  constructor() {
    // Serialization Dynamic Listener with automatic injection-context lifecycle unsubscribe
    effect(() => {
      this.calculateSerializationWeights(this.toonModel());
    });

    // Handle incoming Multi-Tab Sync changes from the Web Worker BroadcastChannel
    this.syncSubscription = this.workerTransport.onChange('user_profile', (newValue: any) => {
      this.ngZone.run(() => {
        if (newValue) {
          this.activeProfile.set(newValue);
          this.profileModel.set(newValue);
          this.triggerToast(`Profile for "${newValue.name}" synced in the background.`);
        }
      });
    });
  }

  ngOnInit(): void {
    this.runFpsTracker();
    this.setupToonDefaults();
    this.loadInitialProfile();
    this.generateNewTaskId();
    this.readDirectEntries();
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
    if (typeof requestAnimationFrame === 'undefined' || typeof performance === 'undefined') return;

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
        this.profileModel.set(profile);
      } else {
        // Preset values
        const defaultProfile = { name: 'Gaston', role: 'Architect GDE', avatarColor: '#a855f7' };
        this.activeProfile.set(defaultProfile);
        this.profileModel.set(defaultProfile);
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
    const text = this.cryptoModel();
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
      this.cryptoModel.set(typeof result === 'string' ? result : JSON.stringify(result));
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
    const value = this.profileModel();
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
    this.toonModel.set(JSON.stringify(obj, null, 2));
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

  // EntityStore & Direct DB Methods
  protected generateNewTaskId() {
    this.taskModel.update((m) => ({
      ...m,
      id: 'task_' + Math.random().toString(36).substring(2, 7),
    }));
  }

  protected addTask() {
    const val = this.taskModel();
    if (!val.id || !val.title || !val.category || !val.priority) return;

    const task: TaskEntity = {
      id: val.id,
      title: val.title,
      category: val.category,
      priority: val.priority,
      completed: !!val.completed,
    };

    this.taskStore.setOne(task);
    this.triggerToast(`Task "${task.title}" saved reactively in EntityStore!`);

    // Reset and generate new ID
    this.taskForm().reset();
    this.taskModel.set({
      id: '',
      title: '',
      category: 'Work',
      priority: 'medium',
      completed: false,
    });
    this.generateNewTaskId();
  }

  protected addSampleTasks() {
    const samples: TaskEntity[] = [
      {
        id: 'task_sample_1',
        title: 'Implement Hexagonal Architecture',
        category: 'Dev',
        priority: 'high',
        completed: true,
      },
      {
        id: 'task_sample_2',
        title: 'Optimize Web Workers Latency',
        category: 'Perf',
        priority: 'high',
        completed: false,
      },
      {
        id: 'task_sample_3',
        title: 'Refactor standalone UI Components',
        category: 'Design',
        priority: 'medium',
        completed: false,
      },
      {
        id: 'task_sample_4',
        title: 'Verify WCAG AA Compliance',
        category: 'QA',
        priority: 'low',
        completed: true,
      },
    ];
    this.taskStore.setMany(samples);
    this.triggerToast('Loaded 4 sample entities into the Reactive Store!');
  }

  protected deleteTask(id: string) {
    this.taskStore.deleteOne(id);
    if (this.selectedTaskId() === id) {
      this.selectedTaskId.set(null);
    }
    this.triggerToast(`Task "${id}" deleted.`);
  }

  protected toggleTaskCompletion(task: TaskEntity) {
    const updated = { ...task, completed: !task.completed };
    this.taskStore.setOne(updated);
  }

  protected selectTaskForTelemetry(id: string) {
    this.selectedTaskId.set(this.selectedTaskId() === id ? null : id);
  }

  protected async generateDirectEntries() {
    this.isDirectLoading.set(true);
    try {
      const sampleTasks = [
        {
          id: 'direct_task_1',
          title: 'Direct DB Task Alpha',
          priority: 'high',
          date: new Date().toISOString(),
        },
        {
          id: 'direct_task_2',
          title: 'Direct DB Task Beta',
          priority: 'medium',
          date: new Date().toISOString(),
        },
        {
          id: 'direct_task_3',
          title: 'Direct DB Task Gamma',
          priority: 'low',
          date: new Date().toISOString(),
        },
        {
          id: 'direct_task_4',
          title: 'Direct DB Task Delta',
          priority: 'high',
          date: new Date().toISOString(),
        },
        {
          id: 'direct_task_5',
          title: 'Direct DB Task Epsilon',
          priority: 'medium',
          date: new Date().toISOString(),
        },
      ];

      for (const t of sampleTasks) {
        await this.localTransport.write(t.id, t, {
          storageType: 'indexeddb',
          dbName: 'ah_db',
          storeName: 'kv',
          serializer: 'json',
        });
      }

      this.triggerToast('Successfully wrote 5 individual entries directly to IndexedDB!');
      await this.readDirectEntries();
    } catch (e) {
      console.error(e);
      this.triggerToast('Error writing directly to IndexedDB.');
    } finally {
      this.isDirectLoading.set(false);
    }
  }

  protected async readDirectEntries() {
    const list: { key: string; value: any }[] = [];
    for (let i = 1; i <= 5; i++) {
      const key = `direct_task_${i}`;
      try {
        const val = await this.localTransport.read<any>(key, {
          storageType: 'indexeddb',
          dbName: 'ah_db',
          storeName: 'kv',
          serializer: 'json',
        });
        if (val) {
          list.push({ key, value: val });
        }
      } catch (e) {
        console.error(e);
      }
    }
    this.directEntries.set(list);
  }

  protected async clearDirectEntries() {
    this.isDirectLoading.set(true);
    try {
      for (let i = 1; i <= 5; i++) {
        const key = `direct_task_${i}`;
        await this.localTransport.delete(key, {
          storageType: 'indexeddb',
          dbName: 'ah_db',
          storeName: 'kv',
          serializer: 'json',
        });
      }
      this.triggerToast('Cleared independent entries from IndexedDB.');
      await this.readDirectEntries();
    } catch (e) {
      console.error(e);
    } finally {
      this.isDirectLoading.set(false);
    }
  }
}
