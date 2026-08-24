import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { ClipboardService } from './clipboard.service';
import { BrowserCapabilityService } from './browser-capability.service';

describe('ClipboardService', () => {
  let service: ClipboardService;
  let mockClipboard: any;

  beforeEach(() => {
    mockClipboard = {
      writeText: vi.fn().mockResolvedValue(undefined),
      readText: vi.fn().mockResolvedValue('test clipboard content'),
    };

    vi.stubGlobal('navigator', {
      clipboard: mockClipboard,
    });
    vi.stubGlobal('isSecureContext', true);

    TestBed.configureTestingModule({
      providers: [ClipboardService, BrowserCapabilityService],
    });
    service = TestBed.inject(ClipboardService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should be created and verify support', () => {
    expect(service).toBeTruthy();
    expect(service.isSupported()).toBe(true);
  });

  it('should write text to clipboard', async () => {
    await service.writeText('hello world');
    expect(mockClipboard.writeText).toHaveBeenCalledWith('hello world');
  });

  it('should throw and log when writeText fails', async () => {
    mockClipboard.writeText.mockRejectedValue(new Error('Write error'));
    await expect(service.writeText('hello')).rejects.toThrow('Write error');
  });

  it('should read text from clipboard', async () => {
    const text = await service.readText();
    expect(text).toBe('test clipboard content');
    expect(mockClipboard.readText).toHaveBeenCalled();
  });

  it('should throw and log when readText fails', async () => {
    mockClipboard.readText.mockRejectedValue(new Error('Read error'));
    await expect(service.readText()).rejects.toThrow('Read error');
  });

  it('should throw when navigator.clipboard is not available in ensureSupported', async () => {
    vi.stubGlobal('navigator', {});
    await expect(service.writeText('test')).rejects.toThrow(/clipboard API not supported/i);
    await expect(service.readText()).rejects.toThrow(/clipboard API not supported/i);
  });

  it('should throw when on server platform', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        ClipboardService,
        BrowserCapabilityService,
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });
    const serverService = TestBed.inject(ClipboardService);
    expect(serverService.isSupported()).toBe(false);
    await expect(serverService.writeText('test')).rejects.toThrow(/server environment/);
  });
});
