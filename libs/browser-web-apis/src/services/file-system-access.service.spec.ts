import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { FileSystemAccessService } from './file-system-access.service';
import { BrowserCapabilityService } from './browser-capability.service';

describe('FileSystemAccessService', () => {
  let service: FileSystemAccessService;
  let mockFileHandle: any;
  let mockWritable: any;

  beforeEach(() => {
    mockWritable = {
      write: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
    };

    const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' });

    mockFileHandle = {
      getFile: vi.fn().mockResolvedValue(mockFile),
      createWritable: vi.fn().mockResolvedValue(mockWritable),
    };

    vi.stubGlobal('showOpenFilePicker', vi.fn().mockResolvedValue([mockFileHandle]));
    vi.stubGlobal('showSaveFilePicker', vi.fn().mockResolvedValue(mockFileHandle));
    vi.stubGlobal('showDirectoryPicker', vi.fn().mockResolvedValue({ name: 'my-dir' }));
    vi.stubGlobal('isSecureContext', true);

    TestBed.configureTestingModule({
      providers: [FileSystemAccessService, BrowserCapabilityService],
    });
    service = TestBed.inject(FileSystemAccessService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should be created and verify support', () => {
    expect(service).toBeTruthy();
    expect(service.isSupported()).toBe(true);
  });

  it('should open file picker and return files', async () => {
    const files = await service.openFile({ multiple: false });
    expect(files.length).toBe(1);
    expect(files[0].name).toBe('test.txt');
  });

  it('should return empty array on AbortError in openFile', async () => {
    const abortErr = new DOMException('User cancelled', 'AbortError');
    vi.stubGlobal('showOpenFilePicker', vi.fn().mockRejectedValue(abortErr));
    const files = await service.openFile();
    expect(files).toEqual([]);
  });

  it('should rethrow non-abort error in openFile', async () => {
    vi.stubGlobal('showOpenFilePicker', vi.fn().mockRejectedValue(new Error('Read failed')));
    await expect(service.openFile()).rejects.toThrow('Read failed');
  });

  it('should save file content to chosen file handle', async () => {
    await service.saveFile('hello world', { suggestedName: 'hello.txt' });
    expect(mockFileHandle.createWritable).toHaveBeenCalled();
    expect(mockWritable.write).toHaveBeenCalledWith('hello world');
    expect(mockWritable.close).toHaveBeenCalled();
  });

  it('should ignore AbortError in saveFile', async () => {
    const abortErr = new DOMException('User cancelled', 'AbortError');
    vi.stubGlobal('showSaveFilePicker', vi.fn().mockRejectedValue(abortErr));
    await expect(service.saveFile('test')).resolves.toBeUndefined();
  });

  it('should open directory picker', async () => {
    const dir = await service.openDirectory({ mode: 'readwrite' });
    expect(dir).toEqual({ name: 'my-dir' });
  });

  it('should return null on AbortError in openDirectory', async () => {
    const abortErr = new DOMException('User cancelled', 'AbortError');
    vi.stubGlobal('showDirectoryPicker', vi.fn().mockRejectedValue(abortErr));
    const dir = await service.openDirectory();
    expect(dir).toBeNull();
  });

  it('should read file as text and array buffer', async () => {
    const file = new File(['file contents'], 'sample.txt');
    const text = await service.readFileAsText(file);
    expect(text).toBe('file contents');

    const buffer = await service.readFileAsArrayBuffer(file);
    expect(buffer).toBeInstanceOf(ArrayBuffer);
  });

  it('should throw error when not in secure context', async () => {
    vi.stubGlobal('isSecureContext', false);
    expect(service.isSupported()).toBe(false);
    await expect(service.openFile()).rejects.toThrow(/secure context/);
  });
});
