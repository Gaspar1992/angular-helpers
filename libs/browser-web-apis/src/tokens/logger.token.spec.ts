import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import {
  BROWSER_API_LOG_LEVEL,
  BROWSER_API_LOGGER,
  provideBrowserApiLogLevel,
} from './logger.token';

describe('logger.token', () => {
  let debugSpy: ReturnType<typeof vi.spyOn>;
  let infoSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should provide default BROWSER_API_LOG_LEVEL', () => {
    TestBed.configureTestingModule({});
    const level = TestBed.inject(BROWSER_API_LOG_LEVEL);
    expect(['debug', 'warn']).toContain(level);
  });

  it('should log all levels when log level is debug', () => {
    TestBed.configureTestingModule({
      providers: [provideBrowserApiLogLevel('debug')],
    });
    const logger = TestBed.inject(BROWSER_API_LOGGER);

    logger.debug?.('d');
    logger.info('i');
    logger.warn('w');
    const err = new Error('boom');
    logger.error('e', err);

    expect(debugSpy).toHaveBeenCalledWith('d');
    expect(infoSpy).toHaveBeenCalledWith('i');
    expect(warnSpy).toHaveBeenCalledWith('w');
    expect(errorSpy).toHaveBeenCalledWith('e', err);
  });

  it('should gate debug when log level is info', () => {
    TestBed.configureTestingModule({
      providers: [provideBrowserApiLogLevel('info')],
    });
    const logger = TestBed.inject(BROWSER_API_LOGGER);

    logger.debug?.('d');
    logger.info('i');
    logger.warn('w');
    logger.error('e');

    expect(debugSpy).not.toHaveBeenCalled();
    expect(infoSpy).toHaveBeenCalledWith('i');
    expect(warnSpy).toHaveBeenCalledWith('w');
    expect(errorSpy).toHaveBeenCalledWith('e', undefined);
  });

  it('should gate debug and info when log level is warn', () => {
    TestBed.configureTestingModule({
      providers: [provideBrowserApiLogLevel('warn')],
    });
    const logger = TestBed.inject(BROWSER_API_LOGGER);

    logger.debug?.('d');
    logger.info('i');
    logger.warn('w');
    logger.error('e');

    expect(debugSpy).not.toHaveBeenCalled();
    expect(infoSpy).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith('w');
    expect(errorSpy).toHaveBeenCalledWith('e', undefined);
  });

  it('should only log error when log level is error', () => {
    TestBed.configureTestingModule({
      providers: [provideBrowserApiLogLevel('error')],
    });
    const logger = TestBed.inject(BROWSER_API_LOGGER);

    logger.debug?.('d');
    logger.info('i');
    logger.warn('w');
    logger.error('e');

    expect(debugSpy).not.toHaveBeenCalled();
    expect(infoSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith('e', undefined);
  });

  it('should silence all logs when log level is silent', () => {
    TestBed.configureTestingModule({
      providers: [provideBrowserApiLogLevel('silent')],
    });
    const logger = TestBed.inject(BROWSER_API_LOGGER);

    logger.debug?.('d');
    logger.info('i');
    logger.warn('w');
    logger.error('e');

    expect(debugSpy).not.toHaveBeenCalled();
    expect(infoSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
