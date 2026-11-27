import { describe, it, expect, vi } from 'vitest';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EntityStore, injectStorageSignal, storageResource, STORAGE_TRANSPORT } from './public-api';
import { PBKDF2_ITERATIONS, encrypt, decrypt } from '../worker/src/utils/crypto.utils';
import type { StorageTransport } from './services/storage-transport';

describe('storage hardening regressions', () => {
  it('enforces OWASP 600,000 PBKDF2 iterations and round-trips v2 encryption', async () => {
    expect(PBKDF2_ITERATIONS).toBe(600_000);
    const cipher = await encrypt('sensitive-payload', 'strong-secret-123');
    expect(cipher.startsWith('v2:')).toBe(true);
    expect(await decrypt(cipher, 'strong-secret-123')).toBe('sensitive-payload');
  });

  it('rolls back optimistic value in storageResource when transport.write throws', async () => {
    const failingTransport: StorageTransport = {
      read: vi.fn().mockResolvedValue('initial'),
      write: vi.fn().mockRejectedValue(new DOMException('QuotaExceededError')),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: STORAGE_TRANSPORT, useValue: failingTransport }],
    });

    const res = TestBed.runInInjectionContext(() =>
      storageResource<string>({
        key: 'rollback-test',
        defaultValue: 'initial',
      }),
    );

    await new Promise((r) => setTimeout(r, 20));
    expect(res.value()).toBe('initial');

    await expect(res.set('next-value')).rejects.toThrow('QuotaExceededError');
    expect(res.value()).toBe('initial');
    expect(res.error()?.message).toContain('QuotaExceededError');
  });

  it('prevents slow initial async read from overwriting newer set() in injectStorageSignal', async () => {
    let resolveRead!: (val: string) => void;
    const slowTransport: StorageTransport = {
      read: vi.fn(
        () =>
          new Promise<string>((resolve) => {
            resolveRead = resolve;
          }),
      ),
      write: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: STORAGE_TRANSPORT, useValue: slowTransport }],
    });

    const sig = TestBed.runInInjectionContext(() =>
      injectStorageSignal('race-key', 'default', { storageType: 'indexeddb' }),
    );

    sig.set('newer-user-value');
    resolveRead('stale-stored-value');
    await Promise.resolve();
    await Promise.resolve();

    expect(sig()).toBe('newer-user-value');
  });

  it('keeps EntityStore.entitySignal(id) reactive across deleteOne and re-add', () => {
    TestBed.configureTestingModule({});
    const store = TestBed.runInInjectionContext(
      () => new EntityStore<string, { id: string; name: string }>({ idKey: 'id' }),
    );

    const itemSig = store.entitySignal('u1');
    store.setOne({ id: 'u1', name: 'Alice' });
    expect(itemSig()?.name).toBe('Alice');

    store.deleteOne('u1');
    expect(itemSig()).toBeUndefined();

    store.setOne({ id: 'u1', name: 'Alice Reborn' });
    expect(itemSig()?.name).toBe('Alice Reborn');
  });

  it('supports BigInt values safely in injectStorageSignal equality check', () => {
    TestBed.configureTestingModule({});
    const sig = TestBed.runInInjectionContext(() =>
      injectStorageSignal<unknown>('bigint-key', 10n, { storageType: 'memory' }),
    );
    expect(() => sig.set(20n)).not.toThrow();
    expect(sig()).toBe(20n);
    const dummy = signal(1);
    expect(dummy()).toBe(1);
  });
});
