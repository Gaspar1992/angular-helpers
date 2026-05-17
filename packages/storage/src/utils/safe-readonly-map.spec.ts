import { describe, it, expect } from 'vitest';
import { SafeReadonlyMap } from './safe-readonly-map';

describe('SafeReadonlyMap', () => {
  it('debe permitir operaciones de lectura estándar', () => {
    const rawMap = new Map<string, { id: number; name: string }>();
    rawMap.set('1', { id: 1, name: 'Alice' });

    const safeMap = new SafeReadonlyMap(rawMap);

    expect(safeMap.size).toBe(1);
    expect(safeMap.has('1')).toBe(true);
    expect(safeMap.has('2')).toBe(false);
    expect(safeMap.get('1')).toEqual({ id: 1, name: 'Alice' });
  });

  it('debe arrojar error en tiempo de ejecución al intentar mutar el mapa mediante cast a any', () => {
    const rawMap = new Map<string, string>();
    rawMap.set('key', 'value');

    const safeMap = new SafeReadonlyMap(rawMap);
    const untypedMap = safeMap as any;

    expect(() => untypedMap.set('newKey', 'newValue')).toThrow();
    expect(() => untypedMap.delete('key')).toThrow();
    expect(() => untypedMap.clear()).toThrow();
  });

  it('debe soportar iteraciones de forma correcta', () => {
    const rawMap = new Map<string, string>();
    rawMap.set('k1', 'v1');
    rawMap.set('k2', 'v2');

    const safeMap = new SafeReadonlyMap(rawMap);

    const keys = Array.from(safeMap.keys());
    expect(keys).toEqual(['k1', 'k2']);

    const values = Array.from(safeMap.values());
    expect(values).toEqual(['v1', 'v2']);

    const entries = Array.from(safeMap.entries());
    expect(entries).toEqual([
      ['k1', 'v1'],
      ['k2', 'v2'],
    ]);

    let count = 0;
    safeMap.forEach((v, k) => {
      count++;
      expect(rawMap.get(k)).toBe(v);
    });
    expect(count).toBe(2);
  });
});
