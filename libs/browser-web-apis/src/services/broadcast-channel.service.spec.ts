import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { firstValueFrom, take } from 'rxjs';
import { BroadcastChannelService } from './broadcast-channel.service';
import { BrowserCapabilityService } from './browser-capability.service';

describe('BroadcastChannelService', () => {
  let service: BroadcastChannelService;
  let mockChannels: Map<string, any>;

  beforeEach(() => {
    mockChannels = new Map();

    class MockBroadcastChannel {
      name: string;
      listeners: Record<string, Set<EventListener>> = {};
      closed = false;

      constructor(name: string) {
        this.name = name;
        this.listeners = { message: new Set(), messageerror: new Set() };
        mockChannels.set(name, this);
      }

      postMessage(data: any) {
        const ev = { data } as MessageEvent;
        this.listeners['message']?.forEach((cb) => cb(ev));
      }

      addEventListener(event: string, cb: EventListener) {
        this.listeners[event]?.add(cb);
      }

      removeEventListener(event: string, cb: EventListener) {
        this.listeners[event]?.delete(cb);
      }

      close() {
        this.closed = true;
      }
    }

    vi.stubGlobal('BroadcastChannel', MockBroadcastChannel);

    TestBed.configureTestingModule({
      providers: [BroadcastChannelService, BrowserCapabilityService],
    });
    service = TestBed.inject(BroadcastChannelService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should be created and verify support', () => {
    expect(service).toBeTruthy();
    expect(service.isSupported()).toBe(true);
  });

  it('should open channel, receive messages and post messages', async () => {
    const channel$ = service.open<string>('chat');
    const promise = firstValueFrom(channel$.pipe(take(1)));
    expect(service.getOpenChannels()).toContain('chat');

    service.post('chat', 'Hello tab 2');

    const msg = await promise;
    expect(msg).toBe('Hello tab 2');
  });

  it('should close specific channel and all channels', () => {
    service.post('ch1', 1);
    service.post('ch2', 2);
    expect(service.getOpenChannels().length).toBe(2);

    service.close('ch1');
    expect(service.getOpenChannels()).toEqual(['ch2']);
    expect(mockChannels.get('ch1').closed).toBe(true);

    service.closeAll();
    expect(service.getOpenChannels().length).toBe(0);
    expect(mockChannels.get('ch2').closed).toBe(true);
  });

  it('should emit error when messageerror event triggers', () => {
    const channel$ = service.open('err-channel');
    let emittedErr: any;
    const sub = channel$.subscribe({ error: (err) => (emittedErr = err) });

    const channelInstance = mockChannels.get('err-channel');
    channelInstance.listeners['messageerror']?.forEach((cb: any) => cb(new Event('messageerror')));

    expect(emittedErr?.message).toBe('BroadcastChannel "err-channel" error');
    sub.unsubscribe();
  });

  it('should throw when on server platform', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        BroadcastChannelService,
        BrowserCapabilityService,
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });
    const serverService = TestBed.inject(BroadcastChannelService);
    expect(serverService.isSupported()).toBe(false);
    expect(() => serverService.post('ch', 'msg')).toThrow(/server environment/);
  });
});
