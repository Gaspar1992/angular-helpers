import { DestroyRef, inject, signal, type Signal } from '@angular/core';
import type { Awareness } from 'y-protocols/awareness';

export interface AwarenessUser<TState = Record<string, any>> {
  clientID: number;
  state: TState;
  isLocal: boolean;
}

export interface YjsAwarenessRef<TState extends Record<string, any> = Record<string, any>> {
  /** Signal emitting the current local user state */
  readonly localState: Signal<TState | null>;
  /** Signal emitting list of all active users (local & remote) with non-null states */
  readonly users: Signal<AwarenessUser<TState>[]>;
  /** Signal emitting list of active remote users (excluding local user) */
  readonly remoteUsers: Signal<AwarenessUser<TState>[]>;
  /** Replace the entire local user awareness state */
  setLocalState(state: TState | null): void;
  /** Update specific fields in the local awareness state */
  patchLocalState(patch: Partial<TState>): void;
}

/**
 * Connects an Angular component or service to a Yjs Awareness protocol instance.
 * Exposes reactive signals for local presence and active remote collaborators.
 *
 * @param awareness The Yjs Awareness instance (e.g. from y-websocket or custom provider)
 * @param initialLocalState Optional initial presence state for the local user
 */
export function injectYjsAwareness<TState extends Record<string, any> = Record<string, any>>(
  awareness: Awareness,
  initialLocalState?: TState,
): YjsAwarenessRef<TState> {
  const destroyRef = inject(DestroyRef);

  const localStateSig = signal<TState | null>(
    initialLocalState ?? (awareness.getLocalState() as TState | null),
  );
  const usersSig = signal<AwarenessUser<TState>[]>([]);
  const remoteUsersSig = signal<AwarenessUser<TState>[]>([]);

  if (initialLocalState !== undefined) {
    awareness.setLocalState(initialLocalState);
  }

  const syncUsers = () => {
    const states = awareness.getStates();
    const localId = awareness.clientID;
    const allUsers: AwarenessUser<TState>[] = [];
    const remoteUsers: AwarenessUser<TState>[] = [];

    states.forEach((state, clientID) => {
      if (state && Object.keys(state).length > 0) {
        const user: AwarenessUser<TState> = {
          clientID,
          state: state as TState,
          isLocal: clientID === localId,
        };
        allUsers.push(user);
        if (!user.isLocal) {
          remoteUsers.push(user);
        }
      }
    });

    usersSig.set(allUsers);
    remoteUsersSig.set(remoteUsers);
    localStateSig.set((awareness.getLocalState() as TState | null) ?? null);
  };

  // Initial sync
  syncUsers();

  const handleUpdate = () => {
    syncUsers();
  };

  awareness.on('change', handleUpdate);

  destroyRef.onDestroy(() => {
    awareness.off('change', handleUpdate);
  });

  return {
    localState: localStateSig.asReadonly(),
    users: usersSig.asReadonly(),
    remoteUsers: remoteUsersSig.asReadonly(),
    setLocalState(state: TState | null) {
      awareness.setLocalState(state);
      localStateSig.set(state);
    },
    patchLocalState(patch: Partial<TState>) {
      const current = (awareness.getLocalState() as TState | null) ?? ({} as TState);
      const updated = { ...current, ...patch };
      awareness.setLocalState(updated);
      localStateSig.set(updated);
    },
  };
}
