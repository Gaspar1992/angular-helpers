import {
  WritableSignal,
  signal,
  DestroyRef,
  inject,
  assertInInjectionContext,
} from '@angular/core';
import * as Y from 'yjs';

export interface YjsSignalOptions {
  /**
   * Optional custom DestroyRef. If omitted and inside an injection context,
   * inject(DestroyRef) will be used to automatically unobserve on destroy.
   */
  destroyRef?: DestroyRef;

  /**
   * Transaction origin label for local changes (default: 'yjs-signal').
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

/**
 * Creates an Angular WritableSignal that synchronizes bidirectionally with a Yjs shared type
 * (Y.Map, Y.Array, Y.Text).
 *
 * @example
 * ```ts
 * const doc = new Y.Doc();
 * const yMap = doc.getMap('userProfile');
 * const profile = yjsSignal<{ name: string }>(yMap);
 *
 * // Reading state (reactive signal)
 * console.log(profile().name);
 *
 * // Mutating state (automatically executes inside Y.Doc transaction)
 * profile.update(p => ({ ...p, name: 'Alice' }));
 * ```
 */
export function yjsSignal<T>(
  yType: Y.Map<any> | Y.Array<any> | Y.Text,
  options: YjsSignalOptions = {},
): WritableSignal<T> {
  const origin = options.origin ?? 'yjs-signal';
  const initialValue = getSnapshot<T>(yType);
  const sig = signal<T>(initialValue);

  // Observer callback for external Yjs changes
  const observer = (event: Y.YEvent<any>, transaction: Y.Transaction) => {
    // Ignore updates originated by this signal's local transactions
    if (transaction.origin === origin) {
      return;
    }
    sig.set(getSnapshot<T>(yType));
  };

  yType.observe(observer);

  // Setup automatic cleanup when host component/service destroys
  let cleanupRef = options.destroyRef;
  if (!cleanupRef) {
    try {
      assertInInjectionContext(yjsSignal);
      cleanupRef = inject(DestroyRef);
    } catch {
      // Called outside injection context without explicit destroyRef; caller must handle cleanup if needed.
    }
  }

  cleanupRef?.onDestroy(() => {
    yType.unobserve(observer);
  });

  // Wrap WritableSignal to intercept set/update and sync to Yjs
  const doc = yType.doc;

  const writable: WritableSignal<T> = Object.assign(() => sig(), {
    set: (value: T) => {
      if (!doc) {
        sig.set(value);
        return;
      }

      doc.transact(() => {
        if (yType instanceof Y.Map) {
          yType.clear();
          if (value && typeof value === 'object') {
            for (const [k, v] of Object.entries(value as Record<string, any>)) {
              yType.set(k, v);
            }
          }
        } else if (yType instanceof Y.Array) {
          yType.delete(0, yType.length);
          if (Array.isArray(value)) {
            yType.insert(0, value);
          }
        } else if (yType instanceof Y.Text) {
          yType.delete(0, yType.length);
          if (typeof value === 'string') {
            yType.insert(0, value);
          }
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
