import { ServiceDoc } from '../../models/doc-meta.model';

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
    guides: [
      {
        title: 'Offline-First Synchronization & L2 Caching',
        description: `This guide details how to orchestrate injectStorageSignal in combination with an HTTP client and OfflineSyncService to build a robust offline-first reactive state pattern.

Optimistic UI updates are written directly to the main thread signal, immediately persisted to high-performance IndexedDB L2 storage, and queued for server synchronization. When navigator connectivity status changes, OfflineSyncService intercepts the state and automatically triggers background draining pipelines.`,
        files: [
          {
            name: 'offline-settings.component.ts',
            language: 'ts',
            content: `import { Component, inject } from '@angular/core';
import { injectStorageSignal, OfflineSyncService } from '@angular-helpers/storage';

interface UserPreferences {
  theme: 'light' | 'dark';
  notifications: boolean;
  offlineChanges: any[];
}

@Component({
  selector: 'app-offline-settings',
  standalone: true,
  templateUrl: './offline-settings.component.html'
})
export class OfflineSettingsComponent {
  protected readonly sync = inject(OfflineSyncService);

  // 1. Reactive Signal backed by high-performance L2 IndexedDB storage
  protected readonly prefs = injectStorageSignal<UserPreferences>('user_preferences', {
    theme: 'light',
    notifications: true,
    offlineChanges: []
  }, {
    storageType: 'indexeddb',
    serializer: 'json',
    crossTabSync: true, // Auto-sync across multiple browser tabs
    validator: (data): data is UserPreferences => {
      return typeof data === 'object' && data !== null && 'theme' in data;
    }
  });

  toggleTheme() {
    const nextTheme = this.prefs().theme === 'light' ? 'dark' : 'light';
    
    // 2. Perform optimistic local write (immediately updates UI & persists to IndexedDB L2)
    this.prefs.update(state => ({ ...state, theme: nextTheme }));

    // 3. Queue request if offline, or sync immediately if online
    if (!this.sync.isOnline()) {
      this.prefs.update(state => ({
        ...state,
        offlineChanges: [...state.offlineChanges, { type: 'THEME_CHANGE', theme: nextTheme, time: Date.now() }]
      }));
      console.log('Offline: Optimistic save completed. Synchronization queued.');
    } else {
      this.sync.triggerSync();
    }
  }

  forceSync() {
    this.sync.triggerSync();
  }
}`,
          },
          {
            name: 'offline-settings.component.html',
            language: 'html',
            content: `<div class="card bg-base-200/50 backdrop-blur-md p-6 border border-border-subtle rounded-3xl shadow-sm">
  <div class="flex justify-between items-center mb-6">
    <h2 class="text-xl font-bold">User Preferences</h2>
    <span class="badge" [class.badge-success]="sync.isOnline()" [class.badge-warning]="!sync.isOnline()">
      {{ sync.isOnline() ? 'Online' : 'Offline (' + sync.pendingSyncsCount() + ' pending)' }}
    </span>
  </div>

  <div class="form-control gap-4">
    <label class="label cursor-pointer">
      <span class="label-text">Dark Theme</span>
      <input type="checkbox" class="toggle toggle-primary" 
             [checked]="prefs().theme === 'dark'" 
             (change)="toggleTheme()" />
    </label>

    <button class="btn btn-secondary w-full" 
            [disabled]="!sync.isOnline() && sync.pendingSyncsCount() === 0"
            (click)="forceSync()">
      Sync Now
    </button>
  </div>
</div>`,
          },
        ],
      },
    ],
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
    methods: [],
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
    guides: [
      {
        title: 'Hexagonal Repositories & Immutability (Freeze-on-Write)',
        description:
          'Learn how to build a highly scalable, robust domain repository using injectEntityStore under Hexagonal Architecture principles. Enforce immutability using Angular standalone services to decouple your presentation layer from the reactive storage medium.',
        files: [
          {
            name: 'product.model.ts',
            language: 'ts',
            content: `export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}`,
          },
          {
            name: 'product-repository.interface.ts',
            language: 'ts',
            content: `import { Signal } from '@angular/core';
import { Product } from './product.model';

// 1. Ports Definition: Enforce Hexagonal Architecture decoupled abstractions
export interface ProductRepository {
  products$: Signal<Product[]>;
  totalValue$: Signal<number>;
  save(product: Product): void;
  delete(id: string): void;
  updatePrice(id: string, newPrice: number): void;
}`,
          },
          {
            name: 'product-indexeddb.repository.ts',
            language: 'ts',
            content: `import { Injectable, computed } from '@angular/core';
import { injectEntityStore } from '@angular-helpers/storage';
import { Product } from './product.model';
import { ProductRepository } from './product-repository.interface';

@Injectable({ providedIn: 'root' })
export class ProductIndexedDbRepository implements ProductRepository {
  // 2. Encapsulate EntityStore internally. 
  // Object.freeze is enforced on all entities via Freeze-on-Write to prevent direct state mutations.
  private readonly store = injectEntityStore<string, Product>({
    idKey: 'id',
    persistKey: 'catalog_products',
    storageOptions: {
      storageType: 'indexeddb',
      dbName: 'e_commerce_db',
      storeName: 'catalog'
    }
  });

  readonly products$ = this.store.list;
  readonly totalValue$ = computed(() => 
    this.store.list().reduce((total, p) => total + (p.price * p.stock), 0)
  );

  // Get highly granular signal for a specific entity (optimizes rendering performance)
  getProductSignal(id: string) {
    return this.store.entitySignal(id);
  }

  save(product: Product): void {
    this.store.setOne(product);
  }

  delete(id: string): void {
    this.store.deleteOne(id);
  }

  updatePrice(id: string, newPrice: number): void {
    this.store.patch(id, { price: newPrice });
  }
}`,
          },
          {
            name: 'product-list.component.ts',
            language: 'ts',
            content: `import { Component, inject } from '@angular/core';
import { ProductIndexedDbRepository } from './product-indexeddb.repository';
import { Product } from './product.model';

@Component({
  selector: 'app-product-list',
  standalone: true,
  templateUrl: './product-list.component.html'
})
export class ProductListComponent {
  // 4. Inject the Repository Port abstraction (using implementation class for DI)
  protected readonly repo = inject(ProductIndexedDbRepository);

  discountProduct(id: string, currentPrice: number) {
    const discountedPrice = Math.max(0, currentPrice - 5);
    this.repo.updatePrice(id, discountedPrice);
  }

  remove(id: string) {
    this.repo.delete(id);
  }
}`,
          },
          {
            name: 'product-list.component.html',
            language: 'html',
            content: `<div class="p-6 bg-base-200/50 backdrop-blur-md border border-border-subtle rounded-3xl shadow-sm">
  <div class="flex justify-between items-center mb-6">
    <h2 class="text-xl font-bold">Catalog Products</h2>
    <span class="text-lg font-black text-primary">
      Total Value: \${{ repo.totalValue$() }}
    </span>
  </div>

  <div class="overflow-x-auto">
    <table class="table w-full">
      <thead>
        <tr>
          <th>Product Name</th>
          <th>Price</th>
          <th>Stock</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        @for (product of repo.products$(); track product.id) {
          <tr class="hover:bg-base-content/5 transition-colors">
            <td class="font-bold">{{ product.name }}</td>
            <td class="font-mono">\${{ product.price }}</td>
            <td>{{ product.stock }} units</td>
            <td class="flex gap-2">
              <button class="btn btn-sm btn-primary" (click)="discountProduct(product.id, product.price)">
                Apply -$5 Discount
              </button>
              <button class="btn btn-sm btn-outline btn-error" (click)="remove(product.id)">
                Delete
              </button>
            </td>
          </tr>
        } @empty {
          <tr>
            <td colspan="4" class="text-center py-6 text-base-content/40">
              No products available in IndexedDB catalog.
            </td>
          </tr>
        }
      </tbody>
    </table>
  </div>
</div>`,
          },
        ],
      },
    ],
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
      {
        name: 'checkPendingCount',
        signature: 'checkPendingCount(): Promise<number>',
        description: 'Manually checks the number of pending queued requests in IndexedDB.',
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

  {
    id: 'inject-storage-resource',
    name: 'injectStorageResource',
    description:
      'Provides a reactive Angular Resource wrapper around StorageTransport. Handles async serialization/deserialization and syncs reactively.',
    scope: 'provided',
    importPath: '@angular-helpers/storage',
    requiresSecureContext: false,
    browserSupport: 'All modern browsers',
    category: 'storage-io',
    notes: [
      'Returns a ResourceRef powered by Angular rxResource.',
      'Supports asynchronous Web Worker transports automatically.',
    ],
    methods: [],
    example: `import { Component } from '@angular/core';
import { injectStorageResource } from '@angular-helpers/storage';

@Component({
  selector: 'app-storage-resource',
  template: \`
    @if (data.resource.isLoading()) {
      <p>Loading...</p>
    } @else if (data.resource.hasValue()) {
      <p>Value: {{ data.resource.value() }}</p>
      <button (click)="data.set('updated value')">Update Value</button>
    }
  \`
})
export class StorageResourceComponent {
  data = injectStorageResource('my_data_key', 'initial value', {
    storageType: 'local',
    serializer: 'json'
  });
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
