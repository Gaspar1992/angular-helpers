import {
  type WritableSignal,
  signal,
  DestroyRef,
  inject,
  assertInInjectionContext,
} from '@angular/core';
import * as Y from 'yjs';

export type YjsBatchingMode = 'none' | 'microtask' | 'animationFrame' | number;

export interface YjsSignalOptions<T = any> {
  /**
   * Optional key when synchronizing a single property of a Y.Map.
   */
  key?: string;

  /**
   * Optional initial value used if the Yjs type or key is not yet populated.
   */
  initialValue?: T;

  /**
   * Optional update batching strategy to consolidate rapid incoming remote events.
   * - 'none': Synchronous signal updates on every event (default).
   * - 'microtask': Consolidates multiple updates within the same JavaScript task via queueMicrotask.
   * - 'animationFrame': Batches updates to screen refresh rate via requestAnimationFrame.
   * - number: Debounces updates by specified milliseconds.
   */
  batching?: YjsBatchingMode;

  /**
   * Optional custom DestroyRef. If omitted and inside an injection context,
   * inject(DestroyRef) will be used to automatically unobserve on destroy.
   */
  destroyRef?: DestroyRef;

  /**
   * Transaction origin label for local changes.
   */
  origin?: string | symbol;
}

/**
 * Extracts a Snapshot JS value from a Yjs shared type.
 */
export function getSnapshot<T>(yType: Y.AbstractType<any> | Y.Doc): T {
  if (yType instanceof Y.Doc) {
    return yType.toJSON() as unknown as T;
  }
  return yType.toJSON() as T;
}

function reconcileMap(yMap: Y.Map<any>, nextValue: Record<string, any>) {
  const nextKeys = new Set(Object.keys(nextValue || {}));
  for (const existingKey of Array.from(yMap.keys())) {
    if (!nextKeys.has(existingKey)) {
      yMap.delete(existingKey);
    }
  }

  if (nextValue && typeof nextValue === 'object') {
    for (const [k, v] of Object.entries(nextValue)) {
      const existingVal = yMap.get(k);

      // Recursive CRDT preservation
      if (existingVal instanceof Y.Map && v && typeof v === 'object' && !Array.isArray(v)) {
        reconcileMap(existingVal, v);
      } else if (existingVal instanceof Y.Array && Array.isArray(v)) {
        reconcileArray(existingVal, v);
      } else if (existingVal instanceof Y.Text && typeof v === 'string') {
        reconcileText(existingVal, v);
      } else if (existingVal !== v) {
        yMap.set(k, v);
      }
    }
  }
}

function reconcileArray(yArray: Y.Array<any>, nextArray: any[]) {
  const currentArray = yArray.toArray();
  if (currentArray.length === 0) {
    if (nextArray.length > 0) {
      yArray.insert(0, nextArray);
    }
    return;
  }
  if (nextArray.length === 0) {
    yArray.delete(0, yArray.length);
    return;
  }

  let start = 0;
  while (
    start < currentArray.length &&
    start < nextArray.length &&
    currentArray[start] === nextArray[start]
  ) {
    start++;
  }

  let oldEnd = currentArray.length;
  let newEnd = nextArray.length;
  while (oldEnd > start && newEnd > start && currentArray[oldEnd - 1] === nextArray[newEnd - 1]) {
    oldEnd--;
    newEnd--;
  }

  const deleteCount = oldEnd - start;
  const insertItems = nextArray.slice(start, newEnd);

  if (deleteCount > 0) {
    yArray.delete(start, deleteCount);
  }
  if (insertItems.length > 0) {
    yArray.insert(start, insertItems);
  }
}

function reconcileText(yText: Y.Text, nextText: string) {
  const currentText = yText.toString();
  if (currentText === nextText) {
    return;
  }
  if (currentText.length === 0) {
    if (nextText.length > 0) {
      yText.insert(0, nextText);
    }
    return;
  }
  if (nextText.length === 0) {
    yText.delete(0, yText.length);
    return;
  }

  let start = 0;
  while (
    start < currentText.length &&
    start < nextText.length &&
    currentText.charCodeAt(start) === nextText.charCodeAt(start)
  ) {
    start++;
  }

  let oldEnd = currentText.length;
  let newEnd = nextText.length;
  while (
    oldEnd > start &&
    newEnd > start &&
    currentText.charCodeAt(oldEnd - 1) === nextText.charCodeAt(newEnd - 1)
  ) {
    oldEnd--;
    newEnd--;
  }

  const deleteCount = oldEnd - start;
  const insertString = nextText.slice(start, newEnd);

  if (deleteCount > 0) {
    yText.delete(start, deleteCount);
  }
  if (insertString.length > 0) {
    yText.insert(start, insertString);
  }
}

/**
 * Creates an Angular WritableSignal that synchronizes bidirectionally with a Yjs shared type
 * (Y.Map, Y.Array, Y.Text) or a single key of a Y.Map.
 *
 * Supports recursive nested CRDT types and configurable batching.
 *
 * @example
 * ```ts
 * const doc = new Y.Doc();
 * const yMap = doc.getMap('settings');
 *
 * // Single property synchronization
 * const title = yjsSignal<string>(yMap, { key: 'title', initialValue: 'Untitled' });
 *
 * // High-throughput stream with microtask batching
 * const metrics = yjsSignal(yArray, { batching: 'microtask' });
 * ```
 */
export function yjsSignal<T>(
  yType: Y.Map<any> | Y.Array<any> | Y.Text,
  options: YjsSignalOptions<T> = {},
): WritableSignal<T> {
  const origin = options.origin ?? 'yjs-signal';
  const doc = yType.doc;
  const key = options.key;
  const batching = options.batching ?? 'none';

  // Initial value resolution & seed if initialValue provided
  let initialValue: T;

  if (key !== undefined && yType instanceof Y.Map) {
    if (yType.has(key)) {
      initialValue = yType.get(key) as T;
    } else if (options.initialValue !== undefined) {
      initialValue = options.initialValue;
      if (doc) {
        doc.transact(() => {
          yType.set(key, initialValue);
        }, origin);
      } else {
        yType.set(key, initialValue);
      }
    } else {
      initialValue = undefined as unknown as T;
    }
  } else {
    const snapshot = getSnapshot<T>(yType);
    const isEmpty =
      yType instanceof Y.Map
        ? yType.size === 0
        : yType instanceof Y.Array
          ? yType.length === 0
          : yType instanceof Y.Text
            ? yType.length === 0
            : false;

    if (isEmpty && options.initialValue !== undefined) {
      initialValue = options.initialValue;
      if (doc) {
        doc.transact(() => {
          if (yType instanceof Y.Map && initialValue && typeof initialValue === 'object') {
            for (const [k, v] of Object.entries(initialValue as Record<string, any>)) {
              yType.set(k, v);
            }
          } else if (yType instanceof Y.Array && Array.isArray(initialValue)) {
            yType.insert(0, initialValue);
          } else if (yType instanceof Y.Text && typeof initialValue === 'string') {
            yType.insert(0, initialValue);
          }
        }, origin);
      }
    } else {
      initialValue = snapshot;
    }
  }

  const sig = signal<T>(initialValue);

  // Batching scheduler state
  let isBatchPending = false;
  let debounceTimeoutId: any = null;

  const applyRemoteUpdate = () => {
    if (key !== undefined && yType instanceof Y.Map) {
      const val = yType.has(key) ? (yType.get(key) as T) : (options.initialValue as T);
      sig.set(val);
    } else {
      sig.set(getSnapshot<T>(yType));
    }
  };

  const scheduleRemoteUpdate = () => {
    if (batching === 'none') {
      applyRemoteUpdate();
    } else if (batching === 'microtask') {
      if (!isBatchPending) {
        isBatchPending = true;
        queueMicrotask(() => {
          isBatchPending = false;
          applyRemoteUpdate();
        });
      }
    } else if (batching === 'animationFrame' && typeof requestAnimationFrame !== 'undefined') {
      if (!isBatchPending) {
        isBatchPending = true;
        requestAnimationFrame(() => {
          isBatchPending = false;
          applyRemoteUpdate();
        });
      }
    } else if (typeof batching === 'number' && batching > 0) {
      if (debounceTimeoutId) {
        clearTimeout(debounceTimeoutId);
      }
      debounceTimeoutId = setTimeout(() => {
        applyRemoteUpdate();
      }, batching);
    } else {
      applyRemoteUpdate();
    }
  };

  // Observer callback for external Yjs changes
  const observer = (event: Y.YEvent<any>, transaction: Y.Transaction) => {
    // Ignore updates originated by this signal's local transactions
    if (transaction.origin === origin) {
      return;
    }

    if (key !== undefined && yType instanceof Y.Map) {
      const mapEvent = event as Y.YMapEvent<any>;
      if (mapEvent.keysChanged?.has(key)) {
        scheduleRemoteUpdate();
      }
    } else {
      scheduleRemoteUpdate();
    }
  };

  yType.observe(observer);

  // Setup automatic cleanup when host component/service destroys
  let cleanupRef = options.destroyRef;
  if (!cleanupRef) {
    try {
      assertInInjectionContext(yjsSignal);
      cleanupRef = inject(DestroyRef);
    } catch {
      // Called outside injection context without explicit destroyRef
    }
  }

  cleanupRef?.onDestroy(() => {
    if (debounceTimeoutId) {
      clearTimeout(debounceTimeoutId);
    }
    yType.unobserve(observer);
  });

  const writable: WritableSignal<T> = Object.assign(() => sig(), {
    set: (value: T) => {
      if (!doc) {
        if (key !== undefined && yType instanceof Y.Map) {
          if (value === undefined) {
            yType.delete(key);
          } else {
            yType.set(key, value);
          }
        }
        sig.set(value);
        return;
      }

      doc.transact(() => {
        if (key !== undefined && yType instanceof Y.Map) {
          if (value === undefined) {
            yType.delete(key);
          } else if (yType.get(key) !== value) {
            yType.set(key, value);
          }
        } else if (yType instanceof Y.Map) {
          reconcileMap(yType, value as Record<string, any>);
        } else if (yType instanceof Y.Array) {
          reconcileArray(yType, Array.isArray(value) ? value : []);
        } else if (yType instanceof Y.Text) {
          reconcileText(yType, typeof value === 'string' ? value : String(value ?? ''));
        }
      }, origin);

      sig.set(value);
    },

    update: (fn: (current: T) => T) => {
      const nextValue = fn(sig());
      writable.set(nextValue);
    },

    asReadonly: () => sig.asReadonly(),
  }) as WritableSignal<T>;

  return writable;
}
