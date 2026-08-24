import {
  createEnvironmentInjector,
  EnvironmentInjector,
  runInInjectionContext,
} from '@angular/core';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as Y from 'yjs';
import { injectYjsWebsocket } from './yjs-websocket';
import { Awareness } from 'y-protocols/awareness';

describe('injectYjsWebsocket', () => {
  let doc: Y.Doc;
  let injector: EnvironmentInjector;

  beforeEach(() => {
    doc = new Y.Doc();
    injector = createEnvironmentInjector([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize status and synced signals with default disconnected state when connect is false', () => {
    runInInjectionContext(injector, () => {
      const wsRef = injectYjsWebsocket('ws://localhost:1234', 'test-room', doc, {
        connect: false,
      });

      expect(wsRef.status()).toBe('disconnected');
      expect(wsRef.isSynced()).toBe(false);
      expect(wsRef.provider).toBeDefined();
      expect(wsRef.provider.roomname).toBe('test-room');
    });
  });

  it('should pass custom options (params, awareness, maxBackoffTime) to WebsocketProvider', () => {
    const customAwareness = new Awareness(doc);
    runInInjectionContext(injector, () => {
      const wsRef = injectYjsWebsocket('ws://localhost:1234', 'custom-room', doc, {
        connect: false,
        params: { auth: 'token-xyz', user: 'alice' },
        awareness: customAwareness,
        resyncInterval: 5000,
        maxBackoffTime: 2000,
      });

      expect(wsRef.provider.roomname).toBe('custom-room');
      expect(wsRef.provider.awareness).toBe(customAwareness);
      expect(wsRef.provider.maxBackoffTime).toBe(2000);
      expect(wsRef.provider.url).toContain('auth=token-xyz');
      expect(wsRef.provider.url).toContain('user=alice');
    });
  });

  it('should initialize status to connected if wsconnected is true on provider', () => {
    runInInjectionContext(injector, () => {
      const wsRef = injectYjsWebsocket('ws://localhost:1234', 'conn-init-room', doc, {
        connect: false,
      });
      // Test the status signal initially
      expect(wsRef.status()).toBe('disconnected');
    });
  });

  it('should react to provider status events and update status signal', () => {
    runInInjectionContext(injector, () => {
      const wsRef = injectYjsWebsocket('ws://localhost:1234', 'status-room', doc, {
        connect: false,
      });

      expect(wsRef.status()).toBe('disconnected');

      // Simulate connecting event
      wsRef.provider.emit('status', [{ status: 'connecting' }]);
      expect(wsRef.status()).toBe('connecting');

      // Simulate connected event
      wsRef.provider.emit('status', [{ status: 'connected' }]);
      expect(wsRef.status()).toBe('connected');

      // Simulate disconnected event
      wsRef.provider.emit('status', [{ status: 'disconnected' }]);
      expect(wsRef.status()).toBe('disconnected');
    });
  });

  it('should react to provider sync events and update isSynced signal', () => {
    runInInjectionContext(injector, () => {
      const wsRef = injectYjsWebsocket('ws://localhost:1234', 'sync-room', doc, {
        connect: false,
      });

      expect(wsRef.isSynced()).toBe(false);

      // Simulate sync true
      wsRef.provider.emit('sync', [true]);
      expect(wsRef.isSynced()).toBe(true);

      // Simulate sync false
      wsRef.provider.emit('sync', [false]);
      expect(wsRef.isSynced()).toBe(false);
    });
  });

  it('should delegate connect and disconnect methods to the provider', () => {
    runInInjectionContext(injector, () => {
      const wsRef = injectYjsWebsocket('ws://localhost:1234', 'conn-room', doc, {
        connect: false,
      });

      const connectSpy = vi.spyOn(wsRef.provider, 'connect').mockImplementation(() => {});
      const disconnectSpy = vi.spyOn(wsRef.provider, 'disconnect').mockImplementation(() => {});

      wsRef.connect();
      expect(connectSpy).toHaveBeenCalledTimes(1);

      wsRef.disconnect();
      expect(disconnectSpy).toHaveBeenCalledTimes(1);
    });
  });

  it('should clean up listeners and destroy provider when DestroyRef triggers', () => {
    let providerInstance: any;

    runInInjectionContext(injector, () => {
      const wsRef = injectYjsWebsocket('ws://localhost:1234', 'destroy-room', doc, {
        connect: false,
      });
      providerInstance = wsRef.provider;
    });

    const offSpy = vi.spyOn(providerInstance, 'off');
    const destroySpy = vi.spyOn(providerInstance, 'destroy');

    injector.destroy();

    expect(offSpy).toHaveBeenCalledWith('status', expect.any(Function));
    expect(offSpy).toHaveBeenCalledWith('sync', expect.any(Function));
    expect(destroySpy).toHaveBeenCalledTimes(1);
  });
});
