import {
  Component,
  DestroyRef,
  Injector,
  createEnvironmentInjector,
  runInInjectionContext,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi } from 'vitest';
import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness';
import { yjsSignal } from './yjs-signal';
import { YjsTextDirective } from './yjs-text.directive';
import { injectYjsUndoManager } from './yjs-undo';
import { injectYjsAwareness } from './yjs-awareness';
import { injectYjsWebsocket } from './yjs-websocket';
import { injectYjsIndexeddb } from './yjs-indexeddb';
import { YjsDocService } from './yjs-provider.service';

describe('Yjs Memory Leaks & Lifecycle Disposal Battery', () => {
  describe('yjsSignal cleanup & observer retention', () => {
    it('should unobserve Y.Map and release observers on DestroyRef execution', () => {
      const doc = new Y.Doc();
      const yMap = doc.getMap<string>('testMap');

      let destroyCallback: (() => void) | null = null;
      const mockDestroyRef: DestroyRef = {
        onDestroy: (fn: () => void) => {
          destroyCallback = fn;
          return () => {};
        },
      };

      const unobserveSpy = vi.spyOn(yMap, 'unobserve');
      const sig = yjsSignal<Record<string, string>>(yMap, {
        destroyRef: mockDestroyRef,
      });

      // Mutating Y.Map updates the signal
      yMap.set('k1', 'v1');
      expect(sig()).toEqual({ k1: 'v1' });

      // Trigger destroy lifecycle
      expect(destroyCallback).not.toBeNull();
      destroyCallback!();

      // unobserve must be called with the registered observer
      expect(unobserveSpy).toHaveBeenCalledTimes(1);

      // Further mutations do not modify signal
      yMap.set('k2', 'v2');
      expect(sig()).toEqual({ k1: 'v1' });
    });

    it('should cleanly unobserve when repeatedly mounting and unmounting signals', () => {
      const doc = new Y.Doc();
      const yText = doc.getText('stream');
      const unobserveSpy = vi.spyOn(yText, 'unobserve');

      for (let i = 0; i < 50; i++) {
        let destroyCb: (() => void) | null = null;
        const mockDestroyRef: DestroyRef = {
          onDestroy: (fn: () => void) => {
            destroyCb = fn;
            return () => {};
          },
        };

        const sig = yjsSignal<string>(yText, {
          destroyRef: mockDestroyRef,
        });
        expect(sig()).toBe('');

        // Simulate component tear down
        destroyCb!();
      }

      expect(unobserveSpy).toHaveBeenCalledTimes(50);
    });

    it('should clean up key-specific Y.Map observer on DestroyRef', () => {
      const doc = new Y.Doc();
      const yMap = doc.getMap<string>('scopedMap');
      const unobserveSpy = vi.spyOn(yMap, 'unobserve');

      let destroyCb: (() => void) | null = null;
      const mockDestroyRef: DestroyRef = {
        onDestroy: (fn: () => void) => {
          destroyCb = fn;
          return () => {};
        },
      };

      const titleSig = yjsSignal<string>(yMap, {
        key: 'title',
        destroyRef: mockDestroyRef,
      });

      expect(titleSig()).toBeUndefined();
      destroyCb!();
      expect(unobserveSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('YjsTextDirective lifecycle disposal', () => {
    @Component({
      template: `<textarea [yjsText]="text()"></textarea>`,
      imports: [YjsTextDirective],
    })
    class DynamicHostComponent {
      readonly text = signal<Y.Text>(new Y.Doc().getText('first'));
    }

    it('should detach previous Y.Text observer when input changes dynamically', async () => {
      await TestBed.configureTestingModule({
        imports: [DynamicHostComponent, YjsTextDirective],
      }).compileComponents();

      const fixture = TestBed.createComponent(DynamicHostComponent);
      fixture.detectChanges();

      const docA = new Y.Doc();
      const yTextA = docA.getText('textA');
      const unobserveSpyA = vi.spyOn(yTextA, 'unobserve');

      const docB = new Y.Doc();
      const yTextB = docB.getText('textB');
      const unobserveSpyB = vi.spyOn(yTextB, 'unobserve');

      // Bind to yTextA
      fixture.componentInstance.text.set(yTextA);
      fixture.detectChanges();

      // Switch binding to yTextB
      fixture.componentInstance.text.set(yTextB);
      fixture.detectChanges();

      // yTextA must be unobserved
      expect(unobserveSpyA).toHaveBeenCalledTimes(1);

      // Destroy host component -> yTextB must be unobserved
      fixture.destroy();
      expect(unobserveSpyB).toHaveBeenCalledTimes(1);
    });
  });

  describe('injectYjsUndoManager lifecycle disposal', () => {
    it('should unregister all UndoManager stack listeners and call destroy() on DestroyRef', () => {
      const doc = new Y.Doc();
      const yText = doc.getText('content');
      const parentInjector = TestBed.inject(Injector);
      const envInjector = createEnvironmentInjector([], parentInjector);

      let undoRef: any;
      runInInjectionContext(envInjector, () => {
        undoRef = injectYjsUndoManager(yText);
      });

      const undoManager = undoRef.undoManager;
      const destroySpy = vi.spyOn(undoManager, 'destroy');
      const offSpy = vi.spyOn(undoManager, 'off');

      // Destroy injector environment
      envInjector.destroy();

      expect(offSpy).toHaveBeenCalledWith('stack-item-added', expect.any(Function));
      expect(offSpy).toHaveBeenCalledWith('stack-item-popped', expect.any(Function));
      expect(offSpy).toHaveBeenCalledWith('stack-cleared', expect.any(Function));
      expect(destroySpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('injectYjsAwareness zombie cleanup & listener disposal', () => {
    it('should unregister awareness change listener and set localState to null on DestroyRef', () => {
      const doc = new Y.Doc();
      const awareness = new Awareness(doc);
      const parentInjector = TestBed.inject(Injector);
      const envInjector = createEnvironmentInjector([], parentInjector);

      const offSpy = vi.spyOn(awareness, 'off');
      const setLocalStateSpy = vi.spyOn(awareness, 'setLocalState');

      runInInjectionContext(envInjector, () => {
        injectYjsAwareness(awareness, { name: 'Alice', color: '#ff0000' });
      });

      expect(awareness.getLocalState()).toEqual({ name: 'Alice', color: '#ff0000' });

      // Destroy environment injector
      envInjector.destroy();

      expect(offSpy).toHaveBeenCalledWith('change', expect.any(Function));
      expect(setLocalStateSpy).toHaveBeenCalledWith(null);
      expect(awareness.getLocalState()).toBeNull();
    });

    it('should respect clearOnDestroy: false if explicit persistence is desired', () => {
      const doc = new Y.Doc();
      const awareness = new Awareness(doc);
      const parentInjector = TestBed.inject(Injector);
      const envInjector = createEnvironmentInjector([], parentInjector);

      runInInjectionContext(envInjector, () => {
        injectYjsAwareness(awareness, { name: 'Bob' }, { clearOnDestroy: false });
      });

      envInjector.destroy();

      // Local state should NOT be wiped
      expect(awareness.getLocalState()).toEqual({ name: 'Bob' });
    });
  });

  describe('injectYjsWebsocket provider disposal', () => {
    it('should detach status & sync listeners and destroy provider on DestroyRef', () => {
      const doc = new Y.Doc();
      const parentInjector = TestBed.inject(Injector);
      const envInjector = createEnvironmentInjector([], parentInjector);

      let wsRef: any;
      runInInjectionContext(envInjector, () => {
        wsRef = injectYjsWebsocket('ws://localhost:1234', 'test-room', doc, {
          connect: false,
        });
      });

      const provider = wsRef.provider;
      const offSpy = vi.spyOn(provider, 'off');
      const destroySpy = vi.spyOn(provider, 'destroy');

      envInjector.destroy();

      expect(offSpy).toHaveBeenCalledWith('status', expect.any(Function));
      expect(offSpy).toHaveBeenCalledWith('sync', expect.any(Function));
      expect(destroySpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('injectYjsIndexeddb provider disposal', () => {
    it('should detach synced listener and destroy provider on DestroyRef', () => {
      const doc = new Y.Doc();
      const parentInjector = TestBed.inject(Injector);
      const envInjector = createEnvironmentInjector([], parentInjector);

      let dbRef: any;
      runInInjectionContext(envInjector, () => {
        dbRef = injectYjsIndexeddb('test_leak_db', doc);
      });

      if (dbRef.provider) {
        const provider = dbRef.provider;
        const offSpy = vi.spyOn(provider, 'off');
        const destroySpy = vi.spyOn(provider, 'destroy');

        envInjector.destroy();

        expect(offSpy).toHaveBeenCalledWith('synced', expect.any(Function));
        expect(destroySpy).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('YjsDocService disposal', () => {
    it('should destroy underlying Y.Doc when service is destroyed', () => {
      const service = new YjsDocService();
      const doc = service.doc;
      const destroySpy = vi.spyOn(doc, 'destroy');

      service.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalledTimes(1);
    });
  });
});
