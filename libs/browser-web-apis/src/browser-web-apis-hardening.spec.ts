import { describe, it, expect, vi, afterEach } from 'vitest';
import { Component, PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  BarcodeDetectorService as MainBarcodeDetectorService,
  CredentialManagementService as MainCredentialManagementService,
  WebBluetoothService as MainWebBluetoothService,
  FullscreenService,
  ScreenWakeLockService,
  WebStorageService,
  CopyButtonDirective,
  VoiceInputDirective,
  ClipboardService,
  SpeechRecognitionService,
  BROWSER_API_LOGGER,
} from './public-api';
import {
  BarcodeDetectorService as ExpBarcodeDetectorService,
  CredentialManagementService as ExpCredentialManagementService,
  WebBluetoothService as ExpWebBluetoothService,
} from '@angular-helpers/browser-web-apis/experimental';
import { WebSocketClient } from './clients/web-socket.client';
import { LiveAnnouncerService } from './services/live-announcer.service';

describe('browser-web-apis hardening regressions', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shares identical DI tokens between main and experimental entrypoints', () => {
    expect(ExpBarcodeDetectorService).toBe(MainBarcodeDetectorService);
    expect(ExpCredentialManagementService).toBe(MainCredentialManagementService);
    expect(ExpWebBluetoothService).toBe(MainWebBluetoothService);
  });

  it('does not throw ReferenceError on SSR in FullscreenService.request() and ScreenWakeLockService.watchStatus()', async () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'server' },
        FullscreenService,
        ScreenWakeLockService,
      ],
    });

    const fullscreen = TestBed.inject(FullscreenService);
    await expect(fullscreen.request()).rejects.toThrow('Fullscreen API not supported');

    const wakeLock = TestBed.inject(ScreenWakeLockService);
    const statuses: boolean[] = [];
    let completed = false;
    wakeLock.watchStatus().subscribe({
      next: (s) => statuses.push(s.active),
      complete: () => {
        completed = true;
      },
    });
    expect(statuses).toEqual([false]);
    expect(completed).toBe(true);
  });

  it('completes messages$ when WebSocketClient.close() is called', () => {
    const originalWebSocket = globalThis.WebSocket;
    globalThis.WebSocket = class {
      readyState = 1;
      close = vi.fn();
    } as unknown as typeof WebSocket;

    try {
      const client = new WebSocketClient(
        { url: 'wss://example.com' },
        { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
      );
      let completed = false;
      client.messages$.subscribe({
        complete: () => {
          completed = true;
        },
      });

      client.close();
      expect(completed).toBe(true);
    } finally {
      globalThis.WebSocket = originalWebSocket;
    }
  });

  it('emits every synchronous write in WebStorageService.getStorageEvents() without coalescing', () => {
    TestBed.configureTestingModule({
      providers: [
        WebStorageService,
        {
          provide: BROWSER_API_LOGGER,
          useValue: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
        },
      ],
    });

    const storage = TestBed.inject(WebStorageService);
    const keys: Array<string | null> = [];
    const sub = storage.getStorageEvents().subscribe((e) => keys.push(e.key));

    storage.local.set('k1', 'v1');
    storage.local.set('k2', 'v2');

    expect(keys).toEqual(['k1', 'k2']);
    sub.unsubscribe();
  });

  it('uses English defaults and shared LiveAnnouncerService in CopyButtonDirective and VoiceInputDirective', async () => {
    @Component({
      imports: [CopyButtonDirective, VoiceInputDirective],
      template: `
        <button copyButton [copyText]="'hello'">Copy</button>
        <input voiceInput />
      `,
    })
    class HostComponent {}

    const writeText = vi.fn().mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        { provide: ClipboardService, useValue: { writeText } },
        {
          provide: SpeechRecognitionService,
          useValue: {
            transcript: () => '',
            isListening: () => false,
            error: () => null,
            start: vi.fn(),
            stop: vi.fn(),
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const announcer = TestBed.inject(LiveAnnouncerService);
    const announceSpy = vi.spyOn(announcer, 'announce');

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    await Promise.resolve();

    expect(writeText).toHaveBeenCalledWith('hello');
    expect(announceSpy).toHaveBeenCalledWith('Copied to clipboard');
  });
});
