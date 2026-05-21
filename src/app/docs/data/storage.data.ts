import { ServiceDoc } from '../models/doc-meta.model';

export interface InterfaceDoc {
  name: string;
  description: string;
  properties: { name: string; type: string; description: string }[];
}

export const STORAGE_SERVICES: ServiceDoc[] = [
  {
    id: 'inject-storage-signal',
    name: 'injectStorageSignal',
    description:
      'An advanced reactive L1 Signal backed by asynchronous L2 storage transport. Now featuring direct data access and separate loading/error sub-signals.',
    scope: 'provided',
    importPath: '@angular-helpers/storage',
    requiresSecureContext: false,
    browserSupport: 'All modern browsers (WebCrypto + CacheAPI / IndexedDB / WebStorage)',
    category: 'storage-io',
    notes: [
      'Returns a WritableSignal emitting the data directly (no more .data access needed).',
      'Exposes .loading() and .error() read-only sub-signals for state monitoring.',
      'Includes smart diffing to prevent unnecessary UI updates if data is deep-equal.',
      'Supports automatic off-main-thread serialization/encryption if a worker is provided.',
    ],
    methods: [],
    example: `import { Component } from '@angular/core';
import { injectStorageSignal } from '@angular-helpers/storage';

@Component({
  selector: 'app-user-preferences',
  standalone: true,
  template: \`
    @if (prefs.loading()) {
      <div class="loading-spinner">Loading preferences...</div>
    } @else {
      <div [class.dark-theme]="prefs()?.theme === 'dark'">
        <p>Current Theme: {{ prefs()?.theme }}</p>
        <button (click)="toggleTheme()">Toggle Theme</button>
      </div>
    }
  \`
})
export class UserPreferencesComponent {
  // Define reactive signal persisted in localStorage with cross-tab synchronization
  // Direct access: prefs() returns the data object
  protected prefs = injectStorageSignal('user_prefs', { theme: 'light', zoom: 1 }, {
    storageType: 'local',
    serializer: 'json',
    crossTabSync: true
  });

  toggleTheme() {
    // Easy functional update
    this.prefs.update(state => ({
      ...state,
      theme: state.theme === 'light' ? 'dark' : 'light'
    }));
  }
}`,
  },
  {
    id: 'inject-entity-store',
    name: 'injectEntityStore',
    description:
      'Surgical, reactive entity management store with strict immutability (Freeze-on-Write) and optional L2 storage persistence. Now with batch write debouncing and easy patch/update API.',
    scope: 'provided',
    importPath: '@angular-helpers/storage',
    requiresSecureContext: false,
    browserSupport: 'All modern browsers',
    category: 'storage-io',
    notes: [
      'Enforces immutability by applying Object.freeze on all stored entities (Freeze-on-Write).',
      'Exposes reactive derived signals: list(), ids(), size(), and entities().',
      'Includes automatic persistence debouncing to microtasks to batch I/O operations.',
      'Automatically cleans up granular signals when entities are deleted to prevent memory leaks.',
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
        name: 'patch',
        signature: 'patch(id: Id, partial: Partial<Entity>): void',
        description: 'Applies a partial update to an existing entity.',
        returns: 'void',
      },
      {
        name: 'update',
        signature: 'update(id: Id, updater: (entity: Entity) => Entity): void',
        description: 'Updates an entity using a transformation function.',
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
        description: 'Deletes an entity and cleans up its granular signal.',
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
      'Strategy-based storage transport implementation. Supports LocalStorage, SessionStorage, CacheAPI, and IndexedDB with automatic worker delegation support.',
    scope: 'provided',
    importPath: '@angular-helpers/storage',
    requiresSecureContext: false,
    browserSupport: 'All modern browsers',
    category: 'storage-io',
    notes: [
      'Implements the StorageTransport interface using a Strategy router pattern.',
      'Automatically delegates to Web Workers if STORAGE_WORKER_FACTORY is provided.',
      'Supports AES-GCM encryption and TOON serialization across all backends.',
    ],
    methods: [
      {
        name: 'read',
        signature: 'read<T>(key: string, options?: StorageSignalOptions): Promise<T | undefined>',
        description: 'Reads and deserializes a value from the configured storage mechanism.',
        returns: 'Promise<T | undefined>',
      },
      {
        name: 'write',
        signature: 'write<T>(key: string, data: T, options?: StorageSignalOptions): Promise<void>',
        description: 'Serializes, optionally encrypts, and writes a value to storage.',
        returns: 'Promise<void>',
      },
    ],
    example: `// Worker-aware transport setup
import { LocalStorageTransport, STORAGE_WORKER_FACTORY, STORAGE_TRANSPORT } from '@angular-helpers/storage';

export const appConfig = {
  providers: [
    { provide: STORAGE_WORKER_FACTORY, useValue: () => new Worker(new URL('./storage.worker', import.meta.url)) },
    { provide: STORAGE_TRANSPORT, useClass: LocalStorageTransport }
  ]
};`,
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
    ],
    methods: [
      {
        name: 'triggerSync',
        signature: 'triggerSync(): void',
        description: 'Triggers the offline sync queue draining pipeline in the worker.',
        returns: 'void',
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
  \`
})
export class OfflineStatusComponent {
  protected syncService = inject(OfflineSyncService);
}`,
  },
  {
    id: 'worker-transport',
    name: 'WorkerStorageTransport',
    description:
      'Web Worker based storage transport. Proxies storage operations to a dedicated worker thread for high performance and isolation.',
    scope: 'provided',
    importPath: '@angular-helpers/storage',
    requiresSecureContext: false,
    browserSupport: 'All browsers with Web Workers support',
    category: 'storage-io',
    notes: [
      'Automatically used by LocalStorageTransport when a worker factory is provided.',
      'Supports zero-copy transfer for large ArrayBuffer payloads.',
      'Ensures that main thread remains responsive during heavy crypto or serialization tasks.',
    ],
    methods: [
      {
        name: 'read',
        signature: 'read<T>(key: string, options?: StorageSignalOptions): Promise<T | undefined>',
        description: 'Sends a RPC read request to the background storage worker.',
        returns: 'Promise<T | undefined>',
      },
      {
        name: 'write',
        signature: 'write<T>(key: string, data: T, options?: StorageSignalOptions): Promise<void>',
        description:
          'Sends a RPC write request to the background storage worker with zero-copy support.',
        returns: 'Promise<void>',
      },
      {
        name: 'delete',
        signature: 'delete(key: string, options?: StorageSignalOptions): Promise<void>',
        description: 'Sends a RPC delete request to the background storage worker.',
        returns: 'Promise<void>',
      },
    ],
    example: `import { WorkerStorageTransport } from '@angular-helpers/storage';

// Manually instantiating a worker-based transport
const transport = new WorkerStorageTransport(() => new Worker(new URL('./app.worker', import.meta.url)));`,
  },
  {
    id: 'storage-transport',
    name: 'StorageTransport',
    description:
      'Interface definition for pluggable storage backends. Enables the Strategy pattern used by LocalStorageTransport.',
    scope: 'provided',
    importPath: '@angular-helpers/storage',
    requiresSecureContext: false,
    browserSupport: 'N/A (Interface)',
    category: 'storage-io',
    notes: [
      'Define custom storage logic by implementing this interface.',
      'Core interface for WebStorage, IndexedDB, and CacheAPI specialized transports.',
    ],
    methods: [
      {
        name: 'read',
        signature: 'read<T>(key: string, options?: StorageSignalOptions): Promise<T | undefined>',
        description: 'Reads a value from the storage medium.',
        returns: 'Promise<T | undefined>',
      },
      {
        name: 'write',
        signature: 'write<T>(key: string, data: T, options?: StorageSignalOptions): Promise<void>',
        description: 'Writes a value to the storage medium.',
        returns: 'Promise<void>',
      },
      {
        name: 'delete',
        signature: 'delete(key: string, options?: StorageSignalOptions): Promise<void>',
        description: 'Removes a value from the storage medium.',
        returns: 'Promise<void>',
      },
    ],
    example: `import { StorageTransport, StorageSignalOptions } from '@angular-helpers/storage';

export class MyCustomTransport implements StorageTransport {
  async read<T>(key: string, options?: StorageSignalOptions): Promise<T | undefined> {
    // Custom read logic
    return undefined;
  }
  async write<T>(key: string, data: T, options?: StorageSignalOptions): Promise<void> {
    // Custom write logic
  }
  async delete(key: string, options?: StorageSignalOptions): Promise<void> {
    // Custom delete logic
  }
}`,
  },
];

export const STORAGE_INTERFACES: Record<string, InterfaceDoc[]> = {
  'inject-storage-signal': [
    {
      name: 'StorageSignal<T>',
      description: 'The reactively updated signal object with metadata properties.',
      properties: [
        { name: '()', type: 'T', description: 'Returns the current deserialized data.' },
        { name: 'loading()', type: 'Signal<boolean>', description: 'Reactive loading state.' },
        { name: 'error()', type: 'Signal<Error | null>', description: 'Reactive error state.' },
      ],
    },
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
          description: 'Data serialization format.',
        },
        {
          name: 'encrypt?',
          type: 'boolean',
          description: 'Enable secure AES-GCM encryption.',
        },
        { name: 'crossTabSync?', type: 'boolean', description: 'Synchronize across tabs.' },
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
      ],
    },
  ],
};
