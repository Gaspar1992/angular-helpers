import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { injectStorageSignal } from './inject-storage-signal';
import { STORAGE_TRANSPORT, StorageTransport } from '../services/storage-transport';

describe('injectStorageSignal', () => {
  let mockTransport: StorageTransport;

  beforeEach(() => {
    mockTransport = {
      read: vi.fn().mockResolvedValue(undefined),
      write: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: STORAGE_TRANSPORT, useValue: mockTransport }],
    });
  });

  it('debe inicializarse con el valor por defecto si el transporte no tiene datos persistidos', async () => {
    await TestBed.runInInjectionContext(async () => {
      const sig = injectStorageSignal('user-pref', 'light-mode', {
        storageType: 'local',
        serializer: 'json',
      });

      // Al inicio, carga asíncronamente
      expect(sig().data).toBe('light-mode');
      expect(mockTransport.read).toHaveBeenCalledWith('user-pref', false);
    });
  });

  it('debe restaurar el valor persistido asíncronamente desde el transporte L2', async () => {
    mockTransport.read = vi.fn().mockResolvedValue('dark-mode');

    await TestBed.runInInjectionContext(async () => {
      const sig = injectStorageSignal('user-pref', 'light-mode', {
        storageType: 'local',
        serializer: 'json',
      });

      // Esperar a que se resuelva la microtarea del Promise de lectura
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(sig().data).toBe('dark-mode');
      expect(sig().loading).toBe(false);
      expect(sig().error).toBeNull();
    });
  });

  it('debe persistir los cambios reactivamente al escribir en el Signal', async () => {
    await TestBed.runInInjectionContext(async () => {
      const sig = injectStorageSignal('user-pref', 'light-mode', {
        storageType: 'local',
        serializer: 'json',
      });

      sig.set({ data: 'dark-mode', loading: false, error: null });

      expect(sig().data).toBe('dark-mode');
      expect(mockTransport.write).toHaveBeenCalledWith('user-pref', 'dark-mode', false);
    });
  });

  it('debe manejar fallos del transporte elegantemente y mantener el fallback', async () => {
    const error = new Error('IndexedDB bloqueado');
    mockTransport.read = vi.fn().mockRejectedValue(error);

    await TestBed.runInInjectionContext(async () => {
      const sig = injectStorageSignal('secure-data', 'default-value', {
        storageType: 'indexeddb',
        serializer: 'json',
      });

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(sig().data).toBe('default-value');
      expect(sig().loading).toBe(false);
      expect(sig().error).toEqual(error);
    });
  });
});
