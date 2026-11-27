import { describe, it, expect } from 'vitest';
import { Component, input, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import {
  render,
  provideMockService,
  provideMockActivatedRoute,
  mockCanvas2D,
  mockIndexedDB,
} from './public-api';

describe('testing hardening regressions', () => {
  it('supports Signal input() typing and EnvironmentProviders in render()', async () => {
    @Component({
      selector: 'ah-test-signal-host',
      template: `<p>{{ label() }}</p>`,
    })
    class SignalHostComponent {
      readonly label = input.required<string>();
    }

    const { query } = await render(SignalHostComponent, {
      providers: [provideZonelessChangeDetection()],
      inputs: { label: 'Zoneless Ready' },
    });

    expect(query('p')?.textContent).toBe('Zoneless Ready');
  });

  it('does not invoke prototype getters in provideMockService()', () => {
    class ServiceWithGetter {
      get dangerousGetter(): string {
        throw new Error('Getter invoked on prototype');
      }
      doWork(): string {
        return 'ok';
      }
    }

    TestBed.configureTestingModule({
      providers: [provideMockService(ServiceWithGetter)],
    });

    const svc = TestBed.inject(ServiceWithGetter);
    expect(typeof svc.doWork).toBe('function');
  });

  it('exposes paramMap and queryParamMap on MockActivatedRoute', () => {
    TestBed.configureTestingModule({
      providers: [
        provideMockActivatedRoute({
          params: { id: '42' },
          queryParams: { v: '22' },
        }),
      ],
    });

    const route = TestBed.inject(ActivatedRoute);
    expect(route.snapshot.paramMap.get('id')).toBe('42');
    expect(route.snapshot.queryParamMap.get('v')).toBe('22');
  });

  it('returns restore handle from mockCanvas2D() and fires onsuccess in mockIndexedDB().open()', async () => {
    const restoreCanvas = mockCanvas2D();
    expect(typeof restoreCanvas).toBe('function');
    restoreCanvas();

    const originalIdb = globalThis.indexedDB;
    Object.defineProperty(globalThis, 'indexedDB', {
      value: undefined,
      configurable: true,
      writable: true,
    });
    const restoreIdb = mockIndexedDB();
    try {
      const opened = await new Promise<IDBDatabase>((resolve) => {
        const req = globalThis.indexedDB.open('test-db', 1);
        req.onupgradeneeded = () => {
          req.result.objectStoreNames.contains('store');
          req.result.createObjectStore('store');
        };
        req.onsuccess = () => resolve(req.result);
      });
      const tx = opened.transaction('store', 'readwrite');
      const store = tx.objectStore('store');
      store.get('k');
      store.getAll();
      store.getAllKeys();
      store.put({});
      store.add({});
      store.delete('k');
      store.clear();
      store.count();
      store.openCursor();
      store.openKeyCursor();
      tx.abort();
      opened.close();
      globalThis.indexedDB.deleteDatabase('test-db');
      expect(globalThis.indexedDB.cmp('a', 'b')).toBe(-1);
      expect(globalThis.IDBKeyRange.lowerBound(1)).toEqual({ lower: 1 });
      expect(globalThis.IDBKeyRange.upperBound(5)).toEqual({ upper: 5 });
      expect(globalThis.IDBKeyRange.bound(1, 5)).toEqual({ lower: 1, upper: 5 });
      expect(globalThis.IDBKeyRange.only(3)).toEqual({ lower: 3, upper: 3 });
    } finally {
      restoreIdb();
      Object.defineProperty(globalThis, 'indexedDB', {
        value: originalIdb,
        configurable: true,
        writable: true,
      });
    }
  });
});
