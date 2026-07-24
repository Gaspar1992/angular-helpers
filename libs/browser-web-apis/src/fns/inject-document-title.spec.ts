import { TestBed } from '@angular/core/testing';
import {
  PLATFORM_ID,
  EnvironmentInjector,
  createEnvironmentInjector,
  runInInjectionContext,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { injectDocumentTitle } from './inject-document-title';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('injectDocumentTitle', () => {
  let mockDocument: any;

  beforeEach(() => {
    mockDocument = {
      title: 'Original Title',
    };
  });

  it('should throw an error when called outside an injection context', () => {
    expect(() => injectDocumentTitle()).toThrow(/injectDocumentTitle/);
  });

  it('should be SSR safe and not modify document title', async () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: DOCUMENT, useValue: mockDocument },
      ],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectDocumentTitle('New Title');
      expect(ref.title()).toBe('New Title');
      expect(mockDocument.title).toBe('Original Title');
    });
  });

  it('should sync title signal with document title in browser', async () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: DOCUMENT, useValue: mockDocument },
      ],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectDocumentTitle('Initial Title');
      // Initially, title signal is set
      expect(ref.title()).toBe('Initial Title');

      // Wait for effect to propagate
      TestBed.flushEffects();
      expect(mockDocument.title).toBe('Initial Title');

      // Update the title signal
      ref.title.set('Updated Title');
      TestBed.flushEffects();
      expect(mockDocument.title).toBe('Updated Title');
    });
  });

  it('should restore original title on destroy if restoreOnDestroy is true', async () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: DOCUMENT, useValue: mockDocument },
      ],
    });

    const parentInjector = TestBed.inject(EnvironmentInjector);
    const childInjector = createEnvironmentInjector([], parentInjector);
    let ref: any;

    runInInjectionContext(childInjector, () => {
      ref = injectDocumentTitle('Temporary Title', { restoreOnDestroy: true });
    });

    TestBed.flushEffects();
    expect(mockDocument.title).toBe('Temporary Title');

    childInjector.destroy();
    expect(mockDocument.title).toBe('Original Title');
  });

  it('should NOT restore original title on destroy if restoreOnDestroy is false/omitted', async () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: DOCUMENT, useValue: mockDocument },
      ],
    });

    const parentInjector = TestBed.inject(EnvironmentInjector);
    const childInjector = createEnvironmentInjector([], parentInjector);
    let ref: any;

    runInInjectionContext(childInjector, () => {
      ref = injectDocumentTitle('Temporary Title');
    });

    TestBed.flushEffects();
    expect(mockDocument.title).toBe('Temporary Title');

    childInjector.destroy();
    expect(mockDocument.title).toBe('Temporary Title');
  });
});
