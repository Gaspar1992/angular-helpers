import { Injectable, signal, OnDestroy } from '@angular/core';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, fromEvent } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { BrowserApiBaseService } from './base/browser-api-base.service';

export interface StorageOptions {
  prefix?: string;
  serialize?: (value: any) => string;
  deserialize?: (value: string) => any;
}

export interface StorageEvent {
  key: string;
  newValue: any;
  oldValue: any;
  storageArea: 'localStorage' | 'sessionStorage';
}

@Injectable()
export class WebStorageService extends BrowserApiBaseService implements OnDestroy {
  private storageEvents = signal<StorageEvent | null>(null);

  constructor() {
    super();
    this.checkSupport();
    this.setupEventListeners();
  }

  protected override getApiName(): string {
    return 'storage';
  }

  override isSupported(): boolean {
    return this.isBrowserEnvironment() && typeof Storage !== 'undefined';
  }

  private checkSupport(): void {
    // Already handled by isSupported()
  }

  private setupEventListeners(): void {
    if (this.isBrowserEnvironment()) {
      fromEvent(window, 'storage').pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe((event: any) => {
        if (event.key && event.newValue !== null) {
          this.storageEvents.set({
            key: event.key,
            newValue: event.newValue,
            oldValue: event.oldValue,
            storageArea: event.storageArea === localStorage ? 'localStorage' : 'sessionStorage'
          });
        }
      });
    }
  }

  isStorageSupported(): boolean {
    return this.isSupported();
  }

  // Local Storage Methods
  setLocalStorage(key: string, value: any, options: StorageOptions = {}): boolean {
    if (!this.isSupported()) return false;

    try {
      const { prefix = '', serialize = JSON.stringify } = options;
      const fullKey = prefix ? `${prefix}:${key}` : key;
      const serializedValue = serialize(value);
      localStorage.setItem(fullKey, serializedValue);
      return true;
    } catch (error) {
      console.error('Error setting localStorage:', error);
      return false;
    }
  }

  getLocalStorage<T = any>(key: string, defaultValue: T | null = null, options: StorageOptions = {}): T | null {
    if (!this.isSupported()) return defaultValue;

    try {
      const { prefix = '', deserialize = JSON.parse } = options;
      const fullKey = prefix ? `${prefix}:${key}` : key;
      const value = localStorage.getItem(fullKey);
      
      if (value === null) return defaultValue;
      
      return deserialize(value);
    } catch (error) {
      console.error('Error getting localStorage:', error);
      return defaultValue;
    }
  }

  removeLocalStorage(key: string, options: StorageOptions = {}): boolean {
    if (!this.isSupported()) return false;

    try {
      const { prefix = '' } = options;
      const fullKey = prefix ? `${prefix}:${key}` : key;
      localStorage.removeItem(fullKey);
      return true;
    } catch (error) {
      console.error('Error removing localStorage:', error);
      return false;
    }
  }

  clearLocalStorage(prefix?: string): boolean {
    if (!this.isSupported()) return false;

    try {
      if (prefix) {
        // Clear only keys with the specified prefix
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(`${prefix}:`)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      } else {
        localStorage.clear();
      }
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }

  // Session Storage Methods
  setSessionStorage(key: string, value: any, options: StorageOptions = {}): boolean {
    if (!this.isSupported()) return false;

    try {
      const { prefix = '', serialize = JSON.stringify } = options;
      const fullKey = prefix ? `${prefix}:${key}` : key;
      const serializedValue = serialize(value);
      sessionStorage.setItem(fullKey, serializedValue);
      return true;
    } catch (error) {
      console.error('Error setting sessionStorage:', error);
      return false;
    }
  }

  getSessionStorage<T = any>(key: string, defaultValue: T | null = null, options: StorageOptions = {}): T | null {
    if (!this.isSupported()) return defaultValue;

    try {
      const { prefix = '', deserialize = JSON.parse } = options;
      const fullKey = prefix ? `${prefix}:${key}` : key;
      const value = sessionStorage.getItem(fullKey);
      
      if (value === null) return defaultValue;
      
      return deserialize(value);
    } catch (error) {
      console.error('Error getting sessionStorage:', error);
      return defaultValue;
    }
  }

  removeSessionStorage(key: string, options: StorageOptions = {}): boolean {
    if (!this.isSupported()) return false;

    try {
      const { prefix = '' } = options;
      const fullKey = prefix ? `${prefix}:${key}` : key;
      sessionStorage.removeItem(fullKey);
      return true;
    } catch (error) {
      console.error('Error removing sessionStorage:', error);
      return false;
    }
  }

  clearSessionStorage(prefix?: string): boolean {
    if (!this.isSupported()) return false;

    try {
      if (prefix) {
        // Clear only keys with the specified prefix
        const keysToRemove: string[] = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && key.startsWith(`${prefix}:`)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => sessionStorage.removeItem(key));
      } else {
        sessionStorage.clear();
      }
      return true;
    } catch (error) {
      console.error('Error clearing sessionStorage:', error);
      return false;
    }
  }

  // Utility Methods
  getLocalStorageSize(): number {
    if (!this.isSupported()) return 0;

    let totalSize = 0;
    for (let key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
        totalSize += localStorage[key].length + key.length;
      }
    }
    return totalSize;
  }

  getSessionStorageSize(): number {
    if (!this.isSupported()) return 0;

    let totalSize = 0;
    for (let key in sessionStorage) {
      if (Object.prototype.hasOwnProperty.call(sessionStorage, key)) {
        totalSize += sessionStorage[key].length + key.length;
      }
    }
    return totalSize;
  }

  getLocalStorageKeys(prefix?: string): string[] {
    if (!this.isSupported()) return [];

    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (!prefix || key.startsWith(`${prefix}:`))) {
        keys.push(key);
      }
    }
    return keys;
  }

  getSessionStorageKeys(prefix?: string): string[] {
    if (!this.isSupported()) return [];

    const keys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (!prefix || key.startsWith(`${prefix}:`))) {
        keys.push(key);
      }
    }
    return keys;
  }

  // Reactive Methods
  getStorageEvents(): Observable<StorageEvent> {
    return toObservable(this.storageEvents).pipe(
      map(event => event as StorageEvent),
      distinctUntilChanged((prev, curr) => 
        prev?.key === curr?.key && 
        prev?.newValue === curr?.newValue
      )
    );
  }

  watchLocalStorage<T = any>(key: string, options: StorageOptions = {}): Observable<T | null> {
    return this.getStorageEvents().pipe(
      map(event => {
        if (event.key === key && event.storageArea === 'localStorage') {
          return event.newValue;
        }
        return this.getLocalStorage<T>(key, null, options);
      })
    );
  }

  watchSessionStorage<T = any>(key: string, options: StorageOptions = {}): Observable<T | null> {
    return this.getStorageEvents().pipe(
      map(event => {
        if (event.key === key && event.storageArea === 'sessionStorage') {
          return event.newValue;
        }
        return this.getSessionStorage<T>(key, null, options);
      })
    );
  }

  // Convenience methods for common patterns
  setUserPreferences(prefs: Record<string, any>): boolean {
    return this.setLocalStorage('userPreferences', prefs, { prefix: 'app' });
  }

  getUserPreferences<T = any>(): T | null {
    return this.getLocalStorage<T>('userPreferences', null, { prefix: 'app' });
  }

  setAuthToken(token: string): boolean {
    return this.setSessionStorage('authToken', token, { prefix: 'auth' });
  }

  getAuthToken(): string | null {
    return this.getSessionStorage<string>('authToken', null, { prefix: 'auth' });
  }

  removeAuthToken(): boolean {
    return this.removeSessionStorage('authToken', { prefix: 'auth' });
  }

  ngOnDestroy(): void {
    // No manual cleanup needed with takeUntilDestroyed
  }
}
