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
});
