import { inject, signal, computed, Signal, WritableSignal } from '@angular/core';
import { STORAGE_TRANSPORT } from '../tokens/storage.tokens';
import { LocalStorageTransport } from './local-transport';
import { SafeReadonlyMap } from '../utils/safe-readonly-map';
import { EntityStoreOptions, StorageSignalOptions } from '../interfaces/storage.types';

export class EntityStore<Id, Entity> {
  private readonly _rawMap = new Map<Id, Entity>();
  private readonly _entities = signal<ReadonlyMap<Id, Entity>>(new SafeReadonlyMap(this._rawMap));

  // Public Reactive APIs
  readonly entities = this._entities.asReadonly();
  readonly list = computed(() => Array.from(this.entities().values()));
  readonly ids = computed(() => Array.from(this.entities().keys()));
  readonly size = computed(() => this.entities().size);

  private readonly _entitySignals = new Map<Id, WritableSignal<Entity | undefined>>();
  private readonly _idResolver: (entity: Entity) => Id;
  private _isRestoring = false;
  private _persistTimer: any = null;
  private readonly _transport = this._resolveTransport();

  constructor(private readonly options: EntityStoreOptions<Id, Entity>) {
    const idKey = options.idKey;
    this._idResolver =
      typeof idKey === 'function' ? idKey : (entity: Entity) => entity[idKey] as unknown as Id;

    if (options.persistKey) {
      this.initPersistence(options.persistKey);
    }
  }

  /**
   * Returns a granular Signal that ONLY triggers if the entity with this ID changes
   */
  entitySignal(id: Id): Signal<Entity | undefined> {
    let sig = this._entitySignals.get(id);
    if (!sig) {
      sig = signal(this._rawMap.get(id));
      this._entitySignals.set(id, sig);
    }
    return sig.asReadonly();
  }

  /**
   * Saves or updates an entity by cloning and freezing it on write (Freeze-on-Write)
   */
  setOne(entity: Entity): void {
    const id = this._idResolver(entity);
    const secureEntity = Object.freeze({ ...entity });

    this._rawMap.set(id, secureEntity);
    this._entities.set(new SafeReadonlyMap(this._rawMap));

    const sig = this._entitySignals.get(id);
    if (sig) {
      sig.set(secureEntity);
    }

    this.triggerPersist();
  }

  /**
   * Saves or updates multiple entities at once atomically and frozen
   */
  setMany(entities: Entity[]): void {
    for (const entity of entities) {
      const id = this._idResolver(entity);
      const secureEntity = Object.freeze({ ...entity });

      this._rawMap.set(id, secureEntity);

      const sig = this._entitySignals.get(id);
      if (sig) {
        sig.set(secureEntity);
      }
    }

    this._entities.set(new SafeReadonlyMap(this._rawMap));
    this.triggerPersist();
  }

  /**
   * Updates an existing entity using a transformation function
   */
  update(id: Id, updater: (entity: Entity) => Entity): void {
    const current = this._rawMap.get(id);
    if (!current) return;

    const next = updater(current);
    this.setOne(next);
  }

  /**
   * Applies a partial patch to an existing entity
   */
  patch(id: Id, partial: Partial<Entity>): void {
    const current = this._rawMap.get(id);
    if (!current) return;

    this.setOne({ ...current, ...partial });
  }

  /**
   * Deletes an entity by its ID and cleans up its granular signal
   */
  deleteOne(id: Id): void {
    if (!this._rawMap.has(id)) return;

    this._rawMap.delete(id);
    this._entities.set(new SafeReadonlyMap(this._rawMap));

    const sig = this._entitySignals.get(id);
    if (sig) {
      sig.set(undefined);
      this._entitySignals.delete(id);
    }

    this.triggerPersist();
  }

  /**
   * Completely clears the Store and all its associated signals
   */
  clear(): void {
    this._rawMap.clear();
    this._entities.set(new SafeReadonlyMap(this._rawMap));

    for (const sig of this._entitySignals.values()) {
      sig.set(undefined);
    }
    this._entitySignals.clear();

    this.triggerPersist();
  }

  // --- L2 Persistence Auxiliaries ---

  private _resolveTransport() {
    try {
      // Since it's called during class initialization (injectors),
      // inject() will resolve natively and flawlessly.
      let transport = inject(STORAGE_TRANSPORT, { optional: true });
      if (!transport) {
        transport = inject(LocalStorageTransport);
      }
      return transport;
    } catch {
      // Graceful fallback when executed outside Angular injection context (e.g. unit tests)
      return new LocalStorageTransport();
    }
  }

  private initPersistence(key: string): void {
    this._isRestoring = true;
    const storageOpts = this.options.storageOptions as StorageSignalOptions;

    this._transport
      .read<Entity[]>(key, storageOpts)
      .then((data) => {
        if (data && Array.isArray(data)) {
          if (storageOpts?.validator) {
            const validData = data.filter((item): item is Entity => {
              const isValid = storageOpts.validator!(item);
              if (!isValid) {
                console.warn(
                  `[EntityStore] Schema drift detected for item in store: ${key}. Filtering out.`,
                );
              }
              return isValid;
            });
            this.setMany(validData);

            // If some items were invalid, trigger auto-repair rewrite
            if (validData.length !== data.length) {
              this.triggerPersist();
            }
          } else {
            this.setMany(data);
          }
        }
      })
      .catch((err) => console.error(`[EntityStore] Error loading persisted entities:`, err))
      .finally(() => {
        this._isRestoring = false;
      });
  }

  private triggerPersist(): void {
    if (this._isRestoring || !this.options.persistKey || this._persistTimer) return;

    // Debounce persistence to the next microtask to batch multiple sync writes
    this._persistTimer = Promise.resolve().then(() => {
      this._persistTimer = null;
      if (!this.options.persistKey) return;

      this._transport
        .write(
          this.options.persistKey,
          this.list(),
          this.options.storageOptions as StorageSignalOptions,
        )
        .catch((err) => console.error(`[EntityStore] Error saving persisted entities:`, err));
    });
  }
}

export function injectEntityStore<Id, Entity>(
  options: EntityStoreOptions<Id, Entity>,
): EntityStore<Id, Entity> {
  return new EntityStore<Id, Entity>(options);
}
