import {
  createEnvironmentInjector,
  EnvironmentInjector,
  runInInjectionContext,
} from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as Y from 'yjs';
import { injectYjsUndoManager } from './yjs-undo';

describe('injectYjsUndoManager', () => {
  let doc: Y.Doc;
  let yMap: Y.Map<string>;
  let injector: EnvironmentInjector;

  beforeEach(() => {
    doc = new Y.Doc();
    yMap = doc.getMap('test-map');
    injector = createEnvironmentInjector([]);
  });

  it('should initialize with canUndo and canRedo set to false', () => {
    runInInjectionContext(injector, () => {
      const undoRef = injectYjsUndoManager(yMap);

      expect(undoRef.canUndo()).toBe(false);
      expect(undoRef.canRedo()).toBe(false);
    });
  });

  it('should update canUndo when changes are recorded and perform undo/redo operations', () => {
    runInInjectionContext(injector, () => {
      const undoRef = injectYjsUndoManager(yMap);

      // Perform a change
      yMap.set('title', 'Initial Title');
      expect(undoRef.canUndo()).toBe(true);
      expect(undoRef.canRedo()).toBe(false);
      expect(yMap.get('title')).toBe('Initial Title');

      // Perform undo
      undoRef.undo();
      expect(yMap.get('title')).toBeUndefined();
      expect(undoRef.canUndo()).toBe(false);
      expect(undoRef.canRedo()).toBe(true);

      // Perform redo
      undoRef.redo();
      expect(yMap.get('title')).toBe('Initial Title');
      expect(undoRef.canUndo()).toBe(true);
      expect(undoRef.canRedo()).toBe(false);
    });
  });

  it('should clear stack when clear() is called', () => {
    runInInjectionContext(injector, () => {
      const undoRef = injectYjsUndoManager(yMap);

      yMap.set('key', 'value');
      expect(undoRef.canUndo()).toBe(true);

      undoRef.clear();
      expect(undoRef.canUndo()).toBe(false);
      expect(undoRef.canRedo()).toBe(false);
    });
  });

  it('should support ignoredOrigins and stopCapturing', () => {
    runInInjectionContext(injector, () => {
      const undoRef = injectYjsUndoManager(yMap, {
        ignoredOrigins: new Set(['yjs-signal']),
      });

      expect(undoRef.undoManager.trackedOrigins.has('yjs-signal')).toBe(false);

      const stopSpy = vi.spyOn(undoRef.undoManager, 'stopCapturing');
      undoRef.stopCapturing();
      expect(stopSpy).toHaveBeenCalledTimes(1);
    });
  });

  it('should clean up listeners and destroy UndoManager on injector destroy', () => {
    let undoRefInstance: any;

    runInInjectionContext(injector, () => {
      undoRefInstance = injectYjsUndoManager(yMap);
    });

    const offSpy = vi.spyOn(undoRefInstance.undoManager, 'off');
    const destroySpy = vi.spyOn(undoRefInstance.undoManager, 'destroy');

    injector.destroy();

    expect(offSpy).toHaveBeenCalledWith('stack-item-added', expect.any(Function));
    expect(offSpy).toHaveBeenCalledWith('stack-item-popped', expect.any(Function));
    expect(offSpy).toHaveBeenCalledWith('stack-cleared', expect.any(Function));
    expect(destroySpy).toHaveBeenCalledTimes(1);
  });
});
