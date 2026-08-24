import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { injectClipboard } from './inject-clipboard';

describe('injectClipboard', () => {
  let mockClipboard: any;

  beforeEach(() => {
    mockClipboard = {
      writeText: vi.fn().mockResolvedValue(undefined),
      readText: vi.fn().mockResolvedValue('copied text'),
    };

    vi.stubGlobal('navigator', {
      clipboard: mockClipboard,
    });
    vi.stubGlobal('isSecureContext', true);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should throw when called outside injection context', () => {
    expect(() => injectClipboard()).toThrow(/injectClipboard/);
  });

  it('should support writing and reading text in browser environment', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectClipboard();
      await new Promise((resolve) => queueMicrotask(resolve));

      expect(ref.isSupported()).toBe(true);

      const writeSuccess = await ref.writeText('hello');
      expect(writeSuccess).toBe(true);
      expect(ref.text()).toBe('hello');
      expect(ref.error()).toBeNull();

      const readVal = await ref.readText();
      expect(readVal).toBe('copied text');
      expect(ref.text()).toBe('copied text');
    });
  });

  it('should handle write and read errors', async () => {
    mockClipboard.writeText.mockRejectedValue(new Error('Write denied'));
    mockClipboard.readText.mockRejectedValue(new Error('Read denied'));

    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectClipboard();
      await new Promise((resolve) => queueMicrotask(resolve));

      const writeSuccess = await ref.writeText('hello');
      expect(writeSuccess).toBe(false);
      expect(ref.error()).toBe('Write denied');

      const readVal = await ref.readText();
      expect(readVal).toBeNull();
      expect(ref.error()).toBe('Read denied');
    });
  });

  it('should return error when unsupported on server platform', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectClipboard();
      expect(ref.isSupported()).toBe(false);

      const success = await ref.writeText('test');
      expect(success).toBe(false);
      expect(ref.error()).toBe('Clipboard API not supported');

      const read = await ref.readText();
      expect(read).toBeNull();
    });
  });
});
