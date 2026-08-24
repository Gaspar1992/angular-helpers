import {
  createEnvironmentInjector,
  EnvironmentInjector,
  runInInjectionContext,
} from '@angular/core';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Awareness, encodeAwarenessUpdate, applyAwarenessUpdate } from 'y-protocols/awareness';
import * as Y from 'yjs';
import { injectYjsAwareness } from './yjs-awareness';

describe('injectYjsAwareness', () => {
  let doc: Y.Doc;
  let awareness: Awareness;
  let injector: EnvironmentInjector;

  beforeEach(() => {
    doc = new Y.Doc();
    awareness = new Awareness(doc);
    injector = createEnvironmentInjector([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize local state and reactive signals', () => {
    runInInjectionContext(injector, () => {
      const pres = injectYjsAwareness<{ name: string; color: string }>(awareness, {
        name: 'Gaspar',
        color: '#ff0000',
      });

      expect(pres.localState()).toEqual({ name: 'Gaspar', color: '#ff0000' });
      expect(pres.users()).toHaveLength(1);
      expect(pres.users()[0]).toEqual({
        clientID: awareness.clientID,
        state: { name: 'Gaspar', color: '#ff0000' },
        isLocal: true,
      });
      expect(pres.remoteUsers()).toHaveLength(0);
    });
  });

  it('should update local state via setLocalState and patchLocalState', () => {
    runInInjectionContext(injector, () => {
      const pres = injectYjsAwareness<{ name: string; cursor?: { x: number; y: number } }>(
        awareness,
        {
          name: 'User 1',
        },
      );

      pres.patchLocalState({ cursor: { x: 10, y: 20 } });
      expect(pres.localState()).toEqual({ name: 'User 1', cursor: { x: 10, y: 20 } });

      pres.setLocalState({ name: 'Updated User' });
      expect(pres.localState()).toEqual({ name: 'Updated User' });
    });
  });

  it('should patch local state when initial state is undefined', () => {
    runInInjectionContext(injector, () => {
      const pres = injectYjsAwareness<{ name?: string }>(awareness);
      expect(pres.localState()).toEqual({});

      pres.patchLocalState({ name: 'Patched User' });
      expect(pres.localState()).toEqual({ name: 'Patched User' });
    });
  });

  it('should update users signal when remote clients change awareness state', () => {
    const doc2 = new Y.Doc();
    const remoteAwareness = new Awareness(doc2);

    runInInjectionContext(injector, () => {
      const pres = injectYjsAwareness<{ name: string }>(awareness, { name: 'Local User' });

      // Simulate remote user joining awareness
      remoteAwareness.setLocalState({ name: 'Remote User' });
      applyAwarenessUpdate(
        awareness,
        encodeAwarenessUpdate(remoteAwareness, [remoteAwareness.clientID]),
        'remote',
      );

      expect(pres.users()).toHaveLength(2);
      expect(pres.remoteUsers()).toHaveLength(1);
      expect(pres.remoteUsers()[0].state).toEqual({ name: 'Remote User' });
    });
  });

  it('should re-announce local presence when document becomes visible', () => {
    runInInjectionContext(injector, () => {
      const setLocalStateSpy = vi.spyOn(awareness, 'setLocalState');
      injectYjsAwareness<{ name: string }>(
        awareness,
        { name: 'Gaspar' },
        { autoResyncOnVisibility: true },
      );

      // Simulate visibilitychange event
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        configurable: true,
      });

      document.dispatchEvent(new Event('visibilitychange'));
      expect(setLocalStateSpy).toHaveBeenCalled();
    });
  });

  it('should clean up awareness listeners and reset local state on DestroyRef', () => {
    const offSpy = vi.spyOn(awareness, 'off');
    const setLocalStateSpy = vi.spyOn(awareness, 'setLocalState');

    runInInjectionContext(injector, () => {
      injectYjsAwareness<{ name: string }>(
        awareness,
        { name: 'Cleanup User' },
        { clearOnDestroy: true },
      );
    });

    injector.destroy();

    expect(offSpy).toHaveBeenCalledWith('change', expect.any(Function));
    expect(setLocalStateSpy).toHaveBeenCalledWith(null);
  });

  it('should not clear local state on DestroyRef when clearOnDestroy is false', () => {
    runInInjectionContext(injector, () => {
      injectYjsAwareness<{ name: string }>(
        awareness,
        { name: 'Persisted User' },
        { clearOnDestroy: false, autoResyncOnVisibility: false },
      );
    });

    const setLocalStateSpy = vi.spyOn(awareness, 'setLocalState');
    injector.destroy();

    expect(setLocalStateSpy).not.toHaveBeenCalledWith(null);
  });
});
