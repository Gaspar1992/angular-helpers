import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { injectStorageSignal } from './inject-storage-signal';
import { STORAGE_TRANSPORT, StorageTransport } from '../services/storage-transport';

describe('injectStorageSignal drift validation', () => {
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

  it('should accept valid data according to the schema validator', async () => {
    const validData = { id: 42, role: 'admin' };
    mockTransport.read = vi.fn().mockResolvedValue(validData);

    const validator = (data: any): data is typeof validData => {
      return typeof data === 'object' && data !== null && 'id' in data && 'role' in data;
    };

    await TestBed.runInInjectionContext(async () => {
      const sig = injectStorageSignal(
        'session-user',
        { id: 0, role: 'guest' },
        {
          storageType: 'local',
          serializer: 'json',
          validator,
        },
      );

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(sig()).toEqual(validData);
      expect(sig.error()).toBeNull();
      expect(mockTransport.write).not.toHaveBeenCalled();
    });
  });

  it('should reject invalid data, fallback to default, set error, and run auto-repair write', async () => {
    // Bad data structure (e.g. from an older version of the app)
    const oldCorruptData = { legacyId: 'old-123' };
    mockTransport.read = vi.fn().mockResolvedValue(oldCorruptData);

    interface UserSession {
      id: number;
      role: string;
    }

    const defaultSession: UserSession = { id: 0, role: 'guest' };

    const validator = (data: any): data is UserSession => {
      return typeof data === 'object' && data !== null && 'id' in data && 'role' in data;
    };

    await TestBed.runInInjectionContext(async () => {
      const opts = {
        storageType: 'local',
        serializer: 'json',
        validator,
      } as const;

      const sig = injectStorageSignal('session-user', defaultSession, opts);

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Assert that it fell back to the defaultSession
      expect(sig()).toEqual(defaultSession);

      // Assert that the drift error was set
      expect(sig.error()).not.toBeNull();
      expect(sig.error()?.message).toContain('Schema drift detected');

      // Assert that auto-repair write was triggered with the default session
      expect(mockTransport.write).toHaveBeenCalledWith('session-user', defaultSession, opts);
    });
  });
});
