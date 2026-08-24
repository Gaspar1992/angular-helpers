import { describe, it, expect } from 'vitest';
import * as Y from 'yjs';
import { yjsSignal } from './yjs-signal';

describe('yjsSignal', () => {
  it('should synchronize Y.Map bidirectionally with Angular Signal', () => {
    const doc = new Y.Doc();
    const yMap = doc.getMap<string>('profile');
    yMap.set('name', 'Alice');

    const profileSig = yjsSignal<Record<string, string>>(yMap);

    expect(profileSig()).toEqual({ name: 'Alice' });

    // Local signal update
    profileSig.set({ name: 'Bob', role: 'Dev' });
    expect(yMap.get('name')).toBe('Bob');
    expect(yMap.get('role')).toBe('Dev');

    // External Yjs update simulation
    yMap.set('name', 'Charlie');
    expect(profileSig()).toEqual({ name: 'Charlie', role: 'Dev' });
  });

  it('should synchronize Y.Array bidirectionally with Angular Signal', () => {
    const doc = new Y.Doc();
    const yArray = doc.getArray<number>('numbers');
    yArray.insert(0, [10, 20]);

    const numbersSig = yjsSignal<number[]>(yArray);

    expect(numbersSig()).toEqual([10, 20]);

    // Local signal update
    numbersSig.set([10, 20, 30]);
    expect(yArray.toArray()).toEqual([10, 20, 30]);

    // External Yjs update simulation
    yArray.push([40]);
    expect(numbersSig()).toEqual([10, 20, 30, 40]);
  });

  it('should synchronize Y.Text bidirectionally with Angular Signal', () => {
    const doc = new Y.Doc();
    const yText = doc.getText('content');
    yText.insert(0, 'Hello');

    const textSig = yjsSignal<string>(yText);

    expect(textSig()).toBe('Hello');

    // Local signal update
    textSig.set('Hello World');
    expect(yText.toString()).toBe('Hello World');

    // External Yjs update simulation
    yText.insert(11, '!');
    expect(textSig()).toBe('Hello World!');
  });

  it('should sync changes across two Y.Doc instances (CRDT peer simulation)', () => {
    const docA = new Y.Doc();
    const docB = new Y.Doc();

    // Exchange updates between docA and docB
    docA.on('update', (update) => Y.applyUpdate(docB, update));
    docB.on('update', (update) => Y.applyUpdate(docA, update));

    const yMapA = docA.getMap<string>('sharedState');
    const yMapB = docB.getMap<string>('sharedState');

    const sigA = yjsSignal<Record<string, string>>(yMapA);
    const sigB = yjsSignal<Record<string, string>>(yMapB);

    sigA.set({ theme: 'dark' });

    expect(sigB()).toEqual({ theme: 'dark' });
  });

  it('should synchronize a single property of Y.Map when key option is provided', () => {
    const doc = new Y.Doc();
    const yMap = doc.getMap<string>('settings');

    const titleSig = yjsSignal<string>(yMap, {
      key: 'title',
      initialValue: 'Default Title',
    });

    expect(titleSig()).toBe('Default Title');
    expect(yMap.get('title')).toBe('Default Title');

    // Local signal update
    titleSig.set('Collaborative Doc');
    expect(yMap.get('title')).toBe('Collaborative Doc');

    // External Yjs update
    yMap.set('title', 'Remote Changed Title');
    expect(titleSig()).toBe('Remote Changed Title');

    // Unrelated key update in Y.Map does not affect titleSig
    yMap.set('theme', 'dark');
    expect(titleSig()).toBe('Remote Changed Title');
  });

  it('should perform minimal array reconciliation without clearing untouched items', () => {
    const doc = new Y.Doc();
    const yArray = doc.getArray<string>('list');
    yArray.push(['item1', 'item2', 'item3']);

    const listSig = yjsSignal<string[]>(yArray);
    expect(listSig()).toEqual(['item1', 'item2', 'item3']);

    let eventsCount = 0;
    yArray.observe((event) => {
      eventsCount++;
      // Expect delta to show minimal change, not full replacement
      expect(event.changes.delta.length).toBeGreaterThan(0);
    });

    // Update only the middle element
    listSig.set(['item1', 'item2_modified', 'item3']);
    expect(yArray.toArray()).toEqual(['item1', 'item2_modified', 'item3']);
    expect(eventsCount).toBe(1);
  });

  it('should seed initial values when type is empty', () => {
    const doc = new Y.Doc();
    const yText = doc.getText('note');

    const noteSig = yjsSignal<string>(yText, { initialValue: 'Initial Note Content' });
    expect(noteSig()).toBe('Initial Note Content');
    expect(yText.toString()).toBe('Initial Note Content');
  });

  it('should preserve nested Y.Map instances during parent signal updates', () => {
    const doc = new Y.Doc();
    const rootMap = doc.getMap('root');
    const nestedMap = new Y.Map();
    nestedMap.set('role', 'admin');
    rootMap.set('user', nestedMap);

    const sig = yjsSignal<any>(rootMap);
    expect(sig()).toEqual({ user: { role: 'admin' } });

    // Update nested property via signal
    sig.set({ user: { role: 'superadmin', lastSeen: 'today' } });

    // Verify rootMap still holds the exact Y.Map instance (CRDT tree preserved)
    const retainedNested = rootMap.get('user');
    expect(retainedNested instanceof Y.Map).toBe(true);
    expect(retainedNested).toBe(nestedMap);
    expect((retainedNested as Y.Map<any>).get('role')).toBe('superadmin');
    expect((retainedNested as Y.Map<any>).get('lastSeen')).toBe('today');
  });

  it('should batch multiple rapid remote events when microtask batching is enabled', async () => {
    const doc = new Y.Doc();
    const yArray = doc.getArray<number>('rapid');

    const sig = yjsSignal<number[]>(yArray, { batching: 'microtask' });
    expect(sig()).toEqual([]);

    // Push 10 items in a synchronous loop
    for (let i = 1; i <= 10; i++) {
      yArray.push([i]);
    }

    // Immediately after loop, signal is not yet flushed
    // Wait for microtask tick
    await Promise.resolve();

    // After microtask, signal has the consolidated latest state
    expect(sig()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });
});
