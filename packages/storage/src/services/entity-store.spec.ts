import { describe, it, expect } from 'vitest';
import { computed } from '@angular/core';
import { EntityStore } from './entity-store';

interface User {
  id: string;
  name: string;
  age: number;
}

describe('EntityStore', () => {
  it('debe admitir operaciones de escritura y lectura básicas', () => {
    const store = new EntityStore<string, User>({ idKey: 'id' });

    store.setOne({ id: '1', name: 'Alice', age: 25 });

    expect(store.size()).toBe(1);
    expect(store.ids()).toEqual(['1']);
    expect(store.list()).toEqual([{ id: '1', name: 'Alice', age: 25 }]);
  });

  it('debe congelar la entidad al escribirla (Write-Once, Freeze-Once)', () => {
    const store = new EntityStore<string, User>({ idKey: 'id' });
    const user: User = { id: '1', name: 'Alice', age: 25 };

    store.setOne(user);

    const storedUser = store.entities().get('1');
    expect(storedUser).toBeDefined();
    expect(Object.isFrozen(storedUser)).toBe(true);

    // Intentar mutar una propiedad del objeto congelado debe fallar en modo estricto
    expect(() => {
      (storedUser as any).age = 26;
    }).toThrow();
  });

  it('debe admitir borrados y limpiezas de forma reactiva', () => {
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

  it('debe asegurar reactividad granular quirurgica mediante entitySignal', () => {
    const store = new EntityStore<string, User>({ idKey: 'id' });

    store.setMany([
      { id: 'A', name: 'Alice', age: 25 },
      { id: 'B', name: 'Bob', age: 30 },
    ]);

    const sigB = store.entitySignal('B');
    let evaluations = 0;

    // Crear un computed que solo depende del signal granular de B
    const computedB = computed(() => {
      evaluations++;
      return sigB();
    });

    // 1. Lectura inicial del computed (se suscribe)
    expect(computedB()).toEqual({ id: 'B', name: 'Bob', age: 30 });
    expect(evaluations).toBe(1);

    // 2. Modificamos la entidad A
    store.setOne({ id: 'A', name: 'Alice Mutada', age: 26 });

    // 3. Volvemos a leer - ¡no debe haberse re-evaluado computedB porque B no cambió!
    expect(computedB()).toEqual({ id: 'B', name: 'Bob', age: 30 });
    expect(evaluations).toBe(1); // Sigue en 1!

    // 4. Modificamos la entidad B
    store.setOne({ id: 'B', name: 'Bob Mutado', age: 31 });

    // 5. Volvemos a leer - ahora sí debe haber corrido de nuevo
    expect(computedB()).toEqual({ id: 'B', name: 'Bob Mutado', age: 31 });
    expect(evaluations).toBe(2); // Se actualizó!
  });
});
