import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import {
  BROWSER_API_EXPERIMENTAL_SILENT,
  warnExperimental,
  resetExperimentalWarnings,
} from './experimental.token';

describe('experimental.token', () => {
  beforeEach(() => {
    resetExperimentalWarnings();
  });

  it('should default BROWSER_API_EXPERIMENTAL_SILENT to false', () => {
    TestBed.configureTestingModule({});
    expect(TestBed.inject(BROWSER_API_EXPERIMENTAL_SILENT)).toBe(false);
  });

  it('should emit warning once per key when silent is false', () => {
    const logger = { warn: vi.fn() };
    warnExperimental('my-api', { silent: false, logger });
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('"my-api"'));

    // Second call for the same key should be a no-op
    warnExperimental('my-api', { silent: false, logger });
    expect(logger.warn).toHaveBeenCalledTimes(1);

    // Different key should emit again
    warnExperimental('other-api', { silent: false, logger });
    expect(logger.warn).toHaveBeenCalledTimes(2);
  });

  it('should not emit warning when silent is true', () => {
    const logger = { warn: vi.fn() };
    warnExperimental('my-api', { silent: true, logger });
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('should reset warnings when resetExperimentalWarnings is called', () => {
    const logger = { warn: vi.fn() };
    warnExperimental('my-api', { silent: false, logger });
    expect(logger.warn).toHaveBeenCalledTimes(1);

    resetExperimentalWarnings();
    warnExperimental('my-api', { silent: false, logger });
    expect(logger.warn).toHaveBeenCalledTimes(2);
  });
});
