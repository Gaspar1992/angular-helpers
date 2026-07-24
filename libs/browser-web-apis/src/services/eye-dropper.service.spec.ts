import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { EyeDropperService } from './eye-dropper.service';

describe('EyeDropperService', () => {
  let service: EyeDropperService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EyeDropperService],
    });
    service = TestBed.inject(EyeDropperService);

    // Mock window environment properties
    vi.stubGlobal(
      'EyeDropper',
      class MockEyeDropper {
        open = vi.fn().mockResolvedValue({ sRGBHex: '#ff0000' });
      },
    );
    vi.stubGlobal('isSecureContext', true);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should report supported when EyeDropper is in window and is secure context', () => {
    expect(service.isSupported()).toBe(true);
  });

  it('should open dropper and return color', async () => {
    const result = await service.open();
    expect(result.sRGBHex).toBe('#ff0000');
  });

  it('should throw error if not in secure context', async () => {
    vi.stubGlobal('isSecureContext', false);
    vi.stubGlobal('EyeDropper', class {});
    expect(service.isSupported()).toBe(false);
    await expect(service.open()).rejects.toThrow(/secure context/);
  });
});
