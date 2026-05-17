export class SafeReadonlyMap<K, V> implements ReadonlyMap<K, V> {
  constructor(private readonly _map: Map<K, V>) {}

  get size(): number {
    return this._map.size;
  }

  has(key: K): boolean {
    return this._map.has(key);
  }

  get(key: K): V | undefined {
    return this._map.get(key);
  }

  forEach(callbackfn: (value: V, key: K, map: ReadonlyMap<K, V>) => void, thisArg?: any): void {
    this._map.forEach((v, k) => callbackfn.call(thisArg, v, k, this));
  }

  entries(): IterableIterator<[K, V]> {
    return this._map.entries();
  }

  keys(): IterableIterator<K> {
    return this._map.keys();
  }

  values(): IterableIterator<V> {
    return this._map.values();
  }

  [Symbol.iterator](): IterableIterator<[K, V]> {
    return this._map.entries();
  }
}
