import { inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { fromEvent, Observable } from 'rxjs';
import { distinctUntilChanged, filter } from 'rxjs/operators';
import { BrowserApiBaseService } from './base/browser-api-base.service';
import type { BrowserCapabilityId } from './browser-capability.service';
import { BROWSER_API_LOGGER } from '../tokens/logger.token';
import type { StorageValue } from '../interfaces/common.types';
import {
  StorageNamespaceImpl,
  type StorageNamespace,
  type StorageOptions,
  type StorageEvent,
} from '../storage/storage-namespace';

export type { StorageOptions, StorageEvent } from '../storage/storage-namespace';
export type { StorageNamespace } from '../storage/storage-namespace';

let legacyDeprecationLogged = false;

/**
 * Web Storage service with two namespaces (`local`, `session`) sharing one method
 * surface. SecurityError-safe (Safari private mode, sandboxed iframes return defaults
 * instead of throwing).
 *
 * Preferred usage:
 * ```ts
 * const storage = inject(WebStorageService);
 * storage.local.set('user', { id: 1 });
 * const user = storage.local.get<{ id: number }>('user');
 * storage.local.watch<{ id: number }>('user').subscribe(console.log);
 * ```
 *
 * Legacy methods (`setLocalStorage`, `getLocalStorage`, etc.) remain as deprecated
 * wrappers for one minor cycle; removal slated for v22.
 */
@Injectable()
export class WebStorageService extends BrowserApiBaseService {
  private readonly storageLogger = inject(BROWSER_API_LOGGER);
  private storageEvents = signal<StorageEvent | null>(null);

  private readonly eventBus = {
    emit: (event: StorageEvent) => this.storageEvents.set(event),
    events$: toObservable(this.storageEvents).pipe(
      filter((event): event is StorageEvent => event !== null),
      distinctUntilChanged(
        (a, b) =>
          a.key === b.key &&
          a.newValue === b.newValue &&
          a.oldValue === b.oldValue &&
          a.storageArea === b.storageArea,
      ),
    ),
  };

  /** Local storage namespace. */
  readonly local: StorageNamespace = new StorageNamespaceImpl(
    'localStorage',
    this.eventBus,
    this.storageLogger,
  );

  /** Session storage namespace. */
  readonly session: StorageNamespace = new StorageNamespaceImpl(
    'sessionStorage',
    this.eventBus,
    this.storageLogger,
  );

  constructor() {
    super();
    this.setupCrossTabListener();
  }

  protected override getApiName(): string {
    return 'storage';
  }

  protected override getCapabilityId(): BrowserCapabilityId {
    return 'webStorage';
  }

  /** Returns true if either local or session storage is usable. */
  override isSupported(): boolean {
    return this.local.isSupported() || this.session.isSupported();
  }

  /** Stream of every storage mutation observed in this tab or other tabs. */
  getStorageEvents(): Observable<StorageEvent> {
    return this.eventBus.events$;
  }

  private setupCrossTabListener(): void {
    if (!this.isBrowserEnvironment()) return;
    fromEvent<globalThis.StorageEvent>(window, 'storage')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        const area: 'localStorage' | 'sessionStorage' =
          event.storageArea === window.localStorage ? 'localStorage' : 'sessionStorage';
        this.storageEvents.set({
          key: event.key,
          newValue: event.newValue ? this.safeParse(event.newValue) : null,
          oldValue: event.oldValue ? this.safeParse(event.oldValue) : null,
          storageArea: area,
        });
      });
  }

  private safeParse(value: string): StorageValue {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  // ---------- legacy API (deprecated) ----------

  /** @deprecated Use `storage.local.set(key, value, opts)`. Removed in v22. */
  setLocalStorage<T extends StorageValue>(
    key: string,
    value: T,
    options: StorageOptions = {},
  ): boolean {
    this.warnLegacyOnce();
    return this.local.set(key, value, options);
  }

  /** @deprecated Use `storage.local.get(key, defaultValue, opts)`. Removed in v22. */
  getLocalStorage<T extends StorageValue>(
    key: string,
    defaultValue: T | null = null,
    options: StorageOptions = {},
  ): T | null {
    this.warnLegacyOnce();
    return this.local.get<T>(key, defaultValue, options);
  }

  /** @deprecated Use `storage.local.remove(key, opts)`. Removed in v22. */
  removeLocalStorage(key: string, options: StorageOptions = {}): boolean {
    this.warnLegacyOnce();
    return this.local.remove(key, options);
  }

  /** @deprecated Use `storage.local.clear(opts)`. Removed in v22. */
  clearLocalStorage(options: StorageOptions = {}): boolean {
    this.warnLegacyOnce();
    return this.local.clear(options);
  }

  /** @deprecated Use `storage.session.set(key, value, opts)`. Removed in v22. */
  setSessionStorage<T extends StorageValue>(
    key: string,
    value: T,
    options: StorageOptions = {},
  ): boolean {
    this.warnLegacyOnce();
    return this.session.set(key, value, options);
  }

  /** @deprecated Use `storage.session.get(key, defaultValue, opts)`. Removed in v22. */
  getSessionStorage<T extends StorageValue>(
    key: string,
    defaultValue: T | null = null,
    options: StorageOptions = {},
  ): T | null {
    this.warnLegacyOnce();
    return this.session.get<T>(key, defaultValue, options);
  }

  /** @deprecated Use `storage.session.remove(key, opts)`. Removed in v22. */
  removeSessionStorage(key: string, options: StorageOptions = {}): boolean {
    this.warnLegacyOnce();
    return this.session.remove(key, options);
  }

  /** @deprecated Use `storage.session.clear(opts)`. Removed in v22. */
  clearSessionStorage(options: StorageOptions = {}): boolean {
    this.warnLegacyOnce();
    return this.session.clear(options);
  }

  /** @deprecated Use `storage.local.size(opts)`. Removed in v22. */
  getLocalStorageSize(options: StorageOptions = {}): number {
    this.warnLegacyOnce();
    return this.local.size(options);
  }

  /** @deprecated Use `storage.session.size(opts)`. Removed in v22. */
  getSessionStorageSize(options: StorageOptions = {}): number {
    this.warnLegacyOnce();
    return this.session.size(options);
  }

  /** @deprecated Use `storage.local.watch<T>(key, opts)`. Removed in v22. */
  watchLocalStorage<T extends StorageValue>(
    key: string,
    options: StorageOptions = {},
  ): Observable<T | null> {
    this.warnLegacyOnce();
    return this.local.watch<T>(key, options);
  }

  /** @deprecated Use `storage.session.watch<T>(key, opts)`. Removed in v22. */
  watchSessionStorage<T extends StorageValue>(
    key: string,
    options: StorageOptions = {},
  ): Observable<T | null> {
    this.warnLegacyOnce();
    return this.session.watch<T>(key, options);
  }

  /** @deprecated Use `storage.local.native()`. Removed in v22. */
  getNativeLocalStorage(): Storage {
    this.warnLegacyOnce();
    return this.local.native();
  }

  /** @deprecated Use `storage.session.native()`. Removed in v22. */
  getNativeSessionStorage(): Storage {
    this.warnLegacyOnce();
    return this.session.native();
  }

  private warnLegacyOnce(): void {
    if (legacyDeprecationLogged) return;
    legacyDeprecationLogged = true;
    this.storageLogger.warn(
      '[storage] WebStorageService.{set,get,remove,clear,watch}{Local,Session}Storage are ' +
        'deprecated. Use storage.local and storage.session namespaces. Legacy methods will be ' +
        'removed in v22.',
    );
  }
}
