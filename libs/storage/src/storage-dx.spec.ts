import { Component, effect, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, afterEach } from 'vitest';
import {
  provideStorage,
  injectStorageSignal,
  injectStorageResource,
  EntityStore,
} from './public-api';
import type { StorageTransport } from './services/storage-transport';

function createMemoryTransport(initial: Record<string, unknown>): StorageTransport {
  const store = new Map<string, unknown>(Object.entries(initial));
  return {
    read: async <T>(k: string) => store.get(k) as T | undefined,
    write: async <T>(k: string, v: T) => {
      store.set(k, v);
    },
    delete: async (k: string) => {
      store.delete(k);
    },
  };
}

describe('Storage DX (T2)', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('injectStorageSignal reacts to Signal<string> key changes', async () => {
    @Component({ template: '' })
    class KeyCmp {
      activeKey = signal('user:1');
      value = injectStorageSignal(this.activeKey, 'default');
    }

    const transport = createMemoryTransport({ 'user:1': 'Alice', 'user:2': 'Bob' });

    TestBed.configureTestingModule({
      imports: [KeyCmp],
      providers: [provideZonelessChangeDetection(), provideStorage({ transport })],
    });

    const fixture = TestBed.createComponent(KeyCmp);
    fixture.detectChanges();
    await Promise.resolve();
    await Promise.resolve();

    expect(fixture.componentInstance.value()).toBe('Alice');

    fixture.componentInstance.activeKey.set('user:2');
    fixture.detectChanges();
    await Promise.resolve();
    await Promise.resolve();

    expect(fixture.componentInstance.value()).toBe('Bob');
  });

  it('injectStorageResource reacts to Signal<string> key changes', async () => {
    @Component({ template: '' })
    class ResCmp {
      activeKey = signal('doc:a');
      res = injectStorageResource(this.activeKey, 'empty');
    }

    const transport = createMemoryTransport({ 'doc:a': 'First', 'doc:b': 'Second' });

    TestBed.configureTestingModule({
      imports: [ResCmp],
      providers: [provideZonelessChangeDetection(), provideStorage({ transport })],
    });

    const fixture = TestBed.createComponent(ResCmp);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.res.resource.value()).toBe('First');

    fixture.componentInstance.activeKey.set('doc:b');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.res.resource.value()).toBe('Second');
  });

  it('EntityStore.entitySignal is O(1) and does not re-run on unrelated entity writes', () => {
    interface User {
      id: string;
      name: string;
    }

    let reads = 0;

    @Component({ template: '' })
    class StoreCmp {
      store = new EntityStore<string, User>({ idKey: 'id' });
      missingSig = this.store.entitySignal('missing');

      constructor() {
        effect(() => {
          this.missingSig();
          reads++;
        });
      }
    }

    TestBed.configureTestingModule({
      imports: [StoreCmp],
      providers: [provideZonelessChangeDetection()],
    });

    const fixture = TestBed.createComponent(StoreCmp);
    fixture.detectChanges();
    expect(reads).toBe(1);

    // Unrelated writes should NOT trigger missingSig effect
    fixture.componentInstance.store.setOne({ id: 'other-1', name: 'One' });
    fixture.componentInstance.store.setOne({ id: 'other-2', name: 'Two' });
    fixture.detectChanges();
    expect(reads).toBe(1);

    // Writing 'missing' DOES trigger missingSig, and deleting resets it to undefined
    fixture.componentInstance.store.setOne({ id: 'missing', name: 'Found' });
    fixture.detectChanges();
    expect(reads).toBe(2);
    expect(fixture.componentInstance.missingSig()?.name).toBe('Found');

    fixture.componentInstance.store.deleteOne('missing');
    fixture.detectChanges();
    expect(reads).toBe(3);
    expect(fixture.componentInstance.missingSig()).toBeUndefined();
  });
});
