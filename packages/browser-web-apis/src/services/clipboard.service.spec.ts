import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { ClipboardService } from './clipboard.service';

describe('ClipboardService', () => {
  let service: ClipboardService;
  let mockClipboard: any;
  let mockNavigator: any;

  beforeEach(() => {
    mockClipboard = {
      writeText: vi.fn(),
      readText: vi.fn(),
      write: vi.fn(),
      read: vi.fn()
    };

    mockNavigator = {
      clipboard: mockClipboard
    };

    // Mock global browser objects
    global.navigator = mockNavigator;
    global.window = {} as any;

    TestBed.configureTestingModule({
      providers: [
        ClipboardService,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });
    service = TestBed.inject(ClipboardService);
  });

  describe('writeText', () => {
    it('should write text to clipboard successfully', async () => {
      const text = 'Hello, World!';
      mockClipboard.writeText.mockResolvedValue();

      await service.writeText(text);

      expect(mockClipboard.writeText).toHaveBeenCalledWith(text);
      expect(service.clipboardContent$()).toBe(text);
    });

    it('should handle writeText error', async () => {
      const text = 'Hello, World!';
      const error = new Error('Write failed');
      mockClipboard.writeText.mockRejectedValue(error);

      await expect(service.writeText(text)).rejects.toThrow('Write failed');
    });

    it('should throw error in server environment', async () => {
      // Mock server environment
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          ClipboardService,
          { provide: PLATFORM_ID, useValue: 'server' }
        ]
      });
      const serverService = TestBed.inject(ClipboardService);

      await expect(serverService.writeText('test')).rejects.toThrow(
        'Clipboard API not supported or not available in server environment'
      );
    });

    it('should throw error when clipboard is not supported', async () => {
      global.navigator = { clipboard: undefined } as any;

      await expect(service.writeText('test')).rejects.toThrow(
        'Clipboard API not supported or not available in server environment'
      );
    });
  });

  describe('readText', () => {
    it('should read text from clipboard successfully', async () => {
      const expectedText = 'Clipboard content';
      mockClipboard.readText.mockResolvedValue(expectedText);

      const result = await service.readText();

      expect(result).toBe(expectedText);
      expect(mockClipboard.readText).toHaveBeenCalled();
      expect(service.clipboardContent$()).toBe(expectedText);
    });

    it('should handle readText error', async () => {
      const error = new Error('Read failed');
      mockClipboard.readText.mockRejectedValue(error);

      await expect(service.readText()).rejects.toThrow('Read failed');
    });

    it('should throw error in server environment', async () => {
      // Mock server environment
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          ClipboardService,
          { provide: PLATFORM_ID, useValue: 'server' }
        ]
      });
      const serverService = TestBed.inject(ClipboardService);

      await expect(serverService.readText()).rejects.toThrow(
        'Clipboard API not supported or not available in server environment'
      );
    });

    it('should throw error when clipboard is not supported', async () => {
      global.navigator = { clipboard: undefined } as any;

      await expect(service.readText()).rejects.toThrow(
        'Clipboard API not supported or not available in server environment'
      );
    });
  });

  describe('write', () => {
    it('should write data to clipboard successfully', async () => {
      const data = new ClipboardItem({
        'text/plain': new Blob(['Hello'], { type: 'text/plain' })
      });
      mockClipboard.write.mockResolvedValue();

      await service.write([data]);

      expect(mockClipboard.write).toHaveBeenCalledWith([data]);
    });

    it('should handle write error', async () => {
      const data = new ClipboardItem({
        'text/plain': new Blob(['Hello'], { type: 'text/plain' })
      });
      const error = new Error('Write failed');
      mockClipboard.write.mockRejectedValue(error);

      await expect(service.write([data])).rejects.toThrow('Write failed');
    });
  });

  describe('read', () => {
    it('should read data from clipboard successfully', async () => {
      const expectedData = [
        new ClipboardItem({
          'text/plain': new Blob(['Hello'], { type: 'text/plain' })
        })
      ];
      mockClipboard.read.mockResolvedValue(expectedData);

      const result = await service.read();

      expect(result).toEqual(expectedData);
      expect(mockClipboard.read).toHaveBeenCalled();
    });

    it('should handle read error', async () => {
      const error = new Error('Read failed');
      mockClipboard.read.mockRejectedValue(error);

      await expect(service.read()).rejects.toThrow('Read failed');
    });
  });

  describe('copyText', () => {
    it('should copy text using writeText', async () => {
      const text = 'Copy this text';
      mockClipboard.writeText.mockResolvedValue();

      await service.copyText(text);

      expect(mockClipboard.writeText).toHaveBeenCalledWith(text);
    });
  });

  describe('pasteText', () => {
    it('should paste text using readText', async () => {
      const expectedText = 'Pasted text';
      mockClipboard.readText.mockResolvedValue(expectedText);

      const result = await service.pasteText();

      expect(result).toBe(expectedText);
      expect(mockClipboard.readText).toHaveBeenCalled();
    });
  });

  describe('copyImage', () => {
    it('should copy image blob to clipboard', async () => {
      const imageBlob = new Blob(['image data'], { type: 'image/png' });
      mockClipboard.write.mockResolvedValue();

      await service.copyImage(imageBlob);

      expect(mockClipboard.write).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.any(ClipboardItem)
        ])
      );
    });

    it('should throw error in server environment', async () => {
      // Mock server environment
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          ClipboardService,
          { provide: PLATFORM_ID, useValue: 'server' }
        ]
      });
      const serverService = TestBed.inject(ClipboardService);
      const imageBlob = new Blob(['image data'], { type: 'image/png' });

      await expect(serverService.copyImage(imageBlob)).rejects.toThrow(
        'Clipboard API not available in server environment'
      );
    });

    it('should handle copyImage error', async () => {
      const imageBlob = new Blob(['image data'], { type: 'image/png' });
      const error = new Error('Failed to copy image');
      mockClipboard.write.mockRejectedValue(error);

      await expect(service.copyImage(imageBlob)).rejects.toThrow('Failed to copy image');
    });
  });

  describe('isSupported', () => {
    it('should return true when clipboard API is available', () => {
      expect(service.isSupported()).toBe(true);
    });

    it('should return false when clipboard is not available', () => {
      global.navigator = { clipboard: undefined } as any;

      expect(service.isSupported()).toBe(false);
    });

    it('should return false when navigator is not available', () => {
      global.navigator = null as any;

      expect(service.isSupported()).toBe(false);
    });

    it('should return false in server environment', () => {
      // Mock server environment
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          ClipboardService,
          { provide: PLATFORM_ID, useValue: 'server' }
        ]
      });
      const serverService = TestBed.inject(ClipboardService);

      expect(serverService.isSupported()).toBe(false);
    });
  });

  describe('signals', () => {
    it('should expose readonly signal for clipboard content', () => {
      expect(service.clipboardContent$).toBeDefined();
    });

    it('should update clipboard content signal when writing', async () => {
      const text = 'New content';
      mockClipboard.writeText.mockResolvedValue();

      await service.writeText(text);

      expect(service.clipboardContent$()).toBe(text);
    });

    it('should update clipboard content signal when reading', async () => {
      const text = 'Read content';
      mockClipboard.readText.mockResolvedValue(text);

      await service.readText();

      expect(service.clipboardContent$()).toBe(text);
    });
  });

  describe('error handling', () => {
    it('should handle navigator not available', async () => {
      global.navigator = null as any;

      await expect(service.writeText('test')).rejects.toThrow(
        'Clipboard API not supported or not available in server environment'
      );

      await expect(service.readText()).rejects.toThrow(
        'Clipboard API not supported or not available in server environment'
      );
    });

    it('should handle clipboard not available', async () => {
      global.navigator = { clipboard: undefined } as any;

      await expect(service.writeText('test')).rejects.toThrow(
        'Clipboard API not supported or not available in server environment'
      );

      await expect(service.readText()).rejects.toThrow(
        'Clipboard API not supported or not available in server environment'
      );
    });

    it('should handle clipboard operations errors', async () => {
      const writeError = new Error('Write operation failed');
      const readError = new Error('Read operation failed');
      
      mockClipboard.writeText.mockRejectedValue(writeError);
      mockClipboard.readText.mockRejectedValue(readError);

      await expect(service.writeText('test')).rejects.toThrow('Write operation failed');
      await expect(service.readText()).rejects.toThrow('Read operation failed');
    });
  });
});
