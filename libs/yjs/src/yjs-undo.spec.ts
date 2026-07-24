import {
  createEnvironmentInjector,
  EnvironmentInjector,
  runInInjectionContext,
} from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
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
});
