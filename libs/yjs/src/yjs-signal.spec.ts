import {
  createEnvironmentInjector,
  EnvironmentInjector,
  runInInjectionContext,
} from '@angular/core';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as Y from 'yjs';
import { getSnapshot, yjsSignal } from './yjs-signal';

describe('yjsSignal', () => {
  let doc: Y.Doc;
  let injector: EnvironmentInjector;

  beforeEach(() => {
    doc = new Y.Doc();
    injector = createEnvironmentInjector([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getSnapshot helper', () => {
    it('should extract JSON snapshot from Y.Doc and shared types', () => {
      const d = new Y.Doc();
      const map = d.getMap('map');
      map.set('a', 1);
      const arr = d.getArray('arr');
      arr.push(['x', 'y']);

      expect(getSnapshot(d)).toEqual({ map: { a: 1 }, arr: ['x', 'y'] });
      expect(getSnapshot(map)).toEqual({ a: 1 });
      expect(getSnapshot(arr)).toEqual(['x', 'y']);
    });
  });

  describe('Y.Map synchronization', () => {
    it('should synchronize Y.Map bidirectionally with Angular Signal', () => {
      const yMap = doc.getMap<string>('profile');
      yMap.set('name', 'Alice');

      const profileSig = yjsSignal<Record<string, string>>(yMap);
      expect(profileSig()).toEqual({ name: 'Alice' });

      // Local signal update via set
      profileSig.set({ name: 'Bob', role: 'Dev' });
      expect(yMap.get('name')).toBe('Bob');
      expect(yMap.get('role')).toBe('Dev');

      // Local signal update via update()
      profileSig.update((curr) => ({ ...curr, role: 'Lead Dev' }));
      expect(yMap.get('role')).toBe('Lead Dev');
      expect(profileSig().role).toBe('Lead Dev');

      // Readonly signal
      const readonlySig = profileSig.asReadonly();
      expect(readonlySig()).toEqual({ name: 'Bob', role: 'Lead Dev' });

      // External Yjs update simulation
      yMap.set('name', 'Charlie');
      expect(profileSig()).toEqual({ name: 'Charlie', role: 'Lead Dev' });

      // Key deletion when setting object with fewer keys
      profileSig.set({ name: 'Charlie' });
      expect(yMap.has('role')).toBe(false);
    });

    it('should seed initial object value when Y.Map is empty', () => {
      const yMap = doc.getMap<any>('settings');
      const sig = yjsSignal<Record<string, any>>(yMap, {
        initialValue: { theme: 'dark', fontSize: 14 },
      });

      expect(sig()).toEqual({ theme: 'dark', fontSize: 14 });
      expect(yMap.get('theme')).toBe('dark');
      expect(yMap.get('fontSize')).toBe(14);
    });

    it('should synchronize a single property when key option is provided', () => {
      const yMap = doc.getMap<string>('settings');

      const titleSig = yjsSignal<string | undefined>(yMap, {
        key: 'title',
        initialValue: 'Default Title',
      });

      expect(titleSig()).toBe('Default Title');
      expect(yMap.get('title')).toBe('Default Title');

      // Update signal
      titleSig.set('Collaborative Doc');
      expect(yMap.get('title')).toBe('Collaborative Doc');

      // Set undefined should delete the key
      titleSig.set(undefined);
      expect(yMap.has('title')).toBe(false);
      expect(titleSig()).toBeUndefined();

      // Setting same value is handled cleanly
      titleSig.set('Same Title');
      titleSig.set('Same Title');
      expect(yMap.get('title')).toBe('Same Title');

      // External Yjs update on target key
      yMap.set('title', 'Remote Changed Title');
      expect(titleSig()).toBe('Remote Changed Title');

      // Unrelated key update does not trigger scheduleRemoteUpdate for this signal
      yMap.set('theme', 'dark');
      expect(titleSig()).toBe('Remote Changed Title');
    });

    it('should read existing key from Y.Map on initialization', () => {
      const yMap = doc.getMap<string>('prepopulated');
      yMap.set('author', 'Linus');

      const authorSig = yjsSignal<string>(yMap, {
        key: 'author',
        initialValue: 'Fallback',
      });

      expect(authorSig()).toBe('Linus');
    });

    it('should handle detached type without doc when setting values', () => {
      const mockMap = Object.create(Y.Map.prototype);
      mockMap.doc = null;
      mockMap.set = vi.fn();
      mockMap.delete = vi.fn();
      mockMap.has = vi.fn(() => false);
      mockMap.get = vi.fn();
      mockMap.observe = vi.fn();
      mockMap.unobserve = vi.fn();
      mockMap.toJSON = vi.fn(() => ({}));

      const singleKeySig = yjsSignal<string | undefined>(mockMap, {
        key: 'testKey',
      });

      singleKeySig.set('mockValue');
      expect(mockMap.set).toHaveBeenCalledWith('testKey', 'mockValue');
      expect(singleKeySig()).toBe('mockValue');

      singleKeySig.set(undefined);
      expect(mockMap.delete).toHaveBeenCalledWith('testKey');
      expect(singleKeySig()).toBeUndefined();
    });
  });

  describe('Y.Array synchronization', () => {
    it('should synchronize Y.Array bidirectionally and handle complex reconciliation', () => {
      const yArray = doc.getArray<number>('numbers');
      yArray.insert(0, [10, 20]);

      const numbersSig = yjsSignal<number[]>(yArray);
      expect(numbersSig()).toEqual([10, 20]);

      // Local signal update
      numbersSig.set([10, 20, 30]);
      expect(yArray.toArray()).toEqual([10, 20, 30]);

      // Replace with empty array
      numbersSig.set([]);
      expect(yArray.toArray()).toEqual([]);

      // Insert into empty array
      numbersSig.set([1, 2, 3]);
      expect(yArray.toArray()).toEqual([1, 2, 3]);

      // Replace array with prefix and suffix matches
      numbersSig.set([1, 99, 3]);
      expect(yArray.toArray()).toEqual([1, 99, 3]);

      // External Yjs update
      yArray.push([40]);
      expect(numbersSig()).toEqual([1, 99, 3, 40]);
    });

    it('should seed initial array when Y.Array is empty', () => {
      const yArray = doc.getArray<string>('tags');
      const sig = yjsSignal<string[]>(yArray, { initialValue: ['alpha', 'beta'] });

      expect(sig()).toEqual(['alpha', 'beta']);
      expect(yArray.toArray()).toEqual(['alpha', 'beta']);
    });
  });

  describe('Y.Text synchronization', () => {
    it('should synchronize Y.Text bidirectionally and reconcile strings', () => {
      const yText = doc.getText('content');
      yText.insert(0, 'Hello');

      const textSig = yjsSignal<string>(yText);
      expect(textSig()).toBe('Hello');

      // Update with append
      textSig.set('Hello World');
      expect(yText.toString()).toBe('Hello World');

      // Update with identical content (no-op)
      textSig.set('Hello World');
      expect(yText.toString()).toBe('Hello World');

      // Clear text
      textSig.set('');
      expect(yText.toString()).toBe('');

      // Insert from empty
      textSig.set('Fresh start');
      expect(yText.toString()).toBe('Fresh start');

      // Change middle of string (common prefix and suffix)
      textSig.set('Fresh great start');
      expect(yText.toString()).toBe('Fresh great start');

      // Delete part of text (deleteCount > 0)
      textSig.set('Fresh start');
      expect(yText.toString()).toBe('Fresh start');

      // External edit
      yText.insert(11, '!');
      expect(textSig()).toBe('Fresh start!');
    });

    it('should seed initial string when Y.Text is empty', () => {
      const yText = doc.getText('note');
      const noteSig = yjsSignal<string>(yText, { initialValue: 'Initial Note Content' });

      expect(noteSig()).toBe('Initial Note Content');
      expect(yText.toString()).toBe('Initial Note Content');
    });
  });

  describe('Nested CRDT preservation', () => {
    it('should preserve nested Y.Map, Y.Array, and Y.Text instances during reconciliation', () => {
      const rootMap = doc.getMap('nestedRoot');
      const childMap = new Y.Map();
      const childArray = new Y.Array();
      const childText = new Y.Text();

      childMap.set('role', 'admin');
      childArray.push(['tag1']);
      childText.insert(0, 'bio description');

      rootMap.set('user', childMap);
      rootMap.set('tags', childArray);
      rootMap.set('bio', childText);

      const sig = yjsSignal<any>(rootMap);

      expect(sig()).toEqual({
        user: { role: 'admin' },
        tags: ['tag1'],
        bio: 'bio description',
      });

      // Update nested structures via root signal
      sig.set({
        user: { role: 'superadmin', active: true },
        tags: ['tag1', 'tag2'],
        bio: 'updated bio description',
      });

      // Assert nested instances are retained
      expect(rootMap.get('user')).toBe(childMap);
      expect(rootMap.get('tags')).toBe(childArray);
      expect(rootMap.get('bio')).toBe(childText);
      expect(childMap.get('role')).toBe('superadmin');
      expect(childMap.get('active')).toBe(true);
      expect(childArray.toArray()).toEqual(['tag1', 'tag2']);
      expect(childText.toString()).toBe('updated bio description');
    });
  });

  describe('Batching modes', () => {
    it('should batch rapid updates with microtask mode', async () => {
      const yArray = doc.getArray<number>('microtask-arr');
      const sig = yjsSignal<number[]>(yArray, { batching: 'microtask' });

      for (let i = 1; i <= 5; i++) {
        yArray.push([i]);
      }

      // Not updated immediately in microtask mode
      expect(sig()).toEqual([]);

      await Promise.resolve();
      expect(sig()).toEqual([1, 2, 3, 4, 5]);
    });

    it('should batch updates with animationFrame mode', async () => {
      vi.useFakeTimers();
      const rafCallbacks: FrameRequestCallback[] = [];
      vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
        rafCallbacks.push(cb);
        return rafCallbacks.length;
      });

      const yArray = doc.getArray<number>('raf-arr');
      const sig = yjsSignal<number[]>(yArray, { batching: 'animationFrame' });

      yArray.push([10]);
      yArray.push([20]);

      expect(sig()).toEqual([]);
      expect(rafCallbacks.length).toBe(1);

      // Trigger animationFrame callback
      rafCallbacks[0](0);
      expect(sig()).toEqual([10, 20]);

      vi.useRealTimers();
      vi.unstubAllGlobals();
    });

    it('should debounce rapid updates when batching is a number (ms)', () => {
      vi.useFakeTimers();
      const yArray = doc.getArray<number>('debounce-arr');
      const sig = yjsSignal<number[]>(yArray, { batching: 100 });

      yArray.push([1]);
      vi.advanceTimersByTime(50);
      expect(sig()).toEqual([]);

      // Second push resets debounce timer
      yArray.push([2]);
      vi.advanceTimersByTime(50);
      expect(sig()).toEqual([]);

      vi.advanceTimersByTime(50);
      expect(sig()).toEqual([1, 2]);

      vi.useRealTimers();
    });
  });

  describe('Undo/Redo integration and DestroyRef cleanup', () => {
    it('should work seamlessly with Y.UndoManager', () => {
      const yMap = doc.getMap<string>('undoMap');
      const undoManager = new Y.UndoManager(yMap, {
        trackedOrigins: new Set(['yjs-signal']),
      });

      const sig = yjsSignal<Record<string, string>>(yMap);

      sig.set({ name: 'First' });
      undoManager.stopCapturing();

      sig.set({ name: 'Second' });
      expect(sig()).toEqual({ name: 'Second' });

      undoManager.undo();
      expect(sig()).toEqual({ name: 'First' });

      undoManager.redo();
      expect(sig()).toEqual({ name: 'Second' });
    });

    it('should clean up observer when DestroyRef is provided or injected', () => {
      const yMap = doc.getMap<string>('destroyMap');
      let sig: any;

      runInInjectionContext(injector, () => {
        sig = yjsSignal<Record<string, string>>(yMap);
      });

      sig.set({ title: 'Before Destroy' });
      expect(sig()).toEqual({ title: 'Before Destroy' });

      // Destroy the injector
      injector.destroy();

      // External update after destroy should no longer update the signal
      yMap.set('title', 'After Destroy');
      expect(sig()).toEqual({ title: 'Before Destroy' });
    });

    it('should cancel pending debounce timeout on destroy', () => {
      vi.useFakeTimers();
      const yArray = doc.getArray<number>('destroy-debounce');
      let sig: any;

      runInInjectionContext(injector, () => {
        sig = yjsSignal<number[]>(yArray, { batching: 200 });
      });

      yArray.push([1]);
      injector.destroy();

      vi.advanceTimersByTime(300);
      // Since it was destroyed before timer fired, signal remains unchanged
      expect(sig()).toEqual([]);

      vi.useRealTimers();
    });

    it('should allow creating signal outside injection context without explicit destroyRef', () => {
      const yMap = doc.getMap<string>('noDiMap');
      const sig = yjsSignal<Record<string, string>>(yMap);
      sig.set({ key: 'val' });
      expect(sig()).toEqual({ key: 'val' });
    });
  });
});
