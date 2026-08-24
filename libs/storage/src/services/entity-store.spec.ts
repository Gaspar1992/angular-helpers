import { describe, it, expect, vi } from 'vitest';
import { computed } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EntityStore, injectEntityStore } from './entity-store';
import { STORAGE_TRANSPORT } from '../tokens/storage.tokens';
import { StorageTransport } from './storage-transport';

interface User {
  id: string;
  name: string;
  age: number;
}

describe('EntityStore', () => {
  it('should support basic read and write operations', () => {
    const store = new EntityStore<string, User>({ idKey: 'id' });

    store.setOne({ id: '1', name: 'Alice', age: 25 });

    expect(store.size()).toBe(1);
    expect(store.ids()).toEqual(['1']);
    expect(store.list()).toEqual([{ id: '1', name: 'Alice', age: 25 }]);
  });

  it('should support custom function as idKey resolver', () => {
    interface CustomItem {
      uuid: number;
      label: string;
    }

    const store = new EntityStore<number, CustomItem>({
      idKey: (item) => item.uuid,
    });

    store.setOne({ uuid: 42, label: 'Answer' });
    expect(store.ids()).toEqual([42]);
    expect(store.entities().get(42)).toEqual({ uuid: 42, label: 'Answer' });
  });

  it('should freeze the entity when writing (Write-Once, Freeze-Once)', () => {
    const store = new EntityStore<string, User>({ idKey: 'id' });
    const user: User = { id: '1', name: 'Alice', age: 25 };

    store.setOne(user);

    const storedUser = store.entities().get('1');
    expect(storedUser).toBeDefined();
    expect(Object.isFrozen(storedUser)).toBe(true);

    // Attempting to mutate a property of the frozen object should throw in strict mode
    expect(() => {
      (storedUser as any).age = 26;
    }).toThrow();
  });

  it('should support reactive deletes and clears', () => {
    const store = new EntityStore<string, User>({ idKey: 'id' });

    store.setMany([
      { id: '1', name: 'Alice', age: 25 },
      { id: '2', name: 'Bob', age: 30 },
    ]);

    expect(store.size()).toBe(2);

    store.deleteOne('1');
    expect(store.size()).toBe(1);
    expect(store.entities().has('1')).toBe(false);
    expect(store.entities().has('2')).toBe(true);

    store.clear();
    expect(store.size()).toBe(0);
    expect(store.list()).toEqual([]);
  });

  it('should early return when deleting non-existent id', () => {
    const store = new EntityStore<string, User>({ idKey: 'id' });
    store.setOne({ id: '1', name: 'Alice', age: 25 });

    store.deleteOne('non-existent');
    expect(store.size()).toBe(1);
  });

  it('should clean up internal signals when entities are deleted to prevent memory leaks', () => {
    const store = new EntityStore<string, User>({ idKey: 'id' });
    const signalsMap = (store as any)._entitySignals as Map<string, any>;

    store.setOne({ id: '1', name: 'Alice', age: 25 });
    store.entitySignal('1');
    expect(signalsMap.size).toBe(1);

    store.deleteOne('1');
    expect(signalsMap.size).toBe(0);

    store.setMany([
      { id: '1', name: 'Alice', age: 25 },
      { id: '2', name: 'Bob', age: 30 },
    ]);
    store.entitySignal('1');
    store.entitySignal('2');
    expect(signalsMap.size).toBe(2);

    store.clear();
    expect(signalsMap.size).toBe(0);
  });

  it('should support function-based updates (update) and ignore non-existent ids', () => {
    const store = new EntityStore<string, User>({ idKey: 'id' });
    store.setOne({ id: '1', name: 'Alice', age: 25 });

    store.update('1', (user) => ({ ...user, age: user.age + 1 }));
    expect(store.entities().get('1')?.age).toBe(26);
    expect(Object.isFrozen(store.entities().get('1'))).toBe(true);

    // Non-existent id update
    store.update('999', (user) => ({ ...user, age: 99 }));
    expect(store.entities().has('999')).toBe(false);
  });

  it('should support partial patches (patch) and ignore non-existent ids', () => {
    const store = new EntityStore<string, User>({ idKey: 'id' });
    store.setOne({ id: '1', name: 'Alice', age: 25 });

    store.patch('1', { age: 30 });
    expect(store.entities().get('1')).toEqual({ id: '1', name: 'Alice', age: 30 });

    // Non-existent id patch
    store.patch('999', { age: 50 });
    expect(store.entities().has('999')).toBe(false);
  });

  it('should update pre-existing granular signal when entity is added later', () => {
    const store = new EntityStore<string, User>({ idKey: 'id' });
    const sig = store.entitySignal('1');

    expect(sig()).toBeUndefined();

    store.setOne({ id: '1', name: 'Alice', age: 25 });
    expect(sig()).toEqual({ id: '1', name: 'Alice', age: 25 });
  });

  it('should ensure surgical granular reactivity via entitySignal', () => {
    const store = new EntityStore<string, User>({ idKey: 'id' });

    store.setMany([
      { id: 'A', name: 'Alice', age: 25 },
      { id: 'B', name: 'Bob', age: 30 },
    ]);

    const sigB = store.entitySignal('B');
    let evaluations = 0;

    // Create a computed that only depends on B's granular signal
    const computedB = computed(() => {
      evaluations++;
      return sigB();
    });

    // 1. Initial read of computed (subscribes)
    expect(computedB()).toEqual({ id: 'B', name: 'Bob', age: 30 });
    expect(evaluations).toBe(1);

    // 2. Modify entity A
    store.setOne({ id: 'A', name: 'Alice Mutated', age: 26 });

    // 3. Read again - computedB should NOT have re-evaluated because B didn't change!
    expect(computedB()).toEqual({ id: 'B', name: 'Bob', age: 30 });
    expect(evaluations).toBe(1); // Still 1!

    // 4. Modify entity B
    store.setOne({ id: 'B', name: 'Bob Mutated', age: 31 });

    // 5. Read again - now it should have run again
    expect(computedB()).toEqual({ id: 'B', name: 'Bob Mutated', age: 31 });
    expect(evaluations).toBe(2); // Updated!
  });

  describe('Persistence & Schema Drift', () => {
    let mockTransport: StorageTransport;

    beforeEach(() => {
      mockTransport = {
        read: vi.fn().mockResolvedValue([]),
        write: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined),
      };
    });

    it('should restore persisted entities on init and debounce write persistence on modifications', async () => {
      const persistedUsers: User[] = [
        { id: '1', name: 'Alice', age: 25 },
        { id: '2', name: 'Bob', age: 30 },
      ];
      mockTransport.read = vi.fn().mockResolvedValue(persistedUsers);

      await TestBed.runInInjectionContext(async () => {
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [{ provide: STORAGE_TRANSPORT, useValue: mockTransport }],
        });

        const store = TestBed.runInInjectionContext(
          () =>
            new EntityStore<string, User>({
              idKey: 'id',
              persistKey: 'users_store',
              storageOptions: { storageType: 'local', serializer: 'json' },
            }),
        );

        // Wait for restore promise microtask
        await new Promise((resolve) => setTimeout(resolve, 10));

        expect(store.size()).toBe(2);
        expect(store.list()).toEqual(persistedUsers);

        // Perform multiple writes
        store.setOne({ id: '3', name: 'Charlie', age: 35 });
        store.patch('1', { age: 26 });

        // Wait for microtask debounced write
        await new Promise((resolve) => setTimeout(resolve, 10));

        expect(mockTransport.write).toHaveBeenCalledWith(
          'users_store',
          expect.arrayContaining([
            expect.objectContaining({ id: '1', age: 26 }),
            expect.objectContaining({ id: '2', age: 30 }),
            expect.objectContaining({ id: '3', age: 35 }),
          ]),
          expect.any(Object),
        );
      });
    });

    it('should filter out invalid items on schema drift during restore and trigger auto-repair', async () => {
      const mixedData = [
        { id: '1', name: 'Valid User', age: 20 },
        { id: '2', corrupted: true }, // Invalid
      ];
      mockTransport.read = vi.fn().mockResolvedValue(mixedData);
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await TestBed.runInInjectionContext(async () => {
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [{ provide: STORAGE_TRANSPORT, useValue: mockTransport }],
        });

        const store = TestBed.runInInjectionContext(
          () =>
            new EntityStore<string, User>({
              idKey: 'id',
              persistKey: 'users_store_drift',
              storageOptions: {
                storageType: 'local',
                serializer: 'json',
                validator: (item: any): item is User =>
                  typeof item?.id === 'string' && typeof item?.name === 'string',
              },
            }),
        );

        await new Promise((resolve) => setTimeout(resolve, 20));

        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining(
            '[EntityStore] Schema drift detected for item in store: users_store_drift',
          ),
        );
        expect(store.size()).toBe(1);
        expect(store.list()).toEqual([{ id: '1', name: 'Valid User', age: 20 }]);

        // Should have triggered auto-repair persistence with only the valid item
        expect(mockTransport.write).toHaveBeenCalledWith(
          'users_store_drift',
          [{ id: '1', name: 'Valid User', age: 20 }],
          expect.any(Object),
        );
      });

      consoleWarnSpy.mockRestore();
    });

    it('should handle persistence read error gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockTransport.read = vi.fn().mockRejectedValue(new Error('Storage disk unreadable'));

      await TestBed.runInInjectionContext(async () => {
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [{ provide: STORAGE_TRANSPORT, useValue: mockTransport }],
        });

        const store = TestBed.runInInjectionContext(
          () =>
            new EntityStore<string, User>({
              idKey: 'id',
              persistKey: 'err_store',
            }),
        );

        await new Promise((resolve) => setTimeout(resolve, 10));
        expect(store.size()).toBe(0);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('[EntityStore] Error loading persisted entities:'),
          expect.any(Error),
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it('should handle persistence write error gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockTransport.write = vi.fn().mockRejectedValue(new Error('Storage disk write failed'));

      await TestBed.runInInjectionContext(async () => {
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [{ provide: STORAGE_TRANSPORT, useValue: mockTransport }],
        });

        const store = TestBed.runInInjectionContext(
          () =>
            new EntityStore<string, User>({
              idKey: 'id',
              persistKey: 'write_err_store',
            }),
        );

        // Wait for initial restore to finish
        await new Promise((resolve) => setTimeout(resolve, 10));

        store.setOne({ id: '1', name: 'Test', age: 10 });
        await new Promise((resolve) => setTimeout(resolve, 10));

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('[EntityStore] Error saving persisted entities:'),
          expect.any(Error),
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });
});

describe('injectEntityStore', () => {
  it('should throw an error when called outside of an injection context', () => {
    expect(() => injectEntityStore({ idKey: 'id' })).toThrow(/injectEntityStore/);
  });

  it('should instantiate EntityStore successfully inside injection context', () => {
    TestBed.runInInjectionContext(() => {
      const store = injectEntityStore<string, User>({ idKey: 'id' });
      expect(store).toBeInstanceOf(EntityStore);
    });
  });
});
