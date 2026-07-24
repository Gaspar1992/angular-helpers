import {
  createEnvironmentInjector,
  EnvironmentInjector,
  runInInjectionContext,
} from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import * as Y from 'yjs';
import { injectYjsWebsocket } from './yjs-websocket';

describe('injectYjsWebsocket', () => {
  let doc: Y.Doc;
  let injector: EnvironmentInjector;

  beforeEach(() => {
    doc = new Y.Doc();
    injector = createEnvironmentInjector([]);
  });

  it('should initialize status and synced signals', () => {
    runInInjectionContext(injector, () => {
      const wsRef = injectYjsWebsocket('ws://localhost:1234', 'test-room', doc, { connect: false });

      expect(wsRef.status()).toBe('disconnected');
      expect(wsRef.isSynced()).toBe(false);
      expect(wsRef.provider).toBeDefined();
    });
  });
});
