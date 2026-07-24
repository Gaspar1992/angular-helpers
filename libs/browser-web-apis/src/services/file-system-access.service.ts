import { Injectable } from '@angular/core';
import { BrowserApiBaseService } from './base/browser-api-base.service';
import type { BrowserCapabilityId } from './browser-capability.service';

export interface FileOpenOptions {
  multiple?: boolean;
  excludeAcceptAllOption?: boolean;
  types?: Array<{
    description?: string;
    accept: Record<string, string[]>;
  }>;
}

export interface FileSaveOptions {
  suggestedName?: string;
  excludeAcceptAllOption?: boolean;
  types?: Array<{
    description?: string;
    accept: Record<string, string[]>;
  }>;
}

interface WindowWithFileSystem extends Window {
  showOpenFilePicker?: (options?: FileOpenOptions) => Promise<FileSystemFileHandle[]>;
  showSaveFilePicker?: (options?: FileSaveOptions) => Promise<FileSystemFileHandle>;
  showDirectoryPicker?: (options?: {
    id?: string;
    mode?: 'read' | 'readwrite';
    startIn?: string;
  }) => Promise<FileSystemDirectoryHandle>;
}

@Injectable()
export class FileSystemAccessService extends BrowserApiBaseService {
  protected override getApiName(): string {
    return 'file-system-access';
  }

  protected override getCapabilityId(): BrowserCapabilityId {
    return 'fileSystemAccess';
  }

  /** Override to also assert secure context (required by the spec). */
  override isSupported(): boolean {
    return super.isSupported() && typeof window !== 'undefined' && window.isSecureContext;
  }

  private get win(): WindowWithFileSystem {
    return window as WindowWithFileSystem;
  }

  protected override ensureSupported(): void {
    super.ensureSupported();
    if (!window.isSecureContext) {
      throw new Error('File System Access API requires a secure context (HTTPS)');
    }
  }

  async openFile(options: FileOpenOptions = {}): Promise<File[]> {
    this.ensureSupported();
    try {
      const handles = await this.win.showOpenFilePicker!(options);
      return Promise.all(handles.map((h) => h.getFile()));
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return [];
      }
      this.logError('Error opening file:', error);
      throw error;
    }
  }

  async saveFile(content: string | Blob, options: FileSaveOptions = {}): Promise<void> {
    this.ensureSupported();
    if (!this.win.showSaveFilePicker) {
      throw new Error('showSaveFilePicker not supported');
    }
    try {
      const handle = await this.win.showSaveFilePicker(options);
      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      this.logError('Error saving file:', error);
      throw error;
    }
  }

  async openDirectory(
    options: {
      id?: string;
      mode?: 'read' | 'readwrite';
      startIn?: string;
    } = {},
  ): Promise<FileSystemDirectoryHandle | null> {
    this.ensureSupported();
    if (!this.win.showDirectoryPicker) {
      throw new Error('showDirectoryPicker not supported');
    }
    try {
      return await this.win.showDirectoryPicker(options);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return null;
      }
      this.logError('Error opening directory:', error);
      throw error;
    }
  }

  async readFileAsText(file: File): Promise<string> {
    return file.text();
  }

  async readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return file.arrayBuffer();
  }
}
