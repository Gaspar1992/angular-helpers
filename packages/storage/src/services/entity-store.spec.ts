import { describe, it, expect } from 'vitest';
import { computed } from '@angular/core';
import { EntityStore } from './entity-store';

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

  it('should support function-based updates (update)', () => {
    const store = new EntityStore<string, User>({ idKey: 'id' });
    store.setOne({ id: '1', name: 'Alice', age: 25 });

    store.update('1', (user) => ({ ...user, age: user.age + 1 }));

    expect(store.entities().get('1')?.age).toBe(26);
    expect(Object.isFrozen(store.entities().get('1'))).toBe(true);
  });

  it('should support partial patches (patch)', () => {
    const store = new EntityStore<string, User>({ idKey: 'id' });
    store.setOne({ id: '1', name: 'Alice', age: 25 });

    store.patch('1', { age: 30 });

    expect(store.entities().get('1')).toEqual({ id: '1', name: 'Alice', age: 30 });
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
});
