import { ServiceDoc } from '../models/doc-meta.model';
import { InterfaceDoc } from '../feature/unified-service-detail/unified-service-detail.component';

export const STORAGE_SERVICES: ServiceDoc[] = [
  {
    id: 'inject-storage-signal',
    name: 'injectStorageSignal',
    description:
      'An advanced reactive L1 Signal backed by asynchronous L2 storage transport. Supports client-side AES-GCM encryption, TOON compression, loading states, error handling, and optional cross-tab/window synchronization.',
    scope: 'provided',
    importPath: '@angular-helpers/storage',
    requiresSecureContext: false,
    browserSupport: 'All modern browsers (WebCrypto + CacheAPI / IndexedDB / WebStorage)',
    category: 'storage-io',
    notes: [
      'Returns a WritableSignal emitting a StorageSignalState<T> object containing data, loading, and error properties.',
      'For main thread storage operations, LocalStorageTransport is used by default.',
      'If serializer is set to "toon", it attempts to import @toon-format/toon dynamically for high-performance binary-like compression.',
      'Cross-tab synchronization uses storage events (for localStorage) or worker-level messages (for worker storage).',
    ],
    methods: [],
    example: `import { Component } from '@angular/core';
import { injectStorageSignal } from '@angular-helpers/storage';

@Component({
  selector: 'app-user-preferences',
  standalone: true,
  template: \`
    @if (prefs().loading) {
      <div class="loading-spinner">Loading preferences...</div>
    } @else {
      <div [class.dark-theme]="prefs().data.theme === 'dark'">
        <p>Current Theme: {{ prefs().data.theme }}</p>
        <button (click)="toggleTheme()">Toggle Theme</button>
      </div>
    }
  \`
})
export class UserPreferencesComponent {
  // Define reactive signal persisted in localStorage with cross-tab synchronization
  protected prefs = injectStorageSignal('user_prefs', { theme: 'light', zoom: 1 }, {
    storageType: 'local',
    serializer: 'json',
    crossTabSync: true
  });

  toggleTheme() {
    this.prefs.update(state => ({
      ...state,
      data: {
        ...state.data,
        theme: state.data.theme === 'light' ? 'dark' : 'light'
      }
    }));
  }
}`,
  },
  {
    id: 'inject-entity-store',
    name: 'injectEntityStore',
    description:
      'Surgical, reactive entity management store with strict immutability (Freeze-on-Write) and optional L2 storage persistence. Emits granular, performance-optimized updates that only trigger changes when the queried entity actually changes.',
    scope: 'provided',
    importPath: '@angular-helpers/storage',
    requiresSecureContext: false,
    browserSupport: 'All modern browsers',
    category: 'storage-io',
    notes: [
      'Enforces immutability by applying Object.freeze on all stored entities (Freeze-on-Write).',
      'Exposes reactive derived signals: list(), ids(), size(), and entities().',
      'Allows creating highly granular signals via entitySignal(id) which only emit if that specific entity is mutated.',
      'If persistKey is provided, it automatically restores and saves changes to the configured storage transport.',
    ],
    methods: [
      {
        name: 'entitySignal',
        signature: 'entitySignal(id: Id): Signal<Entity | undefined>',
        description:
          'Returns a highly granular, read-only Signal for a specific entity. Dispatches updates only if that specific entity changes.',
        returns: 'Signal<Entity | undefined>',
      },
      {
        name: 'setOne',
        signature: 'setOne(entity: Entity): void',
        description: 'Saves or updates a single entity, cloning and freezing it on write.',
        returns: 'void',
      },
      {
        name: 'setMany',
        signature: 'setMany(entities: Entity[]): void',
        description: 'Saves or updates multiple entities atomically and freezes them on write.',
        returns: 'void',
      },
      {
        name: 'deleteOne',
        signature: 'deleteOne(id: Id): void',
        description: 'Deletes a single entity by its unique ID and cleans up its granular signal.',
        returns: 'void',
      },
      {
        name: 'clear',
        signature: 'clear(): void',
        description: 'Wipes all entities from the store and nullifies all granular signals.',
        returns: 'void',
      },
    ],
    example: `import { Component } from '@angular/core';
import { injectEntityStore } from '@angular-helpers/storage';

interface User {
  id: number;
  name: string;
  role: string;
}

@Component({
  selector: 'app-users-admin',
  standalone: true,
  template: \`
    <ul class="user-list">
      @for (user of users.list(); track user.id) {
        <li>{{ user.name }} ({{ user.role }})</li>
      }
    </ul>
    <button (click)="addUser()">Add Administrator</button>
  \`
})
export class UsersAdminComponent {
  // Inject entity store with automatic persistence in IndexedDB
  protected users = injectEntityStore<number, User>({
    idKey: 'id',
    persistKey: 'admin_users_list',
    storageOptions: {
      storageType: 'indexeddb',
      dbName: 'admin_panel',
      storeName: 'users'
    }
  });

  addUser() {
    const newId = Date.now();
    this.users.setOne({
      id: newId,
      name: \`User_\${newId}\`,
      role: 'admin'
    });
  }
}`,
  },
  {
    id: 'local-transport',
    name: 'LocalStorageTransport',
    description:
      'Standard main-thread storage transport implementation for the STORAGE_TRANSPORT token. Supports local/session storage, CacheAPI, IndexedDB, dynamic data compression using TOON, and client-side PBKDF2/AES-GCM encryption.',
    scope: 'provided',
    importPath: '@angular-helpers/storage',
    requiresSecureContext: false,
    browserSupport: 'All modern browsers',
    category: 'storage-io',
    notes: [
      'Implements the StorageTransport interface.',
      'If running in Web Worker contexts, automatically falls back to IndexedDB for L2 persistence since localStorage is main-thread only.',
      'Encryption uses PBKDF2 with 100,000 iterations for key derivation and AES-GCM (256-bit) for data encryption.',
    ],
    methods: [
      {
        name: 'read',
        signature: 'read<T>(key: string, useToon?: boolean): Promise<T | undefined>',
        description: 'Reads and deserializes a value from the configured storage mechanism.',
        returns: 'Promise<T | undefined>',
      },
      {
        name: 'write',
        signature: 'write<T>(key: string, data: T, useToon?: boolean): Promise<void>',
        description: 'Serializes, optionally encrypts, and writes a value to storage.',
        returns: 'Promise<void>',
      },
      {
        name: 'delete',
        signature: 'delete(key: string): Promise<void>',
        description: 'Deletes a key from the storage mechanism.',
        returns: 'Promise<void>',
      },
      {
        name: 'onChange',
        signature: 'onChange<T>(key: string, callback: (value: T) => void): () => void',
        description:
          'Subscribes a callback to receive updates from storage events (cross-tab sync). Returns an unsubscribe function.',
        returns: '() => void',
      },
    ],
    example: `import { Component, inject } from '@angular/core';
import { LocalStorageTransport, STORAGE_TRANSPORT } from '@angular-helpers/storage';

@Component({
  selector: 'app-custom-storage',
  standalone: true,
  providers: [
    // Explicitly provide LocalStorageTransport
    { provide: STORAGE_TRANSPORT, useClass: LocalStorageTransport }
  ],
  template: \`<button (click)="saveData()">Save Data</button>\`
})
export class CustomStorageComponent {
  private transport = inject(STORAGE_TRANSPORT);

  async saveData() {
    await this.transport.write('custom_key', { foo: 'bar' });
    const val = await this.transport.read('custom_key');
    console.log('Retrieved value:', val);
  }
}`,
  },
  {
    id: 'worker-transport',
    name: 'WorkerStorageTransport',
    description:
      'High-performance, off-main-thread storage transport. Offloads all serialization, PBKDF2/AES-GCM encryption/decryption, and I/O tasks to a Web Worker or Shared Worker. Prevents main-thread stuttering and UI blocking on intensive storage operations.',
    scope: 'provided',
    importPath: '@angular-helpers/storage',
    requiresSecureContext: true,
    browserSupport: 'All modern browsers supporting Web Workers',
    category: 'storage-io',
    notes: [
      'Implements the StorageTransport interface.',
      'Requires the STORAGE_WORKER_FACTORY InjectionToken to supply the Worker instance.',
      'Maintains a pending requests map to resolve/reject Promises as messages arrive from the background worker.',
      'Broadcasting and reactivity are handled transparently through the worker bridge.',
    ],
    methods: [
      {
        name: 'read',
        signature: 'read<T>(key: string, useToon?: boolean): Promise<T | undefined>',
        description:
          'Asynchronously reads a key off the main thread by querying the storage worker.',
        returns: 'Promise<T | undefined>',
      },
      {
        name: 'write',
        signature: 'write<T>(key: string, data: T, useToon?: boolean): Promise<void>',
        description: 'Asynchronously writes a key and payload to the storage worker.',
        returns: 'Promise<void>',
      },
      {
        name: 'delete',
        signature: 'delete(key: string): Promise<void>',
        description: 'Deletes a key via the storage worker.',
        returns: 'Promise<void>',
      },
      {
        name: 'onChange',
        signature: 'onChange<T>(key: string, callback: (value: T) => void): () => void',
        description: 'Subscribes a callback to change events broadcasted by the storage worker.',
        returns: '() => void',
      },
    ],
    example: `import { Component, inject } from '@angular/core';
import { WorkerStorageTransport, STORAGE_TRANSPORT, STORAGE_WORKER_FACTORY } from '@angular-helpers/storage';

// Factory function to create the storage Web Worker
export function storageWorkerFactory(): Worker {
  return new Worker(new URL('./storage.worker', import.meta.url), { type: 'module' });
}

@Component({
  selector: 'app-worker-storage',
  standalone: true,
  providers: [
    { provide: STORAGE_WORKER_FACTORY, useValue: storageWorkerFactory },
    { provide: STORAGE_TRANSPORT, useClass: WorkerStorageTransport }
  ],
  template: \`<button (click)="performHeavyStorage()">Perform Heavy Storage</button>\`
})
export class AppWorkerStorageComponent {
  private transport = inject(STORAGE_TRANSPORT);

  async performHeavyStorage() {
    const largeDataset = Array.from({ length: 10000 }, (_, i) => ({ id: i, data: Math.random() }));
    
    // Encryption and TOON compression will be performed in the background Web Worker!
    await this.transport.write('heavy_payload', largeDataset, true);
    console.log('Successfully saved off-main-thread!');
  }
}`,
  },
  {
    id: 'storage-transport',
    name: 'StorageTransport',
    description:
      'Core interface and injection token defining the contract for storage transport providers. Allows swapping storage mechanisms seamlessly (e.g. main thread vs. Web Worker) without modifying the consumption layer.',
    scope: 'provided',
    importPath: '@angular-helpers/storage',
    requiresSecureContext: false,
    browserSupport: 'All modern browsers',
    category: 'storage-io',
    notes: [
      'Define read, write, delete, and optionally onChange methods.',
      'Exported as an interface and a concrete InjectionToken (STORAGE_TRANSPORT).',
    ],
    methods: [
      {
        name: 'read',
        signature: 'read<T>(key: string, useToon?: boolean): Promise<T | undefined>',
        description: 'Asynchronously reads a value.',
        returns: 'Promise<T | undefined>',
      },
      {
        name: 'write',
        signature: 'write<T>(key: string, data: T, useToon?: boolean): Promise<void>',
        description: 'Asynchronously writes a value.',
        returns: 'Promise<void>',
      },
      {
        name: 'delete',
        signature: 'delete(key: string): Promise<void>',
        description: 'Asynchronously deletes a value.',
        returns: 'Promise<void>',
      },
      {
        name: 'onChange',
        signature: 'onChange?<T>(key: string, callback: (value: T) => void): () => void',
        description:
          'Optional callback subscription for cross-tab or worker-driven reactive state changes.',
        returns: '() => void',
      },
    ],
    example: `import { Injectable } from '@angular/core';
import { STORAGE_TRANSPORT, StorageTransport } from '@angular-helpers/storage';

@Injectable({ providedIn: 'root' })
export class CustomMemoryTransport implements StorageTransport {
  private cache = new Map<string, any>();

  async read<T>(key: string): Promise<T | undefined> {
    return this.cache.get(key);
  }
  async write<T>(key: string, data: T): Promise<void> {
    this.cache.set(key, data);
  }
  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }
}

// In your application bootstrap or global providers:
// { provide: STORAGE_TRANSPORT, useClass: CustomMemoryTransport }`,
  },
  {
    id: 'offline-sync',
    name: 'OfflineSyncService',
    description:
      'A reactive main-thread service that bridges network status changes to the background Http Web Worker. Monitors navigator.onLine reactively using Angular Signals, counts pending queued offline mutations, and triggers background synchronization on network recovery.',
    scope: 'provided',
    importPath: '@angular-helpers/storage',
    requiresSecureContext: false,
    browserSupport: 'All modern browsers supporting window.onLine and IndexedDB',
    category: 'storage-io',
    notes: [
      'Uses Angular Signals (isOnline and pendingSyncsCount) to expose reactive network and queue state.',
      'Listens to native window "online" and "offline" events to automatically trigger synchronization.',
      'Triggers background queue draining by calling the virtual route "/offline-sync-drain" through Angular HttpBackend.',
      'Zero compile-time coupling with the worker interceptors: relies purely on shared IndexedDB and synthetic HTTP endpoints.',
      'Contains a manual triggerSync() method and a checkPendingCount() method returning a Promise<number>.',
    ],
    methods: [
      {
        name: 'triggerSync',
        signature: 'triggerSync(): void',
        description:
          'Triggers the offline sync queue draining pipeline in the worker. Checks network status first.',
        returns: 'void',
      },
      {
        name: 'checkPendingCount',
        signature: 'checkPendingCount(): Promise<number>',
        description:
          'Manually inspects the shared IndexedDB store and updates the pendingSyncsCount signal.',
        returns: 'Promise<number>',
      },
    ],
    example: `import { Component, inject } from '@angular/core';
import { OfflineSyncService } from '@angular-helpers/storage';

@Component({
  selector: 'app-offline-status',
  standalone: true,
  template: \`
    <div class="network-badge" [class.online]="syncService.isOnline()">
      Status: {{ syncService.isOnline() ? 'Online' : 'Offline' }}
    </div>

    @if (syncService.pendingSyncsCount() > 0) {
      <div class="sync-alert">
        <p>You have {{ syncService.pendingSyncsCount() }} unsaved mutations enqueued.</p>
        <button [disabled]="!syncService.isOnline()" (click)="syncService.triggerSync()">
          Sync Now
        </button>
      </div>
    }
  \`
})
export class OfflineStatusComponent {
  protected syncService = inject(OfflineSyncService);
}`,
  },
];

export const STORAGE_INTERFACES: Record<string, InterfaceDoc[]> = {
  'inject-storage-signal': [
    {
      name: 'StorageSignalOptions',
      description: 'Configuration options for injectStorageSignal.',
      properties: [
        {
          name: 'storageType',
          type: "'local' | 'session' | 'indexeddb' | 'cacheapi'",
          description: 'Storage transport mechanism to use.',
        },
        {
          name: 'serializer',
          type: "'json' | 'toon'",
          description:
            'Data serialization format (standard JSON or high-performance TOON binary format).',
        },
        {
          name: 'encrypt?',
          type: 'boolean',
          description: 'Enable secure AES-GCM client-side encryption (requires secure context).',
        },
        { name: 'dbName?', type: 'string', description: 'Database name (IndexedDB only).' },
        { name: 'storeName?', type: 'string', description: 'Object store name (IndexedDB only).' },
        {
          name: 'cacheName?',
          type: 'string',
          description: 'Cache storage bucket name (CacheAPI only).',
        },
        {
          name: 'crossTabSync?',
          type: 'boolean',
          description: 'Synchronize reactive signal value across browser tabs/windows.',
        },
      ],
    },
    {
      name: 'StorageSignalState<T>',
      description: 'The reactively updated state wrapper object returned by the storage signal.',
      properties: [
        { name: 'data', type: 'T', description: 'The current deserialized value.' },
        {
          name: 'loading',
          type: 'boolean',
          description: 'True when performing asynchronous load operations.',
        },
        {
          name: 'error',
          type: 'Error | null',
          description: 'Contains any initialization/read error or null.',
        },
      ],
    },
  ],
  'inject-entity-store': [
    {
      name: 'EntityStoreOptions<Id, Entity>',
      description: 'Configuration options for injectEntityStore / EntityStore.',
      properties: [
        {
          name: 'idKey',
          type: 'keyof Entity | ((entity: Entity) => Id)',
          description: 'Unique identifier key or custom resolver function.',
        },
        {
          name: 'persistKey?',
          type: 'string',
          description: 'If provided, synchronizes the collection to this L2 storage key.',
        },
        {
          name: 'storageOptions?',
          type: "Omit<StorageSignalOptions, 'serializer'> & { serializer?: 'json' | 'toon' }",
          description: 'Custom storage options for collection persistence.',
        },
      ],
    },
  ],
  'worker-transport': [
    {
      name: 'WorkerStorageRequest',
      description: 'Structure of the message sent from main thread to the storage worker.',
      properties: [
        {
          name: 'type',
          type: "'read' | 'write' | 'delete'",
          description: 'Action type requested.',
        },
        { name: 'requestId', type: 'string', description: 'Unique identifier for correlation.' },
        { name: 'key?', type: 'string', description: 'Storage key.' },
        { name: 'payload?', type: 'any', description: 'Value payload for write operations.' },
        {
          name: 'options?',
          type: '{ useToon?: boolean }',
          description: 'Optional serializer parameters.',
        },
      ],
    },
    {
      name: 'WorkerStorageResponse',
      description: 'Structure of the message received by the main thread from the storage worker.',
      properties: [
        {
          name: 'type',
          type: "'response' | 'change' | 'error'",
          description: 'Response message type.',
        },
        { name: 'requestId?', type: 'string', description: 'Correlated request ID.' },
        { name: 'key?', type: 'string', description: 'Storage key affected.' },
        { name: 'payload?', type: 'any', description: 'Returned data payload.' },
        { name: 'error?', type: 'string', description: 'Error message if failed.' },
      ],
    },
  ],
};
