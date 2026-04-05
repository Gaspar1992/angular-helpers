import { InjectionToken, inject, Injectable, Provider } from '@angular/core';

/**
 * Log levels for configurable logging
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

/**
 * Configuration for the logging system
 */
export interface LogConfig {
  /** Minimum log level to output */
  level: LogLevel;
  /** Prefix for all log messages */
  prefix: string;
  /** Whether to include timestamps */
  includeTimestamp: boolean;
  /** Custom log handler (optional) */
  customHandler?: (level: LogLevel, message: string, ...args: unknown[]) => void;
}

/**
 * Default logging configuration
 */
export const DEFAULT_LOG_CONFIG: LogConfig = {
  level: 'error',
  prefix: '[AH]',
  includeTimestamp: false,
};

/**
 * Injection token for log configuration
 */
export const LOG_CONFIG = new InjectionToken<LogConfig>('ah.log.config', {
  factory: () => DEFAULT_LOG_CONFIG,
});

/**
 * Priority levels for comparison
 */
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

/**
 * Injectable logging service for browser-web-apis
 */
@Injectable({ providedIn: 'root' })
export class BrowserApiLogger {
  private config = inject(LOG_CONFIG);

  /**
   * Check if a log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.config.level];
  }

  /**
   * Format a log message with optional timestamp and prefix
   */
  private formatMessage(apiName: string, message: string): string {
    const parts: string[] = [];

    if (this.config.includeTimestamp) {
      parts.push(`[${new Date().toISOString()}]`);
    }

    parts.push(`${this.config.prefix}[${apiName}]`);
    parts.push(message);

    return parts.join(' ');
  }

  /**
   * Log a debug message
   */
  debug(apiName: string, message: string, ...args: unknown[]): void {
    if (!this.shouldLog('debug')) return;

    const formatted = this.formatMessage(apiName, message);

    if (this.config.customHandler) {
      this.config.customHandler('debug', formatted, ...args);
    } else {
      console.debug(formatted, ...args);
    }
  }

  /**
   * Log an info message
   */
  info(apiName: string, message: string, ...args: unknown[]): void {
    if (!this.shouldLog('info')) return;

    const formatted = this.formatMessage(apiName, message);

    if (this.config.customHandler) {
      this.config.customHandler('info', formatted, ...args);
    } else {
      console.info(formatted, ...args);
    }
  }

  /**
   * Log a warning message
   */
  warn(apiName: string, message: string, ...args: unknown[]): void {
    if (!this.shouldLog('warn')) return;

    const formatted = this.formatMessage(apiName, message);

    if (this.config.customHandler) {
      this.config.customHandler('warn', formatted, ...args);
    } else {
      console.warn(formatted, ...args);
    }
  }

  /**
   * Log an error message
   */
  error(apiName: string, message: string, ...args: unknown[]): void {
    if (!this.shouldLog('error')) return;

    const formatted = this.formatMessage(apiName, message);

    if (this.config.customHandler) {
      this.config.customHandler('error', formatted, ...args);
    } else {
      console.error(formatted, ...args);
    }
  }
}

/**
 * Provide custom log configuration
 */
export function provideLogConfig(config: Partial<LogConfig>): Provider {
  return {
    provide: LOG_CONFIG,
    useValue: { ...DEFAULT_LOG_CONFIG, ...config },
  };
}

/**
 * Create a logger instance for a specific API
 * @internal
 */
export function createApiLogger(apiName: string) {
  const logger = inject(BrowserApiLogger);

  return {
    debug: (message: string, ...args: unknown[]) => logger.debug(apiName, message, ...args),
    info: (message: string, ...args: unknown[]) => logger.info(apiName, message, ...args),
    warn: (message: string, ...args: unknown[]) => logger.warn(apiName, message, ...args),
    error: (message: string, ...args: unknown[]) => logger.error(apiName, message, ...args),
  };
}

/**
 * Type for the API logger
 */
export type ApiLogger = ReturnType<typeof createApiLogger>;
