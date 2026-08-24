import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as Y from 'yjs';
import { YjsDocService } from './yjs-provider.service';

describe('YjsDocService', () => {
  let service: YjsDocService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [YjsDocService],
    });
    service = TestBed.inject(YjsDocService);
  });

  it('should be created with an initialized Y.Doc instance', () => {
    expect(service).toBeTruthy();
    expect(service.doc).toBeInstanceOf(Y.Doc);
  });

  it('should retrieve a Y.Map by name', () => {
    const map = service.getMap<string>('test-map');
    expect(map).toBeInstanceOf(Y.Map);
    map.set('key', 'value');
    expect(service.doc.getMap('test-map').get('key')).toBe('value');
  });

  it('should retrieve a Y.Array by name', () => {
    const array = service.getArray<number>('test-array');
    expect(array).toBeInstanceOf(Y.Array);
    array.push([1, 2, 3]);
    expect(service.doc.getArray('test-array').toArray()).toEqual([1, 2, 3]);
  });

  it('should retrieve a Y.Text by name', () => {
    const text = service.getText('test-text');
    expect(text).toBeInstanceOf(Y.Text);
    text.insert(0, 'Hello Yjs');
    expect(service.doc.getText('test-text').toString()).toBe('Hello Yjs');
  });

  it('should destroy the Y.Doc when ngOnDestroy is called', () => {
    const destroySpy = vi.spyOn(service.doc, 'destroy');
    service.ngOnDestroy();
    expect(destroySpy).toHaveBeenCalledTimes(1);
  });
});
