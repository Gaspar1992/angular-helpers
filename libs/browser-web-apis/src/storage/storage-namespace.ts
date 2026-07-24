import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import type { Signal } from '@angular/core';
import type { BrowserApiLogger } from '../tokens/logger.token';
import type { StorageValue } from '../interfaces/common.types';

export interface StorageOptions {
  /** Optional prefix used to namespace keys (e.g. `app:` -> `app:userId`). */
  prefix?: string;
  serialize?: (value: StorageValue) => string;
  deserialize?: (value: string) => StorageValue;
}

export type StorageArea = 'localStorage' | 'sessionStorage';

export interface StorageEvent {
  key: string | null;
  newValue: StorageValue | null;
  oldValue: StorageValue | null;
  storageArea: StorageArea;
}

export interface StorageNamespace {
  readonly area: StorageArea;
  isSupported(): boolean;
  set<T extends StorageValue>(key: string, value: T, opts?: StorageOptions): boolean;
  get<T extends StorageValue>(
    key: string,
    defaultValue?: T | null,
    opts?: StorageOptions,
  ): T | null;
  remove(key: string, opts?: StorageOptions): boolean;
  clear(opts?: StorageOptions): boolean;
  size(opts?: StorageOptions): number;
  watch<T extends StorageValue>(key: string, opts?: StorageOptions): Observable<T | null>;
  /** Direct access to the native Storage object. Throws if unsupported. */
  native(): Storage;
}

const SECURITY_WARN_KEY = Symbol('storage-security-warned');
type SecurityWarnedHolder = { [SECURITY_WARN_KEY]?: Set<StorageArea> };

/**
 * Implementation of `StorageNamespace` shared by `local` and `session` namespaces.
 * Wraps every native access in try/catch so Safari private mode and sandboxed iframes
 * (which throw `SecurityError`) degrade gracefully instead of crashing the app.
 */
export class StorageNamespaceImpl implements StorageNamespace {
  private supportedCache: boolean | null = null;

  constructor(
    public readonly area: StorageArea,
    private readonly events: {
      emit: (event: StorageEvent) => void;
      events$: Observable<StorageEvent>;
    },
    private readonly logger: BrowserApiLogger,
  ) {}

  isSupported(): boolean {
    if (this.supportedCache !== null) return this.supportedCache;
    if (typeof window === 'undefined' || typeof Storage === 'undefined') {
      this.supportedCache = false;
      return false;
    }
    try {
      const store = this.getStore();
      const probe = `__bwa_probe_${Date.now()}__`;
      store.setItem(probe, '1');
      store.removeItem(probe);
      this.supportedCache = true;
    } catch {
      this.warnSecurityOnce();
      this.supportedCache = false;
    }
    return this.supportedCache;
  }

  set<T extends StorageValue>(key: string, value: T, opts: StorageOptions = {}): boolean {
    if (!this.isSupported()) return false;
    try {
      const fullKey = this.getKey(key, opts);
      const oldRaw = this.getStore().getItem(fullKey);
      const oldValue = oldRaw !== null ? this.deserializeValue(oldRaw, opts) : null;
      const serialized = this.serializeValue(value, opts);
      this.getStore().setItem(fullKey, serialized);
      this.events.emit({ key: fullKey, newValue: value, oldValue, storageArea: this.area });
      return true;
    } catch (error) {
      this.logger.error(`[storage:${this.area}] set("${key}") failed`, error);
      return false;
    }
  }

  get<T extends StorageValue>(
    key: string,
    defaultValue: T | null = null,
    opts: StorageOptions = {},
  ): T | null {
    if (!this.isSupported()) return defaultValue;
    try {
      const fullKey = this.getKey(key, opts);
      const raw = this.getStore().getItem(fullKey);
      return raw !== null ? (this.deserializeValue(raw, opts) as T) : defaultValue;
    } catch (error) {
      this.logger.error(`[storage:${this.area}] get("${key}") failed`, error);
      return defaultValue;
    }
  }

  remove(key: string, opts: StorageOptions = {}): boolean {
    if (!this.isSupported()) return false;
    try {
      const fullKey = this.getKey(key, opts);
      const oldRaw = this.getStore().getItem(fullKey);
      const oldValue = oldRaw !== null ? this.deserializeValue(oldRaw, opts) : null;
      this.getStore().removeItem(fullKey);
      this.events.emit({ key: fullKey, newValue: null, oldValue, storageArea: this.area });
      return true;
    } catch (error) {
      this.logger.error(`[storage:${this.area}] remove("${key}") failed`, error);
      return false;
    }
  }

  clear(opts: StorageOptions = {}): boolean {
    if (!this.isSupported()) return false;
    try {
      const prefix = opts?.prefix;
      const store = this.getStore();
      if (prefix) {
        const toRemove: string[] = [];
        for (let i = 0; i < store.length; i++) {
          const k = store.key(i);
          if (k && k.startsWith(`${prefix}:`)) toRemove.push(k);
        }
        for (const k of toRemove) {
          const oldRaw = store.getItem(k);
          store.removeItem(k);
          this.events.emit({
            key: k,
            newValue: null,
            oldValue: oldRaw,
            storageArea: this.area,
          });
        }
      } else {
        store.clear();
        this.events.emit({ key: null, newValue: null, oldValue: null, storageArea: this.area });
      }
      return true;
    } catch (error) {
      this.logger.error(`[storage:${this.area}] clear() failed`, error);
      return false;
    }
  }

  size(opts: StorageOptions = {}): number {
    if (!this.isSupported()) return 0;
    try {
      const store = this.getStore();
      const prefix = opts?.prefix;
      let total = 0;
      for (let i = 0; i < store.length; i++) {
        const k = store.key(i);
        if (k && (!prefix || k.startsWith(`${prefix}:`))) {
          total += (store.getItem(k)?.length ?? 0) + k.length;
        }
      }
      return total;
    } catch (error) {
      this.logger.error(`[storage:${this.area}] size() failed`, error);
      return 0;
    }
  }

  watch<T extends StorageValue>(key: string, opts: StorageOptions = {}): Observable<T | null> {
    const fullKey = this.getKey(key, opts);
    return this.events.events$.pipe(
      filter(
        (event) => event.storageArea === this.area && (event.key === null || event.key === fullKey),
      ),
      map((event) => event.newValue as T | null),
    );
  }

  native(): Storage {
    if (!this.isSupported()) {
      throw new Error(`${this.area} not supported in this environment`);
    }
    return this.getStore();
  }

  private getStore(): Storage {
    return this.area === 'localStorage' ? window.localStorage : window.sessionStorage;
  }

  private getKey(key: string, opts?: StorageOptions): string {
    const prefix = opts?.prefix ?? '';
    return prefix ? `${prefix}:${key}` : key;
  }

  private serializeValue(value: StorageValue, opts?: StorageOptions): string {
    if (opts?.serialize) return opts.serialize(value);
    return JSON.stringify(value);
  }

  private deserializeValue(value: string, opts?: StorageOptions): StorageValue | null {
    if (opts?.deserialize) return opts.deserialize(value);
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  private warnSecurityOnce(): void {
    const holder = globalThis as unknown as SecurityWarnedHolder;
    if (!holder[SECURITY_WARN_KEY]) holder[SECURITY_WARN_KEY] = new Set();
    if (holder[SECURITY_WARN_KEY]!.has(this.area)) return;
    holder[SECURITY_WARN_KEY]!.add(this.area);
    this.logger.warn(
      `[storage:${this.area}] access denied (SecurityError). Common causes: Safari private mode, ` +
        'sandboxed iframes, or browser storage disabled. Falling back to default values.',
    );
  }
}

/** Minimal typing helper for the namespace owner exposing both areas. */
export interface StorageOwnerSnapshot {
  local: Signal<StorageEvent | null>;
  session: Signal<StorageEvent | null>;
}
