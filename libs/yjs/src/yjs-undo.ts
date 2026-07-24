import { DestroyRef, inject, signal, type Signal } from '@angular/core';
import * as Y from 'yjs';

export interface YjsUndoOptions {
  /** Specify transaction origins to track for undo/redo */
  trackedOrigins?: Set<any>;
  /** Specify transaction origins to ignore */
  ignoredOrigins?: Set<any>;
  /** Capture timeout in milliseconds (default: 500) */
  captureTimeout?: number;
}

export interface YjsUndoRef {
  /** Signal indicating whether an undo operation is available */
  readonly canUndo: Signal<boolean>;
  /** Signal indicating whether a redo operation is available */
  readonly canRedo: Signal<boolean>;
  /** The underlying Y.UndoManager instance */
  readonly undoManager: Y.UndoManager;
  /** Perform undo operation */
  undo(): void;
  /** Perform redo operation */
  redo(): void;
  /** Clear both undo and redo stacks */
  clear(): void;
  /** Stop capturing current stack item */
  stopCapturing(): void;
}

/**
 * Creates a reactive Angular adapter for Yjs UndoManager.
 * Exposes canUndo and canRedo signals for binding undo/redo UI actions.
 *
 * @param typeScope The Yjs type or array of types to track for undo/redo operations
 * @param options Optional UndoManager configuration options
 */
export function injectYjsUndoManager(
  typeScope: Y.AbstractType<any> | Array<Y.AbstractType<any>>,
  options?: YjsUndoOptions,
): YjsUndoRef {
  const destroyRef = inject(DestroyRef);

  const undoManager = new Y.UndoManager(typeScope, {
    trackedOrigins: options?.trackedOrigins,
    ignoredOrigins: options?.ignoredOrigins,
    captureTimeout: options?.captureTimeout,
  });

  const canUndoSig = signal<boolean>(undoManager.canUndo());
  const canRedoSig = signal<boolean>(undoManager.canRedo());

  const syncState = () => {
    canUndoSig.set(undoManager.canUndo());
    canRedoSig.set(undoManager.canRedo());
  };

  const handleStackChange = () => {
    syncState();
  };

  undoManager.on('stack-item-added', handleStackChange);
  undoManager.on('stack-item-popped', handleStackChange);
  undoManager.on('stack-cleared', handleStackChange);

  destroyRef.onDestroy(() => {
    undoManager.off('stack-item-added', handleStackChange);
    undoManager.off('stack-item-popped', handleStackChange);
    undoManager.off('stack-cleared', handleStackChange);
    undoManager.destroy();
  });

  return {
    canUndo: canUndoSig.asReadonly(),
    canRedo: canRedoSig.asReadonly(),
    undoManager,
    undo() {
      undoManager.undo();
      syncState();
    },
    redo() {
      undoManager.redo();
      syncState();
    },
    clear() {
      undoManager.clear();
      syncState();
    },
    stopCapturing() {
      undoManager.stopCapturing();
    },
  };
}
