import { inject, signal, computed, Signal, WritableSignal } from '@angular/core';
import { STORAGE_TRANSPORT } from './storage-transport';
import { LocalStorageTransport } from './local-transport';
import { SafeReadonlyMap } from '../utils/safe-readonly-map';
import { EntityStoreOptions } from '../interfaces/storage.types';

export class EntityStore<Id, Entity> {
  private readonly _rawMap = new Map<Id, Entity>();
  private readonly _entities = signal<ReadonlyMap<Id, Entity>>(new SafeReadonlyMap(this._rawMap));

  // APIs Públicas Reactivas
  readonly entities = this._entities.asReadonly();
  readonly list = computed(() => Array.from(this.entities().values()));
  readonly ids = computed(() => Array.from(this.entities().keys()));
  readonly size = computed(() => this.entities().size);

  private readonly _entitySignals = new Map<Id, WritableSignal<Entity | undefined>>();
  private readonly _idResolver: (entity: Entity) => Id;
  private _isRestoring = false;

  constructor(private readonly options: EntityStoreOptions<Id, Entity>) {
    this._idResolver =
      typeof options.idKey === 'function'
        ? options.idKey
        : (entity: Entity) => entity[options.idKey] as unknown as Id;

    if (options.persistKey) {
      this.initPersistence(options.persistKey);
    }
  }

  /**
   * Retorna un Signal granular que SOLO se dispara si cambia la entidad de este ID
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
   * Guarda o actualiza una entidad clonándola y congelándola al escribir (Freeze-on-Write)
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
   * Guarda o actualiza múltiples entidades a la vez de forma atómica y congelada
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
   * Elimina una entidad por su ID y limpia su signal granular
   */
  deleteOne(id: Id): void {
    if (!this._rawMap.has(id)) return;

    this._rawMap.delete(id);
    this._entities.set(new SafeReadonlyMap(this._rawMap));

    const sig = this._entitySignals.get(id);
    if (sig) {
      sig.set(undefined);
    }

    this.triggerPersist();
  }

  /**
   * Limpia por completo el Store y todos sus signals asociados
   */
  clear(): void {
    this._rawMap.clear();
    this._entities.set(new SafeReadonlyMap(this._rawMap));

    for (const sig of this._entitySignals.values()) {
      sig.set(undefined);
    }

    this.triggerPersist();
  }

  // --- Auxiliares de Persistencia L2 ---

  private _resolveTransport() {
    // Como se llama dentro de la inicialización de la clase (inyectores),
    // inject() resolverá de forma nativa e impecable.
    let transport = inject(STORAGE_TRANSPORT, { optional: true });
    if (!transport) {
      transport = inject(LocalStorageTransport);
    }
    return transport;
  }

  private initPersistence(key: string): void {
    const transport = this._resolveTransport();
    const useToon = this.options.storageOptions?.serializer === 'toon';

    if (transport instanceof LocalStorageTransport && this.options.storageOptions) {
      const opts = this.options.storageOptions;
      transport.storageType = opts.storageType;
      transport.encrypt = !!opts.encrypt;
      if (opts.dbName) transport.dbName = opts.dbName;
      if (opts.storeName) transport.storeName = opts.storeName;
      if (opts.cacheName) transport.cacheName = opts.cacheName;
    }

    this._isRestoring = true;
    transport
      .read<Entity[]>(key, useToon)
      .then((data) => {
        if (data && Array.isArray(data)) {
          this.setMany(data);
        }
      })
      .catch((err) => console.error(`[EntityStore] Error cargando entidades persistidas:`, err))
      .finally(() => {
        this._isRestoring = false;
      });
  }

  private triggerPersist(): void {
    if (this._isRestoring || !this.options.persistKey) return;
    const transport = this._resolveTransport();
    const useToon = this.options.storageOptions?.serializer === 'toon';

    if (transport instanceof LocalStorageTransport && this.options.storageOptions) {
      const opts = this.options.storageOptions;
      transport.storageType = opts.storageType;
      transport.encrypt = !!opts.encrypt;
      if (opts.dbName) transport.dbName = opts.dbName;
      if (opts.storeName) transport.storeName = opts.storeName;
      if (opts.cacheName) transport.cacheName = opts.cacheName;
    }

    transport
      .write(this.options.persistKey, this.list(), useToon)
      .catch((err) => console.error(`[EntityStore] Error guardando entidades persistidas:`, err));
  }
}

export function injectEntityStore<Id, Entity>(
  options: EntityStoreOptions<Id, Entity>,
): EntityStore<Id, Entity> {
  return new EntityStore<Id, Entity>(options);
}
