import { describe, it, expect } from 'vitest';
import { Component, isSignal, PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import * as Y from 'yjs';
import { yjsSignal, YjsTextDirective } from './public-api';
import { injectYjsWebsocket } from '@angular-helpers/yjs/websocket';

describe('yjs hardening regressions', () => {
  it('preserves Angular [SIGNAL] symbol so isSignal(yjsSignal(...)) returns true', () => {
    const doc = new Y.Doc();
    const yMap = doc.getMap('state');
    TestBed.configureTestingModule({});

    const sig = TestBed.runInInjectionContext(() =>
      yjsSignal<number>(yMap, 'count', { initialValue: 0 }),
    );
    expect(isSignal(sig)).toBe(true);
    sig.set(5);
    expect(sig()).toBe(5);
  });

  it('propagates remote nested Y.Map updates via observeDeep when key is undefined', () => {
    const doc = new Y.Doc();
    const rootMap = doc.getMap<any>('root');
    const nested = new Y.Map<string>();
    nested.set('title', 'v1');
    rootMap.set('meta', nested);

    TestBed.configureTestingModule({});
    const rootSig = TestBed.runInInjectionContext(() =>
      yjsSignal<Record<string, any>>(rootMap, undefined, { batching: 'none' }),
    );

    expect(rootSig()['meta']['title']).toBe('v1');

    doc.transact(() => {
      nested.set('title', 'v2-remote');
    }, 'remote-peer');

    expect(rootSig()['meta']['title']).toBe('v2-remote');
  });

  it('shifts cursor accurately on remote prefix insertion in YjsTextDirective without stealing focus', () => {
    @Component({
      imports: [YjsTextDirective],
      template: `<input [yjsText]="yText" />`,
    })
    class HostComponent {
      doc = new Y.Doc();
      yText = this.doc.getText('editor');
    }

    TestBed.configureTestingModule({ imports: [HostComponent] });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.yText.insert(0, 'world');
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.focus();
    input.setSelectionRange(2, 2); // 'wo|rld'

    fixture.componentInstance.doc.transact(() => {
      fixture.componentInstance.yText.insert(0, 'hello ');
    }, 'remote');

    expect(input.value).toBe('hello world');
    expect(input.selectionStart).toBe(8);
    expect(input.selectionEnd).toBe(8);
  });

  it('guards SSR safely in injectYjsWebsocket', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });

    const doc = new Y.Doc();
    const ref = TestBed.runInInjectionContext(() =>
      injectYjsWebsocket('wss://example.com', 'room', doc),
    );
    expect(ref.provider).toBeNull();
    expect(ref.status()).toBe('disconnected');
  });
});
