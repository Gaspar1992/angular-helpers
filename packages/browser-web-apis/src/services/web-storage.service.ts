import { Injectable, inject, signal, DestroyRef } from '@angular/core';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, fromEvent } from 'rxjs';
import { map, distinctUntilChanged, filter } from 'rxjs/operators';
import { BrowserApiBaseService } from './base/browser-api-base.service';
import { StorageValue } from '../interfaces/common.types';

export interface StorageOptions {
  prefix?: string;
  serialize?: (value: StorageValue) => string;
  deserialize?: (value: string) => StorageValue;
}

export interface StorageEvent {
  key: string;
  newValue: StorageValue | null;
  oldValue: StorageValue | null;
  storageArea: 'localStorage' | 'sessionStorage';
}

@Injectable()
export class WebStorageService extends BrowserApiBaseService {
  private storageEvents = signal<StorageEvent | null>(null);
  protected override destroyRef = inject(DestroyRef);

  constructor() {
    super();
    this.setupEventListeners();
  }

  protected override getApiName(): string {
    return 'storage';
  }

  private ensureStorageSupport(): void {
    if (!this.isBrowserEnvironment() || typeof Storage === 'undefined') {
      throw new Error('Storage API not supported in this browser');
    }
  }

  private setupEventListeners(): void {
    if (this.isBrowserEnvironment()) {
      fromEvent(window, 'storage')
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((event: Event) => {
          const storageEvent = event as unknown as globalThis.StorageEvent;
          if (storageEvent.key && storageEvent.newValue !== null) {
            this.storageEvents.set({
              key: storageEvent.key,
              newValue: this.deserializeValue(storageEvent.newValue),
              oldValue: storageEvent.oldValue ? this.deserializeValue(storageEvent.oldValue) : null,
              storageArea:
                storageEvent.storageArea === localStorage ? 'localStorage' : 'sessionStorage',
            });
          }
        });
    }
  }

  private serializeValue(value: StorageValue, options?: StorageOptions): string {
    if (options?.serialize) {
      return options.serialize(value);
    }
    return JSON.stringify(value);
  }

  private deserializeValue(value: string | null, options?: StorageOptions): StorageValue | null {
    if (value === null) return null;

    if (options?.deserialize) {
      return options.deserialize(value);
    }

    try {
      return JSON.parse(value);
    } catch {
      return value as StorageValue;
    }
  }

  private getKey(key: string, options?: StorageOptions): string {
    const prefix = options?.prefix || '';
    return prefix ? `${prefix}:${key}` : key;
  }

  // Local Storage Methods
  setLocalStorage<T extends StorageValue>(
    key: string,
    value: T,
    options: StorageOptions = {},
  ): boolean {
    this.ensureStorageSupport();

    try {
      const serializedValue = this.serializeValue(value, options);
      const fullKey = this.getKey(key, options);
      localStorage.setItem(fullKey, serializedValue);
      return true;
    } catch (error) {
      console.error('[WebStorageService] Error setting localStorage:', error);
      return false;
    }
  }

  getLocalStorage<T extends StorageValue>(
    key: string,
    defaultValue: T | null = null,
    options: StorageOptions = {},
  ): T | null {
    this.ensureStorageSupport();

    try {
      const fullKey = this.getKey(key, options);
      const value = localStorage.getItem(fullKey);
      return value !== null ? (this.deserializeValue(value, options) as T) : defaultValue;
    } catch (error) {
      console.error('[WebStorageService] Error getting localStorage:', error);
      return defaultValue;
    }
  }

  removeLocalStorage(key: string, options: StorageOptions = {}): boolean {
    this.ensureStorageSupport();

    try {
      const fullKey = this.getKey(key, options);
      localStorage.removeItem(fullKey);
      return true;
    } catch (error) {
      console.error('[WebStorageService] Error removing localStorage:', error);
      return false;
    }
  }

  clearLocalStorage(options: StorageOptions = {}): boolean {
    this.ensureStorageSupport();

    try {
      const prefix = options?.prefix;
      if (prefix) {
        // Only remove keys with the specified prefix
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(`${prefix}:`)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key));
      } else {
        localStorage.clear();
      }
      return true;
    } catch (error) {
      console.error('[WebStorageService] Error clearing localStorage:', error);
      return false;
    }
  }

  // Session Storage Methods
  setSessionStorage<T extends StorageValue>(
    key: string,
    value: T,
    options: StorageOptions = {},
  ): boolean {
    this.ensureStorageSupport();

    try {
      const serializedValue = this.serializeValue(value, options);
      const fullKey = this.getKey(key, options);
      sessionStorage.setItem(fullKey, serializedValue);
      return true;
    } catch (error) {
      console.error('[WebStorageService] Error setting sessionStorage:', error);
      return false;
    }
  }

  getSessionStorage<T extends StorageValue>(
    key: string,
    defaultValue: T | null = null,
    options: StorageOptions = {},
  ): T | null {
    this.ensureStorageSupport();

    try {
      const fullKey = this.getKey(key, options);
      const value = sessionStorage.getItem(fullKey);
      return value !== null ? (this.deserializeValue(value, options) as T) : defaultValue;
    } catch (error) {
      console.error('[WebStorageService] Error getting sessionStorage:', error);
      return defaultValue;
    }
  }

  removeSessionStorage(key: string, options: StorageOptions = {}): boolean {
    this.ensureStorageSupport();

    try {
      const fullKey = this.getKey(key, options);
      sessionStorage.removeItem(fullKey);
      return true;
    } catch (error) {
      console.error('[WebStorageService] Error removing sessionStorage:', error);
      return false;
    }
  }

  clearSessionStorage(options: StorageOptions = {}): boolean {
    this.ensureStorageSupport();

    try {
      const prefix = options?.prefix;
      if (prefix) {
        // Only remove keys with the specified prefix
        const keysToRemove: string[] = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && key.startsWith(`${prefix}:`)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((key) => sessionStorage.removeItem(key));
      } else {
        sessionStorage.clear();
      }
      return true;
    } catch (error) {
      console.error('[WebStorageService] Error clearing sessionStorage:', error);
      return false;
    }
  }

  // Utility Methods
  getLocalStorageSize(options: StorageOptions = {}): number {
    this.ensureStorageSupport();

    let totalSize = 0;
    const prefix = options?.prefix;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (!prefix || key.startsWith(`${prefix}:`))) {
        totalSize += (localStorage.getItem(key)?.length || 0) + key.length;
      }
    }
    return totalSize;
  }

  getSessionStorageSize(options: StorageOptions = {}): number {
    this.ensureStorageSupport();

    let totalSize = 0;
    const prefix = options?.prefix;

    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (!prefix || key.startsWith(`${prefix}:`))) {
        totalSize += (sessionStorage.getItem(key)?.length || 0) + key.length;
      }
    }
    return totalSize;
  }

  getStorageEvents(): Observable<StorageEvent> {
    return toObservable(this.storageEvents).pipe(
      filter((event: StorageEvent | null): event is StorageEvent => event !== null),
      distinctUntilChanged(
        (prev, curr) =>
          prev.key === curr.key &&
          prev.newValue === curr.newValue &&
          prev.oldValue === curr.oldValue,
      ),
    );
  }

  watchLocalStorage<T extends StorageValue>(
    key: string,
    options: StorageOptions = {},
  ): Observable<T | null> {
    return this.getStorageEvents().pipe(
      map((event) => {
        const fullKey = this.getKey(key, options);
        if (event.key === fullKey && event.storageArea === 'localStorage') {
          return event.newValue as T;
        }
        return this.getLocalStorage<T>(key, null, options);
      }),
    );
  }

  watchSessionStorage<T extends StorageValue>(
    key: string,
    options: StorageOptions = {},
  ): Observable<T | null> {
    return this.getStorageEvents().pipe(
      map((event) => {
        const fullKey = this.getKey(key, options);
        if (event.key === fullKey && event.storageArea === 'sessionStorage') {
          return event.newValue as T;
        }
        return this.getSessionStorage<T>(key, null, options);
      }),
    );
  }

  // Direct access to native storage APIs
  getNativeLocalStorage(): Storage {
    this.ensureStorageSupport();
    return localStorage;
  }

  getNativeSessionStorage(): Storage {
    this.ensureStorageSupport();
    return sessionStorage;
  }
}
