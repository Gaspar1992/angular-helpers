import { TestBed } from '@angular/core/testing';
import { ErrorHandler } from '@angular/core';
import { describe, it, expect, vi } from 'vitest';
import {
  injectErrorBoundaryReporter,
  ERROR_BOUNDARY,
  type ErrorBoundaryHandler,
} from './inject-error-boundary-reporter';

describe('injectErrorBoundaryReporter', () => {
  it('should assert injection context when called outside injection context', () => {
    expect(() => injectErrorBoundaryReporter()).toThrow();
  });

  it('should dispatch error to ERROR_BOUNDARY reportError if provided', () => {
    const mockBoundary: ErrorBoundaryHandler = {
      reportError: vi.fn(),
      handleError: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: ERROR_BOUNDARY, useValue: mockBoundary }],
    });

    TestBed.runInInjectionContext(() => {
      const report = injectErrorBoundaryReporter();
      const testErr = new Error('Test boundary error');
      report(testErr);

      expect(mockBoundary.reportError).toHaveBeenCalledWith(testErr);
      expect(mockBoundary.handleError).not.toHaveBeenCalled();
    });
  });

  it('should fallback to ERROR_BOUNDARY handleError if reportError is not implemented', () => {
    const mockBoundary: ErrorBoundaryHandler = {
      handleError: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: ERROR_BOUNDARY, useValue: mockBoundary }],
    });

    TestBed.runInInjectionContext(() => {
      const report = injectErrorBoundaryReporter();
      const testErr = new Error('Fallback handleError');
      report(testErr);

      expect(mockBoundary.handleError).toHaveBeenCalledWith(testErr);
    });
  });

  it('should fallback to ErrorHandler when ERROR_BOUNDARY is not provided', () => {
    const mockErrorHandler = {
      handleError: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: ErrorHandler, useValue: mockErrorHandler }],
    });

    TestBed.runInInjectionContext(() => {
      const report = injectErrorBoundaryReporter();
      const testErr = new Error('ErrorHandler fallback');
      report(testErr);

      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(testErr);
    });
  });

  it('should rethrow error when options.rethrow is true', () => {
    const mockErrorHandler = {
      handleError: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: ErrorHandler, useValue: mockErrorHandler }],
    });

    TestBed.runInInjectionContext(() => {
      const report = injectErrorBoundaryReporter({ rethrow: true });
      const testErr = new Error('Rethrow test');

      expect(() => report(testErr)).toThrow('Rethrow test');
      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(testErr);
    });
  });
});
