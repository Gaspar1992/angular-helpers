import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { provideStorage } from './providers';
import { SECURE_STORAGE_PASSPHRASE, STORAGE_TRANSPORT } from './tokens/storage.tokens';
import { STORAGE_WORKER_FACTORY } from './tokens/worker.tokens';
import { InMemoryStorageTransport } from './services/transports/in-memory.transport';
import type { StorageTransport } from './services/storage-transport';

@Injectable()
class CustomClassTransport implements StorageTransport {
  read = vi.fn().mockResolvedValue(undefined);
  write = vi.fn().mockResolvedValue(undefined);
  delete = vi.fn().mockResolvedValue(undefined);
}

describe('provideStorage', () => {
  it('provides empty environment providers when called without config', () => {
    TestBed.configureTestingModule({
      providers: [provideStorage()],
    });

    expect(TestBed.inject(SECURE_STORAGE_PASSPHRASE)).toBe(
      'angular-helpers-secure-storage-passphrase',
    );
    expect(TestBed.inject(STORAGE_TRANSPORT, null, { optional: true })).toBeNull();
  });

  it('registers custom passphrase, workerFactory, and transport instance', () => {
    const workerFactory = () => ({}) as Worker;
    const customTransport = new InMemoryStorageTransport();

    TestBed.configureTestingModule({
      providers: [
        provideStorage({
          passphrase: 'custom-secret-passphrase',
          workerFactory,
          transport: customTransport,
        }),
      ],
    });

    expect(TestBed.inject(SECURE_STORAGE_PASSPHRASE)).toBe('custom-secret-passphrase');
    expect(TestBed.inject(STORAGE_WORKER_FACTORY)).toBe(workerFactory);
    expect(TestBed.inject(STORAGE_TRANSPORT)).toBe(customTransport);
  });

  it('registers a transport class via useClass', () => {
    TestBed.configureTestingModule({
      providers: [
        provideStorage({
          transport: CustomClassTransport,
        }),
      ],
    });

    expect(TestBed.inject(STORAGE_TRANSPORT)).toBeInstanceOf(CustomClassTransport);
  });
});
