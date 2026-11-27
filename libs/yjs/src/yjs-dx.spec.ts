import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, afterEach } from 'vitest';
import { YjsDocService, provideYjsDoc, YJS_DOC } from './public-api';

describe('Yjs DX (T2)', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('YjsDocService manages named multi-docs and cleans them up', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });

    const service = TestBed.inject(YjsDocService);
    const roomA = service.getDoc('room-a');
    const roomA2 = service.getDoc('room-a');
    const roomB = service.getDoc('room-b');

    expect(roomA).toBe(roomA2);
    expect(roomA).not.toBe(roomB);
    expect(service.hasDoc('room-a')).toBe(true);

    service.destroyDoc('room-a');
    expect(service.hasDoc('room-a')).toBe(false);
    expect(service.hasDoc('room-b')).toBe(true);
  });

  it('provideYjsDoc injects a named Y.Doc via YJS_DOC token', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideYjsDoc('collab-room')],
    });

    const service = TestBed.inject(YjsDocService);
    const injectedDoc = TestBed.inject(YJS_DOC);

    expect(injectedDoc).toBe(service.getDoc('collab-room'));
  });
});
